import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * EXOS Sentinel Analysis Edge Function
 * 
 * Processes procurement analysis requests through the full pipeline:
 * 1. Receives pre-processed (anonymized + grounded) context from client
 * 2. Calls AI gateway with grounded prompt (Gemini 3 Flash)
 * 3. Logs prompts and responses to testing database
 * 4. Returns response for client-side validation and de-anonymization
 */

interface AnalysisRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  useLocalModel?: boolean;
  localModelEndpoint?: string;
  useGoogleAIStudio?: boolean;
  googleModel?: string;
  stream?: boolean;
  // Testing metadata
  scenarioType?: string;
  scenarioData?: Record<string, unknown>;
  industrySlug?: string | null;
  categorySlug?: string | null;
  groundingContext?: Record<string, unknown>;
  anonymizationMetadata?: Record<string, unknown>;
  enableTestLogging?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      systemPrompt, 
      userPrompt, 
      model = "google/gemini-3-flash-preview", // Default to Gemini 3 Flash
      useLocalModel = false,
      localModelEndpoint,
      useGoogleAIStudio = false,
      googleModel = "gemini-2.0-flash",
      stream = false,
      // Testing metadata
      scenarioType,
      scenarioData,
      industrySlug,
      categorySlug,
      groundingContext,
      anonymizationMetadata,
      enableTestLogging = true
    }: AnalysisRequest = await req.json();

    // Validate required fields
    if (!systemPrompt || !userPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing systemPrompt or userPrompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client for test logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = supabaseUrl && supabaseKey 
      ? createClient(supabaseUrl, supabaseKey)
      : null;

    let promptId: string | null = null;
    const startTime = performance.now();

    // Log the prompt to testing database
    if (enableTestLogging && supabase && scenarioType) {
      try {
        const { data: promptData, error: promptError } = await supabase
          .from("test_prompts")
          .insert({
            scenario_type: scenarioType,
            scenario_data: scenarioData || {},
            industry_slug: industrySlug,
            category_slug: categorySlug,
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            grounding_context: groundingContext,
            anonymization_metadata: anonymizationMetadata
          })
          .select("id")
          .single();

        if (promptError) {
          console.error("[Sentinel] Failed to log prompt:", promptError);
        } else {
          promptId = promptData.id;
          console.log(`[Sentinel] Logged prompt: ${promptId}`);
        }
      } catch (logError) {
        console.error("[Sentinel] Prompt logging error:", logError);
      }
    }

    // Future: Route to local Mistral model if configured
    if (useLocalModel && localModelEndpoint) {
      console.log(`[Sentinel] Routing to local model at ${localModelEndpoint}`);
      
      return new Response(
        JSON.stringify({ 
          error: "Local model endpoint not yet implemented",
          message: "Configure your Mistral model endpoint and uncomment the local model logic"
        }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route to Google AI Studio (BYOK mode)
    if (useGoogleAIStudio) {
      const GOOGLE_AI_STUDIO_KEY = Deno.env.get("GOOGLE_AI_STUDIO_KEY");
      
      if (!GOOGLE_AI_STUDIO_KEY) {
        console.error("[Sentinel] GOOGLE_AI_STUDIO_KEY not configured, falling back to Lovable AI");
        // Fall through to Lovable AI Gateway
      } else {
        console.log(`[Sentinel] Routing to Google AI Studio with model: ${googleModel}`);
        
        const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${GOOGLE_AI_STUDIO_KEY}`;
        
        try {
          const googleResponse = await fetch(googleEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 4096,
              },
            }),
          });

          const processingTime = Math.round(performance.now() - startTime);

          if (!googleResponse.ok) {
            const errorText = await googleResponse.text();
            console.error(`[Sentinel] Google AI Studio error: ${googleResponse.status}`, errorText);
            
            if (enableTestLogging && supabase && promptId) {
              await supabase.from("test_reports").insert({
                prompt_id: promptId,
                model: googleModel,
                raw_response: errorText,
                processing_time_ms: processingTime,
                success: false,
                error_message: `Google AI Studio error: ${googleResponse.status}`
              });
            }
            
            return new Response(
              JSON.stringify({ error: "Google AI Studio error", details: errorText }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const googleData = await googleResponse.json();
          const content = googleData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          // Extract token usage from Google's format
          const usage = googleData.usageMetadata ? {
            prompt_tokens: googleData.usageMetadata.promptTokenCount || 0,
            completion_tokens: googleData.usageMetadata.candidatesTokenCount || 0,
            total_tokens: googleData.usageMetadata.totalTokenCount || 0,
          } : null;

          console.log(`[Sentinel] Google AI Studio response: ${content.length} chars`);
          console.log(`[Sentinel] Processing time: ${processingTime}ms`);

          // Log successful response
          if (enableTestLogging && supabase && promptId) {
            try {
              await supabase.from("test_reports").insert({
                prompt_id: promptId,
                model: googleModel,
                raw_response: content,
                processing_time_ms: processingTime,
                token_usage: usage,
                success: true
              });
              console.log(`[Sentinel] Logged report for prompt: ${promptId}`);
            } catch (reportError) {
              console.error("[Sentinel] Failed to log report:", reportError);
            }
          }

          return new Response(
            JSON.stringify({
              content,
              model: googleModel,
              source: "google_ai_studio",
              usage,
              promptId,
              processingTimeMs: processingTime
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (googleError) {
          console.error("[Sentinel] Google AI Studio fetch error:", googleError);
          // Fall through to Lovable AI Gateway
        }
      }
    }

    // Call Lovable AI Gateway with retry logic for transient errors
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Sentinel] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Sentinel] Calling AI gateway with model: ${model}`);
    console.log(`[Sentinel] System prompt length: ${systemPrompt.length} chars`);
    console.log(`[Sentinel] User prompt length: ${userPrompt.length} chars`);

    // Retry logic for transient errors (503, connection resets)
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
    let aiResponse: Response | null = null;
    let lastError: string | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[Sentinel] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAYS[attempt - 1]}ms`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
        }

        aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.4,
            max_completion_tokens: 4096,
            stream
          }),
        });

        // If we get a 503 (service unavailable), retry
        if (aiResponse.status === 503) {
          lastError = await aiResponse.text();
          console.warn(`[Sentinel] Got 503 on attempt ${attempt + 1}: ${lastError}`);
          if (attempt < MAX_RETRIES - 1) continue;
        }

        // Success or non-retryable error, break out
        break;
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : "Network error";
        console.warn(`[Sentinel] Fetch error on attempt ${attempt + 1}: ${lastError}`);
        if (attempt === MAX_RETRIES - 1) {
          return new Response(
            JSON.stringify({ error: "AI gateway connection failed after retries", details: lastError }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: "AI gateway unavailable", details: lastError }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Math.round(performance.now() - startTime);

    // Handle rate limits and payment required
    if (aiResponse.status === 429) {
      console.warn("[Sentinel] Rate limit exceeded");
      
      // Log error to test reports
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId,
          model,
          raw_response: "",
          processing_time_ms: processingTime,
          success: false,
          error_message: "Rate limit exceeded"
        });
      }
      
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (aiResponse.status === 402) {
      console.warn("[Sentinel] Payment required");
      
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId,
          model,
          raw_response: "",
          processing_time_ms: processingTime,
          success: false,
          error_message: "Payment required"
        });
      }
      
      return new Response(
        JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[Sentinel] AI gateway error: ${aiResponse.status}`, errorText);
      
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId,
          model,
          raw_response: errorText,
          processing_time_ms: processingTime,
          success: false,
          error_message: `AI gateway error: ${aiResponse.status}`
        });
      }
      
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle streaming response
    if (stream) {
      return new Response(aiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Handle non-streaming response
    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log(`[Sentinel] Response received: ${content.length} chars`);
    console.log(`[Sentinel] Processing time: ${processingTime}ms`);

    // Log successful response to test reports
    if (enableTestLogging && supabase && promptId) {
      try {
        await supabase.from("test_reports").insert({
          prompt_id: promptId,
          model,
          raw_response: content,
          processing_time_ms: processingTime,
          token_usage: data.usage || null,
          success: true
        });
        console.log(`[Sentinel] Logged report for prompt: ${promptId}`);
      } catch (reportError) {
        console.error("[Sentinel] Failed to log report:", reportError);
      }
    }

    return new Response(
      JSON.stringify({
        content,
        model,
        source: "cloud",
        usage: data.usage,
        promptId, // Return for client-side reference
        processingTimeMs: processingTime
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Sentinel] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
