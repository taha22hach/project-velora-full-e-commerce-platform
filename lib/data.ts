import type { Category, Product } from "@/lib/types";

export const categories: Category[] = [
  { id: "cat-skin", name: "العناية بالبشرة", slug: "skincare", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=85" },
  { id: "cat-hair", name: "العناية بالشعر", slug: "haircare", image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=85" },
  { id: "cat-makeup", name: "المكياج", slug: "makeup", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=85" },
  { id: "cat-body", name: "العناية بالجسم", slug: "body-care", image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=85" },
  { id: "cat-fashion", name: "الأزياء", slug: "fashion", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=85" },
  { id: "cat-accessories", name: "الإكسسوارات", slug: "accessories", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85" },
];

const images = [
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=85",
];

const entries = [
  ["velora-glow-cleanser", "منظف الوجه اللطيف", "غسول يومي لطيف ينظف البشرة دون أن يخل بتوازنها الطبيعي.", "skincare", "VELORA", 420, 360, "الأكثر مبيعاً", true],
  ["rose-water-serum", "سيروم ماء الورد", "تركيبة مرطبة تمنح البشرة إشراقة ونعومة طوال اليوم.", "skincare", "Maison Rose", 690, null, null, true],
  ["silk-hair-mask", "ماسك الشعر الحريري", "عناية عميقة تمنح الشعر لمعاناً وملمساً انسيابياً.", "haircare", "VELORA", 540, 470, "وفر 13٪", false],
  ["velvet-lipstick", "أحمر شفاه مخملي", "لون غني بلمسة مخملية مريحة تدوم لساعات.", "makeup", "Lumière", 390, null, null, true],
  ["daily-moisturizer", "مرطب يومي بالهيالورونيك", "ترطيب خفيف سريع الامتصاص لجميع أنواع البشرة.", "skincare", "Maison Rose", 580, 490, "اختيارنا", true],
  ["body-mist-rose", "رذاذ الجسم برائحة الورد", "رائحة وردية ناعمة ترافقك في كل لحظة.", "body-care", "VELORA", 460, null, null, false],
  ["silk-shampoo", "شامبو الحرير المغذي", "تنظيف لطيف مع عناية للشعر الجاف والمتعب.", "haircare", "Maison Rose", 380, null, null, false],
  ["soft-blush", "أحمر خدود وردي ناعم", "لمسة لون طبيعية بإشراقة صحية تدوم.", "makeup", "Lumière", 440, 395, "وصل حديثاً", true],
  ["satin-dress", "فستان ساتان وردي", "قصة أنيقة من قماش ناعم لإطلالة مسائية راقية.", "fashion", "VELORA Studio", 1890, null, null, true],
  ["mini-crossbody", "حقيبة كتف صغيرة", "حقيبة يومية أنيقة بتفاصيل ذهبية ناعمة.", "accessories", "VELORA Studio", 1450, 1290, "قطعة مميزة", false],
  ["gold-watch", "ساعة كلاسيكية ذهبية", "تصميم بسيط بلمسة ذهبية لإطلالة لا تتكرر.", "accessories", "Maison Rose", 2200, null, null, false],
  ["body-butter", "زبدة الجسم بالفانيلا", "ترطيب غني وعطر دافئ يمنح بشرتك نعومة فائقة.", "body-care", "VELORA", 610, 550, null, false],
];

export const products: Product[] = entries.map((item, index) => {
  const categorySlug = item[3] as string;
  const category = categories.find((entry) => entry.slug === categorySlug)!;
  return {
    id: "demo-" + String(index + 1),
    slug: item[0] as string,
    name: item[1] as string,
    description: item[2] as string,
    category: category.name,
    categorySlug,
    brand: item[4] as string,
    sku: "VLR-" + String(1001 + index),
    price: item[5] as number,
    salePrice: item[6] as number | null,
    wholesalePrice: null,
    stock: index === 5 ? 4 : 12 + (index % 8) * 3,
    rating: 4.6 + (index % 4) * 0.1,
    reviewCount: 18 + index * 7,
    image: images[index],
    badge: (item[7] as string | null) ?? undefined,
    isNew: item[8] as boolean,
    isBestSeller: index === 0 || index === 4 || index === 9,
    variants: index === 8 ? [
      { id: "demo-satin-xs", name: "XS", sku: "VLR-1009-XS", options: { size: "XS" }, priceModifier: 0, stock: 2 },
      { id: "demo-satin-s", name: "S", sku: "VLR-1009-S", options: { size: "S" }, priceModifier: 0, stock: 3 },
      { id: "demo-satin-m", name: "M", sku: "VLR-1009-M", options: { size: "M" }, priceModifier: 0, stock: 4 },
    ] : undefined,
  };
});

export function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value);
}

export function getDisplayPrice(product: Product) {
  return product.wholesalePrice ?? product.salePrice ?? product.price;
}

