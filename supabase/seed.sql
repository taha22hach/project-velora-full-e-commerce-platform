-- Optional demo catalog for local development. Run after the migration.
insert into public.categories(name,slug,description,sort_order,image_url) values
  ('العناية بالبشرة','skincare','تنظيف وترطيب وعناية يومية',1,'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=85'),
  ('العناية بالشعر','haircare','روتين لطيف لشعر أكثر صحة',2,'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=85'),
  ('المكياج','makeup','ألوان ولمسات تعبّر عنك',3,'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=85'),
  ('العناية بالجسم','body-care','لحظات عناية وراحة كل يوم',4,'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=85'),
  ('الأزياء','fashion','قطع جميلة لكل إطلالة',5,'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=85'),
  ('الإكسسوارات','accessories','تفاصيل تكمل أسلوبك',6,'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85')
on conflict (slug) do update set name=excluded.name, description=excluded.description, sort_order=excluded.sort_order, image_url=excluded.image_url;

insert into public.brands(name,slug) values
  ('VELORA','velora'),
  ('Maison Rose','maison-rose'),
  ('Lumière','lumiere'),
  ('VELORA Studio','velora-studio')
on conflict (slug) do nothing;

with catalog(slug,name,sku,category_slug,brand_slug,description,retail_price,sale_price,wholesale_price,minimum_wholesale_quantity,stock,image_url) as (
  values
  ('velora-glow-cleanser','منظف الوجه اللطيف','VLR-1001','skincare','velora','غسول يومي لطيف ينظف البشرة دون أن يخل بتوازنها الطبيعي.',420,360,300,6,24,'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85'),
  ('rose-water-serum','سيروم ماء الورد','VLR-1002','skincare','maison-rose','تركيبة مرطبة تمنح البشرة إشراقة ونعومة طوال اليوم.',690,null,510,6,18,'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=85'),
  ('silk-hair-mask','ماسك الشعر الحريري','VLR-1003','haircare','velora','عناية عميقة تمنح الشعر لمعاناً وملمساً انسيابياً.',540,470,390,6,18,'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85'),
  ('velvet-lipstick','أحمر شفاه مخملي','VLR-1004','makeup','lumiere','لون غني بلمسة مخملية مريحة تدوم لساعات.',390,null,280,12,30,'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85'),
  ('daily-moisturizer','مرطب يومي بالهيالورونيك','VLR-1005','skincare','maison-rose','ترطيب خفيف سريع الامتصاص لجميع أنواع البشرة.',580,490,420,6,27,'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85'),
  ('body-mist-rose','رذاذ الجسم برائحة الورد','VLR-1006','body-care','velora','رائحة وردية ناعمة ترافقك في كل لحظة.',460,null,330,6,15,'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=900&q=85'),
  ('silk-shampoo','شامبو الحرير المغذي','VLR-1007','haircare','maison-rose','تنظيف لطيف مع عناية للشعر الجاف والمتعب.',380,null,270,6,21,'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85'),
  ('soft-blush','أحمر خدود وردي ناعم','VLR-1008','makeup','lumiere','لمسة لون طبيعية بإشراقة صحية تدوم.',440,395,320,12,24,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'),
  ('satin-dress','فستان ساتان وردي','VLR-1009','fashion','velora-studio','قصة أنيقة من قماش ناعم لإطلالة مسائية راقية.',1890,null,1420,3,9,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'),
  ('mini-crossbody','حقيبة كتف صغيرة','VLR-1010','accessories','velora-studio','حقيبة يومية أنيقة بتفاصيل ذهبية ناعمة.',1450,1290,1080,3,12,'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85'),
  ('gold-watch','ساعة كلاسيكية ذهبية','VLR-1011','accessories','maison-rose','تصميم بسيط بلمسة ذهبية لإطلالة لا تتكرر.',2200,null,1690,3,8,'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=85'),
  ('body-butter','زبدة الجسم بالفانيلا','VLR-1012','body-care','velora','ترطيب غني وعطر دافئ يمنح بشرتك نعومة فائقة.',610,550,440,6,21,'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85')
)
insert into public.products(category_id,brand_id,name,slug,description,sku,retail_price,sale_price,wholesale_price,minimum_wholesale_quantity)
select c.id,b.id,p.name,p.slug,p.description,p.sku,p.retail_price,p.sale_price,p.wholesale_price,p.minimum_wholesale_quantity
from catalog p join public.categories c on c.slug=p.category_slug join public.brands b on b.slug=p.brand_slug
on conflict (slug) do update set name=excluded.name,description=excluded.description,retail_price=excluded.retail_price,
  sale_price=excluded.sale_price,wholesale_price=excluded.wholesale_price,minimum_wholesale_quantity=excluded.minimum_wholesale_quantity;

with stock(slug,quantity,image_url) as (
 values
 ('velora-glow-cleanser',24,'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85'),
 ('rose-water-serum',18,'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=85'),
 ('silk-hair-mask',18,'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85'),
 ('velvet-lipstick',30,'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85'),
 ('daily-moisturizer',27,'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85'),
 ('body-mist-rose',15,'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=900&q=85'),
 ('silk-shampoo',21,'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85'),
 ('soft-blush',24,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'),
 ('satin-dress',9,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'),
 ('mini-crossbody',12,'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85'),
 ('gold-watch',8,'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=85'),
 ('body-butter',21,'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85')
)
insert into public.inventory(product_id,quantity_available)
select p.id,s.quantity from stock s join public.products p on p.slug=s.slug
on conflict (product_id) where variant_id is null do update set quantity_available=excluded.quantity_available;

insert into public.product_variants(product_id,name,sku,options,price_modifier)
select p.id,v.name,v.sku,jsonb_build_object('size',v.name),0
from public.products p
cross join (values ('XS','VLR-1009-XS'),('S','VLR-1009-S'),('M','VLR-1009-M'),('L','VLR-1009-L')) as v(name,sku)
where p.slug='satin-dress'
on conflict (sku) do update set name=excluded.name,options=excluded.options;

insert into public.inventory(product_id,variant_id,quantity_available)
select p.id,v.id,case v.name when 'XS' then 2 when 'S' then 3 when 'M' then 4 else 0 end
from public.product_variants v join public.products p on p.id=v.product_id
where p.slug='satin-dress'
on conflict (product_id,variant_id) do update set quantity_available=excluded.quantity_available;

with images(slug,url) as (
 values
 ('velora-glow-cleanser','https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85'),
 ('rose-water-serum','https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=85'),
 ('silk-hair-mask','https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85'),
 ('velvet-lipstick','https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85'),
 ('daily-moisturizer','https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85'),
 ('body-mist-rose','https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=900&q=85'),
 ('silk-shampoo','https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85'),
 ('soft-blush','https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'),
 ('satin-dress','https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'),
 ('mini-crossbody','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85'),
 ('gold-watch','https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=85'),
 ('body-butter','https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85')
)
insert into public.product_images(product_id,url,alt_text,position)
select p.id,images.url,p.name,0 from images join public.products p on p.slug=images.slug
on conflict(product_id,position) do update set url=excluded.url,alt_text=excluded.alt_text;

insert into public.store_settings(setting_key,setting_value) values
  ('store',jsonb_build_object('name','VELORA','tagline','جمالك، أسلوبك، اختيارك','currency','EGP')),
  ('contact',jsonb_build_object('phone','16688','email','hello@velora.eg','city','القاهرة، مصر')),
  ('shipping',jsonb_build_object('flat_fee',60,'free_shipping_minimum',1500))
on conflict (setting_key) do nothing;
