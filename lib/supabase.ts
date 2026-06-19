// ────────────────────────────────────────────────────────────────────────────
//  Nexus Panel — Supabase Client (Server + Client)
// ────────────────────────────────────────────────────────────────────────────
import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Browser-side client (for React components) */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/** Server-side admin client (for API routes — bypasses RLS) */
export function createSupabaseAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Convenience alias for API routes */
export const supabaseAdmin = createSupabaseAdminClient();
