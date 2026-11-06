import type { OrderStatus } from "@/lib/types";

export type Relation<T> = T | T[] | null;

export type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sku: string;
  retail_price: number | string;
  sale_price: number | string | null;
  categories: Relation<{ name: string; slug: string }>;
  brands: Relation<{ name: string }>;
  product_images: { url: string; position: number }[] | null;
  inventory: Relation<{ quantity_available: number; variant_id: string | null }>;
  product_variants: {
    id: string;
    name: string;
    sku: string;
    options: Record<string, string> | null;
    price_modifier: number | string;
    is_active: boolean;
    inventory: Relation<{ quantity_available: number }>;
  }[] | null;
  reviews: { rating: number }[] | null;
};

export type OrderSummaryRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number | string;
  created_at: string;
  profiles?: Relation<{ full_name: string | null; email: string | null; phone?: string | null }>;
  addresses?: Relation<{
    recipient_name: string | null;
    phone: string | null;
    governorate: string | null;
    city: string | null;
    area: string | null;
    street: string | null;
  }>;
  order_items?: { id: string }[] | null;
};

export type OrderDetailRow = Omit<OrderSummaryRow, "order_items"> & {
  subtotal: number | string;
  discount_total: number | string;
  shipping_fee: number | string;
  order_items: {
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
  }[];
};

export type CategoryAdminRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  products: { id: string }[] | null;
};

export type CouponAdminRow = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
  minimum_order: number | string;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
};

export type CustomerAdminRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type InventoryAdminRow = {
  product_id: string;
  variant_id: string | null;
  quantity_available: number;
  low_stock_threshold: number;
  updated_at: string;
  products: Relation<{ name: string; sku: string; retail_price: number | string }>;
  product_variants: Relation<{ name: string; sku: string; price_modifier: number | string }>;
};

export type InventoryMovementRow = {
  id: string;
  change_quantity: number;
  reason: string;
  created_at: string;
  products: Relation<{ name: string }>;
  profiles: Relation<{ full_name: string | null }>;
};

export type ReviewAdminRow = {
  id: string;
  rating: number;
  title: string | null;
  review_body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  products: Relation<{ name: string }>;
};

export type WholesaleApplicationAdminRow = {
  id: string;
  business_name: string;
  business_type: string;
  business_phone: string;
  registration_number: string | null;
  website: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  discount_percent: number | string;
  minimum_order_quantity: number;
  created_at: string;
  profiles: Relation<{ full_name: string | null; email: string | null }>;
};

export type AdminProductRow = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  description: string;
  category_id: string;
  brand_id: string | null;
  minimum_wholesale_quantity: number;
  retail_price: number | string;
  sale_price: number | string | null;
  is_active: boolean;
  inventory: Relation<{ quantity_available: number }>;
  product_variants: {
    id: string;
    name: string;
    sku: string;
    options: Record<string, string> | null;
    price_modifier: number | string;
    is_active: boolean;
    inventory: Relation<{ quantity_available: number }>;
  }[] | null;
};

export type WholesalePriceRow = { product_id: string; wholesale_price: number | string | null };

export type StoreSettingValue = {
  name?: string;
  logo_url?: string;
  logo_storage_path?: string | null;
  phone?: string;
  email?: string;
  city?: string;
  flat_fee?: number | string;
  free_shipping_minimum?: number | string;
  instagram?: string;
  facebook?: string;
};

export type StoreSettingRow = { setting_key: string; setting_value: unknown };
