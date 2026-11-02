export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  brand: string;
  sku: string;
  price: number;
  salePrice: number | null;
  wholesalePrice: number | null;
  stock: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  variants?: ProductVariant[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  options: Record<string, string>;
  priceModifier: number;
  stock: number;
};

export type CartLine = { productId: string; variantId?: string; quantity: number };

export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "جديد",
  confirmed: "مؤكد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};
