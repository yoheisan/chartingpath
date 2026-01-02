import { createClient } from "@supabase/supabase-js";
import { getSupabaseStorage } from "@/utils/safeStorage";

// We keep our primary Supabase client in PKCE mode for security.
// For password recovery emails specifically, we use an *implicit* flow client so the
// reset link contains session tokens (access/refresh) and can be opened without a
// PKCE code_verifier from the original device/browser.
//
// This improves UX for users who open the email on a different device/browser profile
// (a common cause of: "both auth code and code verifier should be non-empty").
const SUPABASE_URL = "https://dgznlsckoamseqcpzfqm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8";

let implicitRecoveryClient:
  | ReturnType<typeof createClient>
  | null = null;

export function getImplicitRecoveryClient() {
  if (implicitRecoveryClient) return implicitRecoveryClient;

  implicitRecoveryClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      flowType: "implicit",
      storage: getSupabaseStorage() as any,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return implicitRecoveryClient;
}
