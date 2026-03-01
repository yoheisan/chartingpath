import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("crawl_next should work", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/discover-x-accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action: "crawl_next" }),
  });
  const body = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", body);
});
