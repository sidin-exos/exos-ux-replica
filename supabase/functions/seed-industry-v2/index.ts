// One-time seed function: backfill industry_hot_yaml + industry_cold_yaml from v2 spec.
// Restricted to super-admin; auto-deletes itself by no-op on subsequent runs (idempotent).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import data from "./data.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: secret token must match SERVICE_ROLE_KEY (one-time admin operation)
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") || req.headers.get("x-seed-secret") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!provided || provided !== serviceKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dataset = data as Record<string, { hot: string; cold: string }>;
  const results: { slug: string; ok: boolean; error?: string }[] = [];

  for (const [slug, payload] of Object.entries(dataset)) {
    const { error } = await supabase
      .from("industry_contexts")
      .update({
        industry_hot_yaml: payload.hot,
        industry_cold_yaml: payload.cold,
      })
      .eq("slug", slug);
    results.push({ slug, ok: !error, error: error?.message });
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  return new Response(JSON.stringify({ updated: ok, failed: failed.length, errors: failed }, null, 2), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
