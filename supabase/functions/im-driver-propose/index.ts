import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const goodsDefinition = body?.goods_definition;
    const driverCountTarget = body?.driver_count_target ?? 5;

    if (!goodsDefinition || typeof goodsDefinition !== "string") {
      return new Response(JSON.stringify({ error: "goods_definition is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mock response — will be replaced with Perplexity Sonar Pro integration
    const mockDrivers = [
      { name: "Crude Oil Price", rationale: "Primary energy input affecting logistics, packaging, and petrochemical-derived materials." },
      { name: "Regional Labour Cost Index", rationale: "Labour cost inflation directly impacts unit economics and service delivery." },
      { name: "Container Freight Rate", rationale: "Shipping costs fluctuate with demand, fuel prices, and geopolitical disruptions." },
      { name: "Base Metal Index (Copper/Aluminium)", rationale: "Key industrial metals used in components and packaging." },
      { name: "Currency Exchange Volatility", rationale: "FX movements affect imported input costs and procurement competitiveness." },
    ].slice(0, driverCountTarget);

    return new Response(JSON.stringify({ drivers: mockDrivers }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("im-driver-propose error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
