/**
 * route-feedback — Routes feedback submissions to Plain (support threads)
 * and Resend (backup email notification to support@exosproc.com).
 *
 * Auth note: verify_jwt is FALSE in config.toml because this endpoint must be
 * callable by unauthenticated users (e.g., public contact form, anonymous
 * feedback). User context is extracted from the auth header when present.
 */

import { corsHeaders } from "../_shared/cors.ts";
import {
  parseBody,
  requireString,
  requireStringEnum,
  ValidationError,
} from "../_shared/validate.ts";
import { createPlainThread } from "../_shared/plain.ts";
import { sendResendEmail } from "../_shared/resend.ts";

const FEEDBACK_SOURCES = [
  "contact_form",
  "site_feedback",
  "output_feedback",
  "chat_feedback",
  "scenario_feedback",
] as const;

type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

const RESEND_FROM = "EXOS Feedback <feedback@exosproc.com>";
const RESEND_TO = "support@exosproc.com";

const PLAIN_LABELS: Record<string, string[]> = {
  contact_form: ["lt_01KN20XXT6VKQNERR38S9B93VS", "lt_01KN216H0XKR8Z88KZD6S76EVB"], // contact, inbound
  site_feedback: ["lt_01KN213DG8E9QTK7M8R92MGSZS"], // feedback (+ feedbackType label added dynamically)
  output_feedback: ["lt_01KN213DG8E9QTK7M8R92MGSZS", "lt_01KN215XKN16AKRB27S1JBT7BZ"], // feedback, output-quality
  chat_feedback: ["lt_01KN214Y98WFR5816150HBQX30", "lt_01KN213DG8E9QTK7M8R92MGSZS"], // chat, feedback
  scenario_feedback: ["lt_01KN213DG8E9QTK7M8R92MGSZS", "lt_01KN215EA2PQVQCF0SPA52VSWQ"], // feedback, scenario
};

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  bug: "lt_01KN213XWQF042DF32Q1QRQR7D",
  feature: "lt_01KN214CJVMEX679PQFMGVPTXQ",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await parseBody(req);

    const source = requireStringEnum(body.source, "source", FEEDBACK_SOURCES) as FeedbackSource;
    const idempotencyKey = requireString(body.idempotency_key, "idempotency_key", { maxLength: 100 });

    // Optional fields — all feedback types
    const rating = typeof body.rating === "number" ? body.rating : undefined;
    const feedbackText = typeof body.feedback_text === "string" ? body.feedback_text.slice(0, 5000) : undefined;
    const feedbackType = typeof body.feedback_type === "string" ? body.feedback_type.slice(0, 50) : undefined;
    const scenarioId = typeof body.scenario_id === "string" ? body.scenario_id.slice(0, 100) : undefined;
    const pageUrl = typeof body.page_url === "string" ? body.page_url.slice(0, 500) : undefined;

    // Contact form fields
    const name = typeof body.name === "string" ? body.name.slice(0, 100) : undefined;
    const email = typeof body.email === "string" ? body.email.slice(0, 254) : undefined;
    const company = typeof body.company === "string" ? body.company.slice(0, 100) : undefined;
    const subject = typeof body.subject === "string" ? body.subject.slice(0, 200) : undefined;
    const message = typeof body.message === "string" ? body.message.slice(0, 5000) : undefined;

    // Chat feedback fields
    const chatRating = typeof body.chat_rating === "string" ? body.chat_rating.slice(0, 20) : undefined;
    const messageId = typeof body.message_id === "string" ? body.message_id.slice(0, 100) : undefined;
    const conversationExcerpt = typeof body.conversation_excerpt === "string" ? body.conversation_excerpt.slice(0, 5000) : undefined;

    // Build Plain thread title + description
    const { title, description } = buildThreadContent(source, {
      rating, feedbackText, feedbackType, scenarioId, pageUrl,
      name, email, company, subject, message,
      chatRating, messageId, conversationExcerpt,
    });

    // Build Resend email subject + body
    const emailSubject = `[EXOS] ${title}`;
    const emailBody = buildEmailBody(source, {
      rating, feedbackText, feedbackType, scenarioId, pageUrl,
      name, email, company, subject, message,
      chatRating, messageId, conversationExcerpt,
    });

    // Resolve Plain label type IDs for this source + feedbackType
    const labelTypeIds = [
      ...(PLAIN_LABELS[source] || []),
      ...(feedbackType && FEEDBACK_TYPE_LABELS[feedbackType] ? [FEEDBACK_TYPE_LABELS[feedbackType]] : []),
    ];

    // Dispatch to Plain + Resend in parallel
    const plainApiKey = Deno.env.get("PLAIN_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const results = await Promise.allSettled([
      // Plain: create support thread
      plainApiKey
        ? createPlainThread(plainApiKey, {
            email: email || "anonymous@exosproc.com",
            name,
            company,
            title,
            description,
            labelTypeIds,
          })
        : Promise.resolve({ ok: false, error: "PLAIN_API_KEY not configured" }),

      // Resend: backup email notification
      resendApiKey
        ? sendResendEmail(resendApiKey, {
            from: RESEND_FROM,
            to: RESEND_TO,
            subject: emailSubject,
            text: emailBody,
          })
        : Promise.resolve({ ok: false, error: "RESEND_API_KEY not configured" }),
    ]);

    const plainResult = results[0].status === "fulfilled" ? results[0].value : { ok: false, error: "rejected" };
    const resendResult = results[1].status === "fulfilled" ? results[1].value : { ok: false, error: "rejected" };

    if (!plainResult.ok) {
      console.warn("[route-feedback] Plain failed:", plainResult.error);
    }
    if (!resendResult.ok) {
      console.warn("[route-feedback] Resend failed:", resendResult.error);
    }

    console.log("[route-feedback] Routed", {
      source,
      idempotencyKey,
      plain: plainResult.ok,
      resend: resendResult.ok,
    });

    return new Response(
      JSON.stringify({ plain: plainResult, resend: resendResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    if (err instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("[route-feedback] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// --- Helpers ---

interface FeedbackFields {
  rating?: number;
  feedbackText?: string;
  feedbackType?: string;
  scenarioId?: string;
  pageUrl?: string;
  name?: string;
  email?: string;
  company?: string;
  subject?: string;
  message?: string;
  chatRating?: string;
  messageId?: string;
  conversationExcerpt?: string;
}

function buildThreadContent(
  source: FeedbackSource,
  f: FeedbackFields
): { title: string; description: string } {
  switch (source) {
    case "contact_form":
      return {
        title: `[Contact] ${f.subject || "No subject"}`,
        description: [
          `From: ${f.name || "Unknown"} <${f.email || "no email"}>`,
          f.company ? `Company: ${f.company}` : null,
          `Subject: ${f.subject || "N/A"}`,
          "",
          f.message || "No message provided.",
        ]
          .filter((l) => l !== null)
          .join("\n"),
      };

    case "site_feedback":
      return {
        title: `[Feedback] ${f.feedbackType || "general"} \u2014 ${f.rating || "?"}/10`,
        description: [
          `Rating: ${f.rating || "N/A"}/10`,
          f.feedbackType ? `Type: ${f.feedbackType}` : null,
          f.feedbackText ? `\nComments:\n${f.feedbackText}` : null,
          f.pageUrl ? `\nPage: ${f.pageUrl}` : null,
        ]
          .filter((l) => l !== null)
          .join("\n"),
      };

    case "output_feedback":
      return {
        title: `[Output] Rating ${f.rating || "?"}/10 \u2014 scenario ${f.scenarioId || "unknown"}`,
        description: [
          `Rating: ${f.rating || "N/A"}/10`,
          f.scenarioId ? `Scenario: ${f.scenarioId}` : null,
          f.feedbackText ? `\nComments:\n${f.feedbackText}` : null,
          f.pageUrl ? `\nPage: ${f.pageUrl}` : null,
        ]
          .filter((l) => l !== null)
          .join("\n"),
      };

    case "chat_feedback":
      return {
        title: `[Chat] Not helpful \u2014 msg ${f.messageId || "unknown"}`,
        description: [
          `Rating: ${f.chatRating || "not_helpful"}`,
          f.messageId ? `Message ID: ${f.messageId}` : null,
          f.conversationExcerpt
            ? `\nConversation excerpt:\n${f.conversationExcerpt}`
            : null,
          f.pageUrl ? `\nPage: ${f.pageUrl}` : null,
        ]
          .filter((l) => l !== null)
          .join("\n"),
      };

    case "scenario_feedback":
      return {
        title: `[Scenario] ${f.feedbackType || "feedback"} \u2014 ${f.rating || "?"}/10`,
        description: [
          `Rating: ${f.rating || "N/A"}/10`,
          f.feedbackType ? `Type: ${f.feedbackType}` : null,
          f.scenarioId ? `Scenario: ${f.scenarioId}` : null,
          f.feedbackText ? `\nComments:\n${f.feedbackText}` : null,
          f.pageUrl ? `\nPage: ${f.pageUrl}` : null,
        ]
          .filter((l) => l !== null)
          .join("\n"),
      };
  }
}

function buildEmailBody(source: FeedbackSource, f: FeedbackFields): string {
  const lines: string[] = [
    `Feedback Source: ${source}`,
    `Timestamp: ${new Date().toISOString()}`,
    "",
  ];

  if (source === "contact_form") {
    lines.push(`Name: ${f.name || "Unknown"}`);
    lines.push(`Email: ${f.email || "N/A"}`);
    if (f.company) lines.push(`Company: ${f.company}`);
    lines.push(`Subject: ${f.subject || "N/A"}`);
    lines.push("");
    lines.push(f.message || "No message provided.");
  } else if (source === "chat_feedback") {
    lines.push(`Rating: ${f.chatRating || "not_helpful"}`);
    if (f.messageId) lines.push(`Message ID: ${f.messageId}`);
    if (f.conversationExcerpt) {
      lines.push("");
      lines.push("Conversation excerpt:");
      lines.push(f.conversationExcerpt);
    }
  } else {
    lines.push(`Rating: ${f.rating || "N/A"}/10`);
    if (f.feedbackType) lines.push(`Type: ${f.feedbackType}`);
    if (f.scenarioId) lines.push(`Scenario: ${f.scenarioId}`);
    if (f.feedbackText) {
      lines.push("");
      lines.push("Comments:");
      lines.push(f.feedbackText);
    }
  }

  if (f.pageUrl) {
    lines.push("");
    lines.push(`Page: ${f.pageUrl}`);
  }

  return lines.join("\n");
}
