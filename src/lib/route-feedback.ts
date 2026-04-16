import { supabase } from "@/integrations/supabase/client";

export interface RouteFeedbackParams {
  source: "contact_form" | "site_feedback" | "output_feedback" | "chat_feedback" | "scenario_feedback";
  idempotency_key: string;
  // Contact form fields
  name?: string;
  email?: string;
  company?: string;
  subject?: string;
  message?: string;
  // Rating-based feedback fields
  rating?: number;
  feedback_type?: string;
  feedback_text?: string;
  scenario_id?: string;
  // Chat feedback fields
  chat_rating?: "helpful" | "not_helpful";
  message_id?: string;
  conversation_excerpt?: string;
  // Context
  page_url?: string;
}

/**
 * Fire-and-forget: routes feedback to Plain + Resend via the route-feedback edge function.
 * The DB insert is the source of truth — this is a notification channel only.
 */
export function routeFeedback(params: RouteFeedbackParams): void {
  supabase.functions
    .invoke("route-feedback", { body: params })
    .catch((err) => console.error("[route-feedback] notification failed:", err));
}
