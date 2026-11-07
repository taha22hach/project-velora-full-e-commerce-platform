begin;

-- Existing customer records remain attached. New guest orders store NULL user IDs.
alter table public.addresses add column if not exists governorate text;
alter table public.addresses alter column user_id drop not null;
alter table public.addresses drop constraint if exists addresses_user_id_fkey;
alter table public.addresses
  add constraint addresses_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.orders alter column user_id drop not null;
alter table public.orders add column if not exists guest_confirmation_token_hash text;
alter table public.orders drop constraint if exists orders_guest_confirmation_token_hash_format;
alter table public.orders
  add constraint orders_guest_confirmation_token_hash_format
  check (guest_confirmation_token_hash is null or guest_confirmation_token_hash ~ '^[0-9a-f]{64}$');
alter table public.orders drop constraint if exists orders_guest_identity_check;
alter table public.orders
  add constraint orders_guest_identity_check
  check ((user_id is not null and guest_confirmation_token_hash is null)
      or (user_id is null and guest_confirmation_token_hash is not null));

alter table public.coupon_usages alter column user_id drop not null;
alter table public.coupon_usages add column if not exists guest_identity_hash text;
alter table public.coupon_usages drop constraint if exists coupon_usages_guest_identity_hash_format;
alter table public.coupon_usages
  add constraint coupon_usages_guest_identity_hash_format
  check (guest_identity_hash is null or guest_identity_hash ~ '^[0-9a-f]{64}$');
alter table public.coupon_usages drop constraint if exists coupon_usages_identity_check;
alter table public.coupon_usages
  add constraint coupon_usages_identity_check
  check ((user_id is not null and guest_identity_hash is null)
      or (user_id is null and guest_identity_hash is not null));
create index if not exists coupon_usages_guest_coupon_idx
  on public.coupon_usages(coupon_id, guest_identity_hash)
  where guest_identity_hash is not null;

