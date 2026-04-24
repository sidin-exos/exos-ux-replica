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

  // Auth check: caller must be super-admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing auth token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: profile } = await supabase
    .from("profiles").select("is_super_admin").eq("id", userRes.user.id).maybeSingle();
  if (!profile?.is_super_admin) {
    return new Response(JSON.stringify({ error: "Super-admin only" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
