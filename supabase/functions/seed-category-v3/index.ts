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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Allow either: service-role bearer (for direct admin invocation) OR
    // a valid super-admin user token.
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    let authorized = bearer === serviceKey;

    if (!authorized && bearer) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user) {
        const adm = createClient(supabaseUrl, serviceKey);
        const { data: profile } = await adm.from("profiles").select("is_super_admin").eq("id", userData.user.id).single();
        authorized = !!profile?.is_super_admin;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
