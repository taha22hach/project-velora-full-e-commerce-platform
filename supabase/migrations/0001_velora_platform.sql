-- VELORA base schema. Run in Supabase SQL Editor or with supabase db push.
create extension if not exists pgcrypto with schema extensions;
create sequence if not exists public.order_number_seq;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('admin','customer','merchant')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  brand_id uuid references public.brands(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  sku text not null unique,
  retail_price numeric(12,2) not null check (retail_price > 0),
  sale_price numeric(12,2) check (sale_price is null or (sale_price > 0 and sale_price < retail_price)),
  wholesale_price numeric(12,2) check (wholesale_price is null or (wholesale_price > 0 and wholesale_price <= retail_price)),
  minimum_wholesale_quantity integer not null default 1 check (minimum_wholesale_quantity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  alt_text text not null default '',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique(product_id, position)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  options jsonb not null default '{}'::jsonb,
  price_modifier numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity_available integer not null default 0 check (quantity_available >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  unique(product_id, variant_id)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  change_quantity integer not null check (change_quantity <> 0),
  reason text not null check (reason in ('initial_stock','restock','sale','cancellation','adjustment','return','damaged')),
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, product_id, variant_id)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  city text not null,
  area text not null,
  street text not null,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists addresses_one_default_per_user on public.addresses(user_id) where is_default;
create unique index if not exists inventory_one_product_stock on public.inventory(product_id) where variant_id is null;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  minimum_order numeric(12,2) not null default 0 check (minimum_order >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit integer not null default 1 check (per_customer_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percentage' or discount_value <= 100),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('VLR-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  user_id uuid not null references public.profiles(id) on delete restrict,
  address_id uuid references public.addresses(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  order_type text not null default 'b2c' check (order_type in ('b2c','wholesale')),
  status text not null default 'new' check (status in ('new','confirmed','processing','shipped','delivered','cancelled')),
  currency text not null default 'EGP' check (currency = 'EGP'),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('cash_on_delivery','online')),
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  provider text not null default 'cash_on_delivery',
  provider_reference text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'EGP',
  status text not null default 'pending' check (status in ('pending','authorized','paid','failed','refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wholesale_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null,
  business_type text not null check (business_type in ('beauty_store','salon','distributor','other')),
  business_phone text not null,
  registration_number text,
  website text,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 80),
  minimum_order_quantity integer not null default 6 check (minimum_order_quantity > 0),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wholesale_pricing (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price numeric(12,2) not null check (price > 0),
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(merchant_id, product_id)
);

create table if not exists public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  discount_amount numeric(12,2) not null check (discount_amount >= 0),
  used_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  review_body text not null check (char_length(review_body) between 5 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'general',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_active_idx on public.products(category_id, is_active);
create index if not exists products_created_idx on public.products(created_at desc);
create index if not exists product_images_product_position_idx on public.product_images(product_id, position);
create index if not exists inventory_low_stock_idx on public.inventory(quantity_available);
create index if not exists inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists addresses_user_created_idx on public.addresses(user_id, created_at desc);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists wholesale_status_created_idx on public.wholesale_applications(status, created_at desc);
create index if not exists reviews_product_status_idx on public.reviews(product_id, status);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists coupon_usages_user_coupon_idx on public.coupon_usages(user_id, coupon_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','categories','products','inventory','carts','cart_items','addresses','coupons','orders','payments','wholesale_applications','wholesale_pricing','reviews','store_settings','newsletter_subscribers'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.profiles(id, email, full_name, phone, role)
  values (new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'phone',''), 'customer')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.create_product_inventory()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.inventory(product_id, quantity_available) values (new.id, 0) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists product_inventory_after_insert on public.products;
create trigger product_inventory_after_insert after insert on public.products for each row execute function public.create_product_inventory();

create or replace function public.create_variant_inventory()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.inventory(product_id, variant_id, quantity_available) values (new.product_id, new.id, 0) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists variant_inventory_after_insert on public.product_variants;
create trigger variant_inventory_after_insert after insert on public.product_variants for each row execute function public.create_variant_inventory();

create or replace function public.has_role(p_user_id uuid, p_role text)
returns boolean language plpgsql stable security definer set search_path = public, auth as $$
begin
  if p_user_id is distinct from auth.uid() then return false; end if;
  return exists(select 1 from public.profiles where id = p_user_id and role = p_role and is_active);
end;
$$;

create or replace function public.is_approved_merchant(p_user_id uuid)
returns boolean language plpgsql stable security definer set search_path = public, auth as $$
begin
  if p_user_id is distinct from auth.uid() then return false; end if;
  return exists(select 1 from public.profiles p join public.wholesale_applications a on a.user_id = p.id
    where p.id = p_user_id and p.role = 'merchant' and p.is_active and a.status = 'approved');
end;
$$;

create or replace function public.merchant_product_prices()
returns table(product_id uuid, wholesale_price numeric, minimum_quantity integer)
language plpgsql stable security definer set search_path = public, auth as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or not public.is_approved_merchant(v_user) then
    return;
  end if;
  return query
    select p.id,
      coalesce(wp.price, round(p.wholesale_price * (1 - a.discount_percent / 100), 2), p.retail_price)::numeric,
      greatest(p.minimum_wholesale_quantity, a.minimum_order_quantity, coalesce(wp.minimum_quantity, 1))
    from public.products p
    join public.wholesale_applications a on a.user_id = v_user and a.status = 'approved'
    left join public.wholesale_pricing wp on wp.merchant_id = v_user and wp.product_id = p.id and wp.is_active
    where p.is_active;
end;
$$;

create or replace function public.admin_product_wholesale_prices()
returns table(product_id uuid, wholesale_price numeric, minimum_wholesale_quantity integer)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'admin') then raise exception 'NOT_ADMIN'; end if;
  return query select p.id, p.wholesale_price, p.minimum_wholesale_quantity from public.products p;
end;
$$;

create or replace function public.public_store_branding()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'name',(select setting_value->'name' from public.store_settings where setting_key='store' limit 1),
    'logo_url',(select setting_value->'logo_url' from public.store_settings where setting_key='store' limit 1),
    'contact',(select setting_value from public.store_settings where setting_key='contact' limit 1),
    'social',(select setting_value from public.store_settings where setting_key='social' limit 1)
  )
$$;

create or replace function public.place_order_secure(
  p_items jsonb,
  p_address jsonb,
  p_coupon_code text default null,
  p_payment_method text default 'cash_on_delivery'
)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
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
  if v_user is null then raise exception 'AUTH_REQUIRED: sign in required'; end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if not found or not v_profile.is_active then raise exception 'ACCOUNT_DISABLED: account is inactive'; end if;
  if p_payment_method <> 'cash_on_delivery' then raise exception 'PAYMENT_UNAVAILABLE: online payment is not enabled'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'INVALID_ITEMS: items must be an array'; end if;
  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 50 then raise exception 'INVALID_ITEMS: between 1 and 50 unique products required'; end if;
  select count(distinct (value->>'product_id') || ':' || coalesce(value->>'variant_id','base')) into v_distinct_items from jsonb_array_elements(p_items);
  if v_item_count <> v_distinct_items then raise exception 'INVALID_ITEMS: duplicate products must be combined'; end if;
  if (select count(*) from public.orders where user_id = v_user and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'RATE_LIMIT: too many orders';
  end if;
  v_merchant := public.is_approved_merchant(v_user);
  if v_merchant then
    select * into v_application from public.wholesale_applications where user_id = v_user and status = 'approved';
  end if;

  insert into public.addresses(user_id, recipient_name, phone, city, area, street, notes, is_default)
  values (v_user, left(trim(p_address->>'recipient_name'),120), left(trim(p_address->>'phone'),24),
    left(trim(p_address->>'city'),80), left(trim(p_address->>'area'),100), left(trim(p_address->>'street'),300),
    left(coalesce(p_address->>'notes',''),300),
    not exists(select 1 from public.addresses where user_id = v_user))
  returning * into v_address;
  if v_address.recipient_name = '' or v_address.phone = '' or v_address.city = '' or v_address.area = '' or v_address.street = '' then
    raise exception 'INVALID_ADDRESS: address fields required';
  end if;

  -- Lock in product ID order so simultaneous checkouts cannot oversell or deadlock.
  for v_item in select value from jsonb_array_elements(p_items) order by value->>'product_id', coalesce(value->>'variant_id','') loop
    if (v_item->>'quantity') !~ '^[1-9][0-9]{0,4}$' then raise exception 'INVALID_ITEMS: invalid quantity'; end if;
    v_quantity := (v_item->>'quantity')::integer;
    v_variant_id := nullif(v_item->>'variant_id','')::uuid;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and is_active for share;
    if not found then raise exception 'INVALID_PRODUCT: product unavailable'; end if;
    v_price_modifier := 0;
    if v_variant_id is not null then
      select * into v_variant from public.product_variants where id = v_variant_id and product_id = v_product.id and is_active for share;
      if not found then raise exception 'INVALID_PRODUCT: product option unavailable'; end if;
      v_price_modifier := v_variant.price_modifier;
    end if;
    select quantity_available into v_available from public.inventory where product_id = v_product.id and variant_id is not distinct from v_variant_id for update;
    if not found or v_available < v_quantity then raise exception 'OUT_OF_STOCK: insufficient stock'; end if;

    if v_merchant and (v_product.wholesale_price is not null or exists(select 1 from public.wholesale_pricing where merchant_id = v_user and product_id = v_product.id and is_active)) then
      if v_quantity < greatest(v_product.minimum_wholesale_quantity, v_application.minimum_order_quantity) then raise exception 'MINIMUM_ORDER: wholesale minimum not met'; end if;
      select * into v_wholesale from public.wholesale_pricing where merchant_id = v_user and product_id = v_product.id and is_active;
      if found then
        if v_quantity < v_wholesale.minimum_quantity then raise exception 'MINIMUM_ORDER: wholesale minimum not met'; end if;
        v_unit_price := v_wholesale.price + v_price_modifier;
      else
        v_unit_price := round((v_product.wholesale_price + v_price_modifier) * (1 - v_application.discount_percent / 100), 2);
      end if;
    else
      v_unit_price := coalesce(v_product.sale_price, v_product.retail_price) + v_price_modifier;
    end if;
    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon from public.coupons where upper(code) = upper(trim(p_coupon_code)) for update;
    if not found or not v_coupon.is_active or (v_coupon.starts_at is not null and v_coupon.starts_at > now())
       or (v_coupon.expires_at is not null and v_coupon.expires_at < now())
       or v_subtotal < v_coupon.minimum_order
       or (v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit) then
      raise exception 'INVALID_COUPON: coupon invalid';
    end if;
    select count(*) into v_coupon_uses from public.coupon_usages where coupon_id = v_coupon.id and user_id = v_user;
    if v_coupon_uses >= v_coupon.per_customer_limit then raise exception 'INVALID_COUPON: customer usage limit reached'; end if;
    v_coupon_id := v_coupon.id;
    if v_coupon.discount_type = 'percentage' then v_discount := round(v_subtotal * v_coupon.discount_value / 100, 2);
    else v_discount := least(v_subtotal, v_coupon.discount_value); end if;
  end if;
  select coalesce((setting_value->>'flat_fee')::numeric,60) into v_shipping_fee from public.store_settings where setting_key = 'shipping';
  select coalesce((setting_value->>'free_shipping_minimum')::numeric,1500) into v_free_shipping_minimum from public.store_settings where setting_key = 'shipping';
  v_shipping := case when v_subtotal - v_discount >= v_free_shipping_minimum then 0 else v_shipping_fee end;
  v_total := greatest(0, v_subtotal - v_discount) + v_shipping;

  insert into public.orders(user_id,address_id,coupon_id,order_type,status,subtotal,discount_total,shipping_fee,total_amount,payment_method)
  values (v_user,v_address.id,v_coupon_id,case when v_merchant then 'wholesale' else 'b2c' end,'new',v_subtotal,v_discount,v_shipping,v_total,p_payment_method)
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) order by value->>'product_id', coalesce(value->>'variant_id','') loop
    v_quantity := (v_item->>'quantity')::integer;
    v_variant_id := nullif(v_item->>'variant_id','')::uuid;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    v_variant_name := null;
    v_variant_sku := v_product.sku;
    v_price_modifier := 0;
    if v_variant_id is not null then
      select * into v_variant from public.product_variants where id = v_variant_id and product_id = v_product.id;
      v_variant_name := v_variant.name;
      v_variant_sku := v_variant.sku;
      v_price_modifier := v_variant.price_modifier;
    end if;
    if v_merchant and (v_product.wholesale_price is not null or exists(select 1 from public.wholesale_pricing where merchant_id = v_user and product_id = v_product.id and is_active)) then
      select * into v_wholesale from public.wholesale_pricing where merchant_id = v_user and product_id = v_product.id and is_active;
      if found then v_unit_price := v_wholesale.price + v_price_modifier;
      else v_unit_price := round((v_product.wholesale_price + v_price_modifier) * (1 - v_application.discount_percent / 100), 2); end if;
    else v_unit_price := coalesce(v_product.sale_price,v_product.retail_price) + v_price_modifier; end if;
    insert into public.order_items(order_id,product_id,variant_id,product_name,sku,quantity,unit_price,line_total)
      values(v_order.id,v_product.id,v_variant_id,v_product.name || case when v_variant_name is null then '' else ' — ' || v_variant_name end,v_variant_sku,v_quantity,v_unit_price,v_unit_price*v_quantity);
    update public.inventory set quantity_available = quantity_available - v_quantity where product_id = v_product.id and variant_id is not distinct from v_variant_id;
    insert into public.inventory_movements(product_id,variant_id,change_quantity,reason,reference_id,created_by)
      values(v_product.id,v_variant_id,-v_quantity,'sale',v_order.id,v_user);
  end loop;
  insert into public.payments(order_id,provider,amount,status) values(v_order.id,'cash_on_delivery',v_total,'pending');
  if v_coupon_id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon_id;
    insert into public.coupon_usages(coupon_id,user_id,order_id,discount_amount) values(v_coupon_id,v_user,v_order.id,v_discount);
  end if;
  insert into public.notifications(user_id,title,body,kind,href)
  values(v_user,'تم استلام طلبك','طلبك ' || v_order.order_number || ' قيد المراجعة الآن.','order','/account/orders/' || v_order.id);
  return jsonb_build_object('id',v_order.id,'order_number',v_order.order_number);
end;
$$;

create or replace function public.admin_update_order_status(p_order_id uuid, p_status text)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare v_order public.orders%rowtype; v_item record;
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'admin') then raise exception 'NOT_ADMIN'; end if;
  if p_status not in ('new','confirmed','processing','shipped','delivered','cancelled') then raise exception 'INVALID_STATUS'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'cancelled' and p_status <> 'cancelled' then raise exception 'CANCELLED_ORDER'; end if;
  if p_status = 'cancelled' and v_order.status <> 'cancelled' then
    if v_order.status in ('shipped','delivered') then raise exception 'ORDER_ALREADY_SHIPPED'; end if;
    for v_item in select product_id, variant_id, quantity from public.order_items where order_id = p_order_id and product_id is not null loop
      update public.inventory set quantity_available = quantity_available + v_item.quantity where product_id = v_item.product_id and variant_id is not distinct from v_item.variant_id;
      insert into public.inventory_movements(product_id,variant_id,change_quantity,reason,reference_id,created_by)
        values(v_item.product_id,v_item.variant_id,v_item.quantity,'cancellation',p_order_id,auth.uid());
    end loop;
  end if;
  update public.orders set status = p_status where id = p_order_id;
  insert into public.notifications(user_id,title,body,kind,href)
    values(v_order.user_id,'تحديث حالة طلبك','أصبحت حالة طلبك ' || p_status || '.','order','/account/orders/' || v_order.id);
  return true;
end;
$$;

create or replace function public.review_wholesale_application(
  p_application_id uuid,
  p_decision text,
  p_discount_percent numeric default 0,
  p_minimum_quantity integer default 6
)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare v_application public.wholesale_applications%rowtype;
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'admin') then raise exception 'NOT_ADMIN'; end if;
  if p_decision not in ('approved','rejected') or p_discount_percent < 0 or p_discount_percent > 80 or p_minimum_quantity < 1 then raise exception 'INVALID_REVIEW'; end if;
  select * into v_application from public.wholesale_applications where id = p_application_id for update;
  if not found then raise exception 'APPLICATION_NOT_FOUND'; end if;
  update public.wholesale_applications set status = p_decision, discount_percent = p_discount_percent,
    minimum_order_quantity = p_minimum_quantity, reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_application_id;
  update public.profiles set role = case when p_decision = 'approved' then 'merchant' else 'customer' end
    where id = v_application.user_id and role <> 'admin';
  insert into public.notifications(user_id,title,body,kind,href)
    values(v_application.user_id,'تحديث طلب حساب الأعمال',
      case when p_decision = 'approved' then 'تم اعتماد حساب أعمالك. أسعار الجملة متاحة الآن بعد تسجيل الدخول.' else 'تم تحديث طلب حساب الأعمال. تواصلي مع فريق VELORA لأي استفسار.' end,
      'wholesale','/account');
  return true;
end;
$$;

create or replace function public.admin_adjust_inventory(p_product_id uuid, p_change integer, p_reason text, p_notes text default null, p_variant_id uuid default null)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare v_inventory public.inventory%rowtype; v_next integer;
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'admin') then raise exception 'NOT_ADMIN'; end if;
  if p_change = 0 or abs(p_change) > 100000 or p_reason not in ('restock','adjustment','return','damaged') then raise exception 'INVALID_ADJUSTMENT'; end if;
  select * into v_inventory from public.inventory where product_id = p_product_id and variant_id is not distinct from p_variant_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  v_next := v_inventory.quantity_available + p_change;
  if v_next < 0 then raise exception 'NEGATIVE_STOCK'; end if;
  update public.inventory set quantity_available = v_next where id = v_inventory.id;
  insert into public.inventory_movements(product_id,variant_id,change_quantity,reason,notes,created_by)
    values(p_product_id,p_variant_id,p_change,p_reason,left(p_notes,300),auth.uid());
  return v_next;
end;
$$;

create or replace function public.admin_sync_product_variants(p_product_id uuid, p_variants jsonb)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare
  v_product public.products%rowtype;
  v_item jsonb;
  v_variant_id uuid;
  v_modifier numeric(12,2);
  v_stock integer;
  v_current integer;
  v_delta integer;
  v_kept uuid[] := array[]::uuid[];
  v_count integer := 0;
  v_removed record;
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'admin') then raise exception 'NOT_ADMIN'; end if;
  if p_variants is null or jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) > 100 then raise exception 'INVALID_VARIANTS: invalid list'; end if;
  select * into v_product from public.products where id = p_product_id for update;
  if not found then raise exception 'INVALID_PRODUCT: product not found'; end if;
  if exists(select 1 from (select lower(value->>'sku') as sku, count(*) as copies from jsonb_array_elements(p_variants) group by lower(value->>'sku')) as variants where variants.sku is null or variants.copies > 1) then
    raise exception 'INVALID_VARIANTS: duplicate sku';
  end if;
  if exists(select 1 from (select value->>'id' as id, count(*) as copies from jsonb_array_elements(p_variants) where value ? 'id' group by value->>'id') as variants where variants.copies > 1) then
    raise exception 'INVALID_VARIANTS: duplicate id';
  end if;

  for v_item in select value from jsonb_array_elements(p_variants) loop
    if coalesce(trim(v_item->>'name'),'') = '' or coalesce(trim(v_item->>'sku'),'') = ''
       or coalesce(v_item->>'stock','') !~ '^[0-9]{1,7}$'
       or coalesce(v_item->>'price_modifier','') !~ '^-?[0-9]+(\.[0-9]{1,2})?$' then
      raise exception 'INVALID_VARIANTS: invalid option fields';
    end if;
    v_stock := (v_item->>'stock')::integer;
    if v_stock > 1000000 then raise exception 'INVALID_VARIANTS: stock too large'; end if;
    v_modifier := (v_item->>'price_modifier')::numeric(12,2);
    if least(v_product.retail_price, coalesce(v_product.sale_price,v_product.retail_price), coalesce(v_product.wholesale_price,v_product.retail_price)) + v_modifier <= 0 then
      raise exception 'INVALID_VARIANTS: invalid price';
    end if;
    v_variant_id := nullif(v_item->>'id','')::uuid;
    if v_variant_id is null then
      insert into public.product_variants(product_id,name,sku,options,price_modifier,is_active)
      values(p_product_id,trim(v_item->>'name'),trim(v_item->>'sku'),coalesce(v_item->'options','{}'::jsonb),v_modifier,true)
      returning id into v_variant_id;
    else
      update public.product_variants set name = trim(v_item->>'name'), sku = trim(v_item->>'sku'),
        options = coalesce(v_item->'options','{}'::jsonb), price_modifier = v_modifier, is_active = true
        where id = v_variant_id and product_id = p_product_id;
      if not found then raise exception 'INVALID_VARIANT: option does not belong to product'; end if;
    end if;
    select quantity_available into v_current from public.inventory where product_id = p_product_id and variant_id = v_variant_id for update;
    if not found then raise exception 'INVALID_VARIANT: option inventory missing'; end if;
    v_delta := v_stock - v_current;
    if v_delta <> 0 then
      update public.inventory set quantity_available = v_stock where product_id = p_product_id and variant_id = v_variant_id;
      insert into public.inventory_movements(product_id,variant_id,change_quantity,reason,notes,created_by)
        values(p_product_id,v_variant_id,v_delta,'adjustment','Admin updated variant stock',auth.uid());
    end if;
    v_kept := array_append(v_kept,v_variant_id);
    v_count := v_count + 1;
  end loop;

  for v_removed in
    select pv.id, i.quantity_available from public.product_variants pv
    join public.inventory i on i.variant_id = pv.id and i.product_id = p_product_id
    where pv.product_id = p_product_id and not (pv.id = any(v_kept))
    for update of pv, i
  loop
    if v_removed.quantity_available > 0 then
      insert into public.inventory_movements(product_id,variant_id,change_quantity,reason,notes,created_by)
        values(p_product_id,v_removed.id,-v_removed.quantity_available,'adjustment','Stock removed with product option',auth.uid());
    end if;
  end loop;
  delete from public.product_variants where product_id = p_product_id and not (id = any(v_kept));
  return v_count;
