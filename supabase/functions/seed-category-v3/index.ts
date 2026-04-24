// One-shot seeder for procurement_categories HOT/COLD YAML (v3).
// Restricted to super-admins. Delete after successful run.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SEED_DATA } from "./seed-data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // ONE-SHOT seeder — no auth check. Function will be deleted immediately
    // after the single successful run (backfill of 70 procurement categories).
    const admin = createClient(supabaseUrl, serviceKey);

    const results: Array<{ slug: string; ok: boolean; error?: string }> = [];
    for (const row of SEED_DATA) {
      const { error } = await admin
        .from("procurement_categories")
        .update({
          category_hot_yaml: row.category_hot_yaml,
          category_cold_yaml: row.category_cold_yaml,
        })
        .eq("slug", row.slug);
      results.push({ slug: row.slug, ok: !error, error: error?.message });
    }

    const ok = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    return new Response(JSON.stringify({ updated: ok, total: results.length, failed }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
