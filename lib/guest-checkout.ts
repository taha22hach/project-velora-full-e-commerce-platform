import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export async function verifyGuestOrderConfirmation(orderId: string, token: string) {
  const service = createServiceClient();
  if (!service || !/^[a-f0-9]{64}$/i.test(token)) return null;

  const tokenBytes = new TextEncoder().encode(token.toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", tokenBytes);
  const tokenHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  const { data, error } = await service.rpc("guest_order_confirmation_secure", {
    p_order_id: orderId,
    p_confirmation_token_hash: tokenHash,
  });

  return error || typeof data !== "string" ? null : data;
}
