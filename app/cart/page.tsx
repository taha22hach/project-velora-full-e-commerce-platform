import type { Metadata } from "next";
import { CartPage } from "@/components/cart-page";
export const metadata: Metadata = { title: "سلة التسوق" };
export default function Page() { return <CartPage />; }
