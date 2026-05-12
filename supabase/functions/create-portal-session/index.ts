import { createClient } from "npm:@supabase/supabase-js@^2.45.0";
import Stripe from "npm:stripe@^14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    // Look up the user's Stripe customer strictly via the binding
    // stored on their profile. The previous email-based fallback
    // (audit issue #11) could attach a foreign Stripe customer when
    // two records shared an address (email change, prior account),
    // leading to cross-account billing access via the portal.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    const customerId: string | null = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      return new Response(
        JSON.stringify({
          error:
            "No Stripe customer is linked to this account. Please start a checkout to set up billing first.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const origin = req.headers.get("origin") ?? "https://exosproc.com";

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account`,
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[create-portal-session] error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
