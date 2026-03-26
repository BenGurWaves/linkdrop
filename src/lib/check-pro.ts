import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a user has an active LinkDrop Pro subscription.
 * LinkDrop subscriptions have payment_reference starting with 'ld:'.
 * This distinguishes them from Glyph subscriptions in the shared table.
 */
export async function isLinkDropPro(
  userId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase =
    client ??
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

  const { data } = await supabase
    .from("subscriptions")
    .select("id, payment_reference, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("plan", "pro");

  if (!data || data.length === 0) return false;

  // Check if any active subscription has a LinkDrop-specific payment_reference
  return data.some(
    (sub: { payment_reference?: string | null }) =>
      sub.payment_reference?.startsWith("ld:")
  );
}