end;
$$;

create or replace function public.admin_set_customer_status(p_customer_id uuid, p_active boolean)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare v_role text;
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'admin') then raise exception 'NOT_ADMIN'; end if;
  select role into v_role from public.profiles where id = p_customer_id for update;
  if not found or v_role = 'admin' then raise exception 'CUSTOMER_NOT_FOUND'; end if;
  update public.profiles set is_active = p_active where id = p_customer_id;
  insert into public.notifications(user_id,title,body,kind)
    values(p_customer_id,'تحديث حالة الحساب',case when p_active then 'تم تفعيل حسابك.' else 'تم تعليق الحساب. تواصلي مع الدعم للمزيد من المعلومات.' end,'account');
  return true;
end;
$$;

create or replace function public.set_default_address(p_address_id uuid)
returns boolean language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.addresses where id = p_address_id and user_id = auth.uid()) then raise exception 'ADDRESS_NOT_FOUND'; end if;
  update public.addresses set is_default = false where user_id = auth.uid();
  update public.addresses set is_default = true where id = p_address_id and user_id = auth.uid();
  return true;
end;
$$;

create or replace function public.save_cart_secure(p_items jsonb)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_cart_id uuid;
  v_item jsonb;
  v_count integer;
  v_distinct integer;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
begin
  if v_user is null or not exists(select 1 from public.profiles where id = v_user and is_active) then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 50 then raise exception 'INVALID_CART'; end if;
  v_count := jsonb_array_length(p_items);
  select count(distinct (value->>'product_id') || ':' || coalesce(value->>'variant_id','base')) into v_distinct from jsonb_array_elements(p_items);
  if v_count <> v_distinct then raise exception 'DUPLICATE_CART_LINES'; end if;
  insert into public.carts(user_id) values(v_user)
  on conflict(user_id) do update set updated_at = now()
  returning id into v_cart_id;
  delete from public.cart_items where cart_id = v_cart_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if (v_item->>'quantity') !~ '^[1-9][0-9]{0,4}$' then raise exception 'INVALID_CART'; end if;
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := nullif(v_item->>'variant_id','')::uuid;
    v_quantity := least((v_item->>'quantity')::integer,50);
    if not exists(select 1 from public.products where id = v_product_id and is_active) then raise exception 'INVALID_PRODUCT'; end if;
    if v_variant_id is not null and not exists(select 1 from public.product_variants where id = v_variant_id and product_id = v_product_id and is_active) then raise exception 'INVALID_VARIANT'; end if;
    insert into public.cart_items(cart_id,product_id,variant_id,quantity) values(v_cart_id,v_product_id,v_variant_id,v_quantity);
  end loop;
  return true;