-- Persistent, atomic edge-identity rate limits for guest order attempts.
create table if not exists public.guest_checkout_rate_limits (
  identity_hash text primary key check (identity_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  window_count integer not null check (window_count > 0),
  day_start timestamptz not null,
  day_count integer not null check (day_count > 0),
  updated_at timestamptz not null default now()
);
create index if not exists guest_checkout_rate_limits_updated_idx
  on public.guest_checkout_rate_limits(updated_at);
alter table public.guest_checkout_rate_limits enable row level security;
revoke all on public.guest_checkout_rate_limits from public, anon, authenticated, service_role;

-- Internal transaction body shared by authenticated checkout and the server-only guest RPC.
create or replace function public.place_order_core(
  p_items jsonb,
  p_address jsonb,
  p_coupon_code text,
  p_payment_method text,
  p_user_id uuid,
  p_guest_identity_hash text,
  p_guest_confirmation_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user uuid := p_user_id;
  v_profile public.profiles%rowtype;
  v_merchant boolean := false;
  v_application public.wholesale_applications%rowtype;
  v_address public.addresses%rowtype;
  v_coupon public.coupons%rowtype;
  v_coupon_id uuid;
  v_discount numeric(12,2) := 0;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_shipping_fee numeric(12,2) := 60;
  v_free_shipping_minimum numeric(12,2) := 1500;
  v_total numeric(12,2) := 0;
  v_quantity integer;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_variant_id uuid;
  v_variant_name text;
  v_variant_sku text;
  v_price_modifier numeric(12,2) := 0;
  v_available integer;
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_wholesale public.wholesale_pricing%rowtype;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_item_count integer;
  v_coupon_uses integer;
  v_distinct_items integer;
begin
  if v_user is null then
    if auth.jwt()->>'role' is distinct from 'service_role'
       or p_guest_identity_hash is null
       or p_guest_identity_hash !~ '^[0-9a-f]{64}$'
       or p_guest_confirmation_token_hash is null
       or p_guest_confirmation_token_hash !~ '^[0-9a-f]{64}$' then
      raise exception 'AUTH_REQUIRED: guest checkout must use the trusted server route';
    end if;
  else
    if v_user is distinct from auth.uid() or auth.jwt()->>'role' is distinct from 'authenticated' then
      raise exception 'AUTH_REQUIRED: signed-in checkout identity is invalid';
    end if;
    select * into v_profile from public.profiles where id = v_user for update;
    if not found or not v_profile.is_active then
      raise exception 'ACCOUNT_DISABLED: account is inactive';
    end if;
  end if;

  if p_payment_method is distinct from 'cash_on_delivery' then
    raise exception 'PAYMENT_UNAVAILABLE: online payment is not enabled';
  end if;
  if p_coupon_code is not null and length(p_coupon_code) > 40 then
    raise exception 'INVALID_COUPON: coupon code is too long';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS: items must be an array';
  end if;
  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 50 then
    raise exception 'INVALID_ITEMS: between 1 and 50 unique products required';
  end if;
  select count(distinct (value->>'product_id') || ':' || coalesce(value->>'variant_id','base'))
    into v_distinct_items from jsonb_array_elements(p_items);
  if v_item_count <> v_distinct_items then
    raise exception 'INVALID_ITEMS: duplicate products must be combined';
  end if;
  if v_user is not null and (
    select count(*) from public.orders
    where user_id = v_user and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'RATE_LIMIT: too many orders';
  end if;

  v_merchant := v_user is not null and public.is_approved_merchant(v_user);
  if v_merchant then
    select * into v_application
    from public.wholesale_applications
    where user_id = v_user and status = 'approved';
  end if;

  if p_address is null or jsonb_typeof(p_address) <> 'object'
     or jsonb_typeof(p_address->'recipient_name') is distinct from 'string'
     or jsonb_typeof(p_address->'phone') is distinct from 'string'
     or jsonb_typeof(p_address->'governorate') is distinct from 'string'
     or jsonb_typeof(p_address->'city') is distinct from 'string'
     or jsonb_typeof(p_address->'area') is distinct from 'string'
     or jsonb_typeof(p_address->'street') is distinct from 'string'
     or (p_address ? 'notes' and jsonb_typeof(p_address->'notes') not in ('string','null')) then
    raise exception 'INVALID_ADDRESS: address fields required';
  end if;
  if length(trim(p_address->>'recipient_name')) not between 2 and 120
     or length(trim(p_address->>'phone')) not between 8 and 24
     or (p_address->>'phone') !~ '^\+?[0-9 ()-]{8,24}$'
     or length(trim(p_address->>'governorate')) not between 2 and 80
     or length(trim(p_address->>'city')) not between 2 and 80
     or length(trim(p_address->>'area')) not between 2 and 100
     or length(trim(p_address->>'street')) not between 3 and 300
     or coalesce(length(p_address->>'notes'),0) > 300 then
    raise exception 'INVALID_ADDRESS: address fields are invalid';
  end if;

  insert into public.addresses(
    user_id, recipient_name, phone, governorate, city, area, street, notes, is_default
  ) values (
    v_user,
    trim(p_address->>'recipient_name'),
    trim(p_address->>'phone'),
    trim(p_address->>'governorate'),
    trim(p_address->>'city'),
    trim(p_address->>'area'),
    trim(p_address->>'street'),
    left(coalesce(p_address->>'notes',''),300),
    v_user is not null and not exists(
      select 1 from public.addresses where user_id = v_user
    )
  ) returning * into v_address;

  -- Lock in product ID order so simultaneous checkouts cannot oversell or deadlock.
  for v_item in
    select value from jsonb_array_elements(p_items)
    order by value->>'product_id', coalesce(value->>'variant_id','')
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(v_item->>'quantity','') !~ '^[1-9][0-9]{0,2}$'
       or (v_item->'variant_id' is not null and v_item->'variant_id' <> 'null'::jsonb
         and coalesce(v_item->>'variant_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
      raise exception 'INVALID_ITEMS: invalid quantity';
    end if;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity > 50 then raise exception 'INVALID_ITEMS: quantity is too large'; end if;
    v_variant_id := nullif(v_item->>'variant_id','')::uuid;
    select * into v_product
    from public.products where id = (v_item->>'product_id')::uuid and is_active for share;
    if not found then raise exception 'INVALID_PRODUCT: product unavailable'; end if;
    v_price_modifier := 0;
    if v_variant_id is not null then
      select * into v_variant
      from public.product_variants
      where id = v_variant_id and product_id = v_product.id and is_active for share;
      if not found then raise exception 'INVALID_PRODUCT: product option unavailable'; end if;
      v_price_modifier := v_variant.price_modifier;
    end if;
    select quantity_available into v_available
    from public.inventory
    where product_id = v_product.id and variant_id is not distinct from v_variant_id
    for update;
    if not found or v_available < v_quantity then
      raise exception 'OUT_OF_STOCK: insufficient stock';
    end if;

    if v_merchant and (
      v_product.wholesale_price is not null or exists(
        select 1 from public.wholesale_pricing
        where merchant_id = v_user and product_id = v_product.id and is_active
      )
    ) then
      if v_quantity < greatest(v_product.minimum_wholesale_quantity, v_application.minimum_order_quantity) then
        raise exception 'MINIMUM_ORDER: wholesale minimum not met';
      end if;
      select * into v_wholesale
      from public.wholesale_pricing
      where merchant_id = v_user and product_id = v_product.id and is_active;
      if found then
        if v_quantity < v_wholesale.minimum_quantity then
          raise exception 'MINIMUM_ORDER: wholesale minimum not met';
        end if;
        v_unit_price := v_wholesale.price + v_price_modifier;
      else
        v_unit_price := round((v_product.wholesale_price + v_price_modifier)
          * (1 - v_application.discount_percent / 100), 2);
      end if;
    else
      v_unit_price := coalesce(v_product.sale_price, v_product.retail_price) + v_price_modifier;
    end if;
    v_subtotal := v_subtotal + v_unit_price * v_quantity;
  end loop;

  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon
    from public.coupons where upper(code) = upper(trim(p_coupon_code)) for update;
    if not found or not v_coupon.is_active
       or (v_coupon.starts_at is not null and v_coupon.starts_at > now())
       or (v_coupon.expires_at is not null and v_coupon.expires_at < now())
       or v_subtotal < v_coupon.minimum_order
       or (v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit) then
      raise exception 'INVALID_COUPON: coupon invalid';
    end if;
    if v_user is not null then
      select count(*) into v_coupon_uses
      from public.coupon_usages where coupon_id = v_coupon.id and user_id = v_user;
    else
      -- Guest coupon limits use a server-derived network hash, never the editable phone number.
      select count(*) into v_coupon_uses
      from public.coupon_usages
      where coupon_id = v_coupon.id and guest_identity_hash = p_guest_identity_hash;
    end if;
    if v_coupon_uses >= v_coupon.per_customer_limit then
      raise exception 'INVALID_COUPON: customer usage limit reached';
    end if;
    v_coupon_id := v_coupon.id;
    if v_coupon.discount_type = 'percentage' then
      v_discount := round(v_subtotal * v_coupon.discount_value / 100, 2);
    else
      v_discount := least(v_subtotal, v_coupon.discount_value);
    end if;
  end if;

  select coalesce((setting_value->>'flat_fee')::numeric,60)
    into v_shipping_fee from public.store_settings where setting_key = 'shipping';
  select coalesce((setting_value->>'free_shipping_minimum')::numeric,1500)
    into v_free_shipping_minimum from public.store_settings where setting_key = 'shipping';
  v_shipping := case when v_subtotal - v_discount >= v_free_shipping_minimum then 0 else v_shipping_fee end;
  v_total := greatest(0, v_subtotal - v_discount) + v_shipping;

  insert into public.orders(
    user_id, address_id, coupon_id, order_type, status, subtotal, discount_total,
    shipping_fee, total_amount, payment_method, guest_confirmation_token_hash
  ) values (
    v_user, v_address.id, v_coupon_id,
    case when v_merchant then 'wholesale' else 'b2c' end,
    'new', v_subtotal, v_discount, v_shipping, v_total, p_payment_method,
    case when v_user is null then p_guest_confirmation_token_hash else null end
  ) returning * into v_order;

  for v_item in
    select value from jsonb_array_elements(p_items)
    order by value->>'product_id', coalesce(value->>'variant_id','')
  loop
    v_quantity := (v_item->>'quantity')::integer;
    v_variant_id := nullif(v_item->>'variant_id','')::uuid;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    v_variant_name := null;
    v_variant_sku := v_product.sku;
    v_price_modifier := 0;
    if v_variant_id is not null then
      select * into v_variant from public.product_variants
      where id = v_variant_id and product_id = v_product.id;
      v_variant_name := v_variant.name;
      v_variant_sku := v_variant.sku;
      v_price_modifier := v_variant.price_modifier;
    end if;
    if v_merchant and (
      v_product.wholesale_price is not null or exists(
        select 1 from public.wholesale_pricing
        where merchant_id = v_user and product_id = v_product.id and is_active
      )
    ) then
      select * into v_wholesale from public.wholesale_pricing
      where merchant_id = v_user and product_id = v_product.id and is_active;
      if found then
        v_unit_price := v_wholesale.price + v_price_modifier;
      else
        v_unit_price := round((v_product.wholesale_price + v_price_modifier)
          * (1 - v_application.discount_percent / 100), 2);
      end if;
    else
      v_unit_price := coalesce(v_product.sale_price, v_product.retail_price) + v_price_modifier;
    end if;
    insert into public.order_items(
      order_id, product_id, variant_id, product_name, sku, quantity, unit_price, line_total
    ) values (
      v_order.id, v_product.id, v_variant_id,
      v_product.name || case when v_variant_name is null then '' else ' — ' || v_variant_name end,
      v_variant_sku, v_quantity, v_unit_price, v_unit_price * v_quantity
    );
    update public.inventory
    set quantity_available = quantity_available - v_quantity
    where product_id = v_product.id and variant_id is not distinct from v_variant_id;
    insert into public.inventory_movements(
      product_id, variant_id, change_quantity, reason, reference_id, created_by
    ) values (v_product.id, v_variant_id, -v_quantity, 'sale', v_order.id, v_user);
  end loop;

  insert into public.payments(order_id, provider, amount, status)
  values (v_order.id, 'cash_on_delivery', v_total, 'pending');
  if v_coupon_id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon_id;
    insert into public.coupon_usages(
      coupon_id, user_id, guest_identity_hash, order_id, discount_amount
    ) values (v_coupon_id, v_user,
      case when v_user is null then p_guest_identity_hash else null end,
      v_order.id, v_discount);
  end if;
  if v_user is not null then
    insert into public.notifications(user_id, title, body, kind, href)
    values(v_user, 'تم استلام طلبك', 'طلبك ' || v_order.order_number || ' قيد المراجعة الآن.',
      'order', '/account/orders/' || v_order.id);
  end if;
  return jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number);
end;
$$;

revoke all on function public.place_order_core(jsonb,jsonb,text,text,uuid,text,text)
  from public, anon, authenticated, service_role;

create or replace function public.place_order_secure(
  p_items jsonb,
  p_address jsonb,
  p_coupon_code text default null,
  p_payment_method text default 'cash_on_delivery'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or auth.jwt()->>'role' is distinct from 'authenticated' then
    raise exception 'AUTH_REQUIRED: sign in required';
  end if;
  return public.place_order_core(
    p_items, p_address, p_coupon_code, p_payment_method, auth.uid(), null, null
  );
end;
$$;
revoke all on function public.place_order_secure(jsonb,jsonb,text,text) from public, anon;
grant execute on function public.place_order_secure(jsonb,jsonb,text,text) to authenticated;

create or replace function public.consume_guest_checkout_rate_limit(p_identity_hash text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window timestamptz;
  v_day timestamptz;
  v_window_count integer;
  v_day_count integer;
begin
  if auth.jwt()->>'role' is distinct from 'service_role' then
    raise exception 'NOT_ALLOWED: rate limiting is server-only';
  end if;
  if p_identity_hash is null or p_identity_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVALID_RATE_LIMIT_IDENTITY';
  end if;

  v_window := date_trunc('minute', v_now)
    - make_interval(mins => mod(extract(minute from v_now)::integer, 15));
  v_day := date_trunc('day', v_now);

  delete from public.guest_checkout_rate_limits
  where updated_at < v_now - interval '30 days';

  insert into public.guest_checkout_rate_limits as current_limit(
    identity_hash, window_start, window_count, day_start, day_count, updated_at
  ) values (p_identity_hash, v_window, 1, v_day, 1, v_now)
  on conflict (identity_hash) do update set
    window_count = case when current_limit.window_start < excluded.window_start
      then 1 else current_limit.window_count + 1 end,
    window_start = greatest(current_limit.window_start, excluded.window_start),
    day_count = case when current_limit.day_start < excluded.day_start
      then 1 else current_limit.day_count + 1 end,
    day_start = greatest(current_limit.day_start, excluded.day_start),
    updated_at = excluded.updated_at
  returning window_count, day_count into v_window_count, v_day_count;

  return v_window_count <= 5 and v_day_count <= 20;
end;
$$;
revoke all on function public.consume_guest_checkout_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_guest_checkout_rate_limit(text) to service_role;

create or replace function public.place_guest_order_secure(
  p_items jsonb,
  p_address jsonb,
  p_coupon_code text,
  p_payment_method text,
  p_guest_identity_hash text,
  p_guest_confirmation_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.jwt()->>'role' is distinct from 'service_role' then
    raise exception 'NOT_ALLOWED: guest checkout is server-only';
  end if;
  if p_guest_identity_hash is null or p_guest_identity_hash !~ '^[0-9a-f]{64}$'
     or p_guest_confirmation_token_hash is null
     or p_guest_confirmation_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVALID_GUEST_CREDENTIALS';
  end if;
  return public.place_order_core(
    p_items, p_address, p_coupon_code, p_payment_method, null,
    p_guest_identity_hash, p_guest_confirmation_token_hash
  );
end;
$$;
revoke all on function public.place_guest_order_secure(jsonb,jsonb,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.place_guest_order_secure(jsonb,jsonb,text,text,text,text)
  to service_role;

create or replace function public.guest_order_confirmation_secure(
  p_order_id uuid,
  p_confirmation_token_hash text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_order_number text;
begin
  if auth.jwt()->>'role' is distinct from 'service_role' then
    raise exception 'NOT_ALLOWED: confirmation lookup is server-only';
  end if;
  if p_confirmation_token_hash is null or p_confirmation_token_hash !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  select order_number into v_order_number
  from public.orders
  where id = p_order_id and user_id is null
    and guest_confirmation_token_hash = p_confirmation_token_hash;
  return v_order_number;
end;
$$;
revoke all on function public.guest_order_confirmation_secure(uuid,text)
  from public, anon, authenticated;
grant execute on function public.guest_order_confirmation_secure(uuid,text) to service_role;

commit;