end;
$$;

create or replace function public.subscribe_newsletter(p_email text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email));
begin
  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' or length(v_email) > 254 then
    raise exception 'INVALID_EMAIL';
  end if;
  insert into public.newsletter_subscribers(email) values(v_email)
  on conflict(email) do update set is_active = true, updated_at = now();
  return true;
end;
$$;

-- All user and business data is protected by RLS.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.wholesale_applications enable row level security;
alter table public.wholesale_pricing enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_usages enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.notifications enable row level security;
alter table public.store_settings enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy profiles_read_self_or_admin on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy categories_read_active on public.categories for select to anon, authenticated using (is_active or public.has_role(auth.uid(),'admin'));
create policy categories_admin_all on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy brands_read_active on public.brands for select to anon, authenticated using (is_active or public.has_role(auth.uid(),'admin'));
create policy brands_admin_all on public.brands for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy products_read_active on public.products for select to anon, authenticated using (is_active or public.has_role(auth.uid(),'admin'));
create policy products_admin_all on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy product_images_read_active on public.product_images for select to anon, authenticated using (exists(select 1 from public.products p where p.id = product_id and p.is_active) or public.has_role(auth.uid(),'admin'));
create policy product_images_admin_all on public.product_images for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy variants_read_active on public.product_variants for select to anon, authenticated using (is_active and exists(select 1 from public.products p where p.id = product_id and p.is_active) or public.has_role(auth.uid(),'admin'));
create policy variants_admin_all on public.product_variants for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy inventory_read_active on public.inventory for select to anon, authenticated using (exists(select 1 from public.products p where p.id = product_id and p.is_active) or public.has_role(auth.uid(),'admin'));
create policy inventory_admin_all on public.inventory for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy movements_admin_read on public.inventory_movements for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy movements_admin_insert on public.inventory_movements for insert to authenticated with check (public.has_role(auth.uid(),'admin'));

create policy carts_own_all on public.carts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cart_items_own_all on public.cart_items for all to authenticated using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())) with check (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy addresses_own_all on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_admin_read on public.addresses for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy orders_read_own_or_admin on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy orders_admin_update on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy order_items_read_owner_or_admin on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy payments_read_owner_or_admin on public.payments for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy payments_admin_update on public.payments for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy wholesale_app_read_own_or_admin on public.wholesale_applications for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy wholesale_app_insert_own_pending on public.wholesale_applications for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy wholesale_app_admin_update on public.wholesale_applications for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy wholesale_pricing_merchant_read on public.wholesale_pricing for select to authenticated using (merchant_id = auth.uid() and public.is_approved_merchant(auth.uid()));
create policy wholesale_pricing_admin_all on public.wholesale_pricing for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy coupons_admin_all on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy coupon_usage_read_own_admin on public.coupon_usages for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy reviews_read_approved_or_owner on public.reviews for select to anon, authenticated using (status = 'approved' or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy reviews_insert_own on public.reviews for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and exists(select 1 from public.orders o join public.order_items oi on oi.order_id = o.id where o.user_id = auth.uid() and o.status = 'delivered' and oi.product_id = reviews.product_id));
create policy reviews_owner_update_pending on public.reviews for update to authenticated using (user_id = auth.uid() and status = 'pending') with check (user_id = auth.uid() and status = 'pending');
create policy reviews_admin_all on public.reviews for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy wishlists_own_all on public.wishlists for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_read_own on public.notifications for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy settings_admin_all on public.store_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy newsletter_admin_all on public.newsletter_subscribers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Do not grant wholesale_price as a directly selectable column. Approved merchants receive it only through a role-checked RPC.
revoke all on public.profiles, public.categories, public.brands, public.products, public.product_images, public.product_variants, public.inventory,
  public.inventory_movements, public.carts, public.cart_items, public.addresses, public.orders, public.order_items, public.payments,
  public.wholesale_applications, public.wholesale_pricing, public.coupons, public.coupon_usages, public.reviews, public.wishlists,
  public.notifications, public.store_settings, public.newsletter_subscribers from anon, authenticated;

grant select on public.categories, public.brands, public.product_images, public.product_variants, public.inventory to anon, authenticated;
grant select (id,product_id,rating,title,review_body,status,created_at,updated_at) on public.reviews to anon, authenticated;
grant select (id,category_id,brand_id,name,slug,description,sku,retail_price,sale_price,minimum_wholesale_quantity,is_active,created_at,updated_at) on public.products to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update(full_name,phone,avatar_url,updated_at) on public.profiles to authenticated;
grant select, insert, update, delete on public.carts, public.cart_items, public.addresses, public.wishlists to authenticated;
grant select on public.orders, public.order_items, public.payments, public.wholesale_applications, public.wholesale_pricing, public.coupon_usages, public.notifications to authenticated;
grant insert on public.wholesale_applications, public.reviews to authenticated;
grant update(review_body,rating,title,updated_at,status) on public.reviews to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant update(status,updated_at) on public.orders to authenticated;
grant update(status,discount_percent,minimum_order_quantity,reviewed_by,reviewed_at,updated_at) on public.wholesale_applications to authenticated;
grant select, insert, update, delete on public.categories, public.brands, public.product_images, public.product_variants, public.inventory, public.inventory_movements, public.coupons, public.store_settings, public.newsletter_subscribers to authenticated;
grant insert, update, delete on public.products to authenticated;
grant update(quantity_available,low_stock_threshold,updated_at) on public.inventory to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.has_role(uuid,text) to anon, authenticated;
grant execute on function public.is_approved_merchant(uuid) to authenticated;
grant execute on function public.merchant_product_prices() to authenticated;
grant execute on function public.admin_product_wholesale_prices() to authenticated;
grant execute on function public.public_store_branding() to anon, authenticated;
grant execute on function public.place_order_secure(jsonb,jsonb,text,text) to authenticated;
grant execute on function public.admin_update_order_status(uuid,text) to authenticated;
grant execute on function public.review_wholesale_application(uuid,text,numeric,integer) to authenticated;
grant execute on function public.admin_adjust_inventory(uuid,integer,text,text,uuid) to authenticated;
grant execute on function public.admin_sync_product_variants(uuid,jsonb) to authenticated;
grant execute on function public.admin_set_customer_status(uuid,boolean) to authenticated;
grant execute on function public.set_default_address(uuid) to authenticated;
grant execute on function public.save_cart_secure(jsonb) to authenticated;
grant execute on function public.subscribe_newsletter(text) to anon, authenticated;
grant update(status,updated_at) on public.reviews to authenticated;

-- Public reads only; uploads, replacements, and deletions require an active admin account.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('category-banners','category-banners',true,8388608,array['image/jpeg','image/png','image/webp']),
  ('store-assets','store-assets',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy public_read_velora_assets on storage.objects for select to anon, authenticated using (bucket_id in ('product-images','category-banners','store-assets'));
create policy admin_upload_velora_assets on storage.objects for insert to authenticated with check (bucket_id in ('product-images','category-banners','store-assets') and public.has_role(auth.uid(),'admin'));
create policy admin_update_velora_assets on storage.objects for update to authenticated using (bucket_id in ('product-images','category-banners','store-assets') and public.has_role(auth.uid(),'admin')) with check (bucket_id in ('product-images','category-banners','store-assets') and public.has_role(auth.uid(),'admin'));
create policy admin_delete_velora_assets on storage.objects for delete to authenticated using (bucket_id in ('product-images','category-banners','store-assets') and public.has_role(auth.uid(),'admin'));
