/**
 * Resend email helper for Deno Edge Functions.
 * Fire-and-forget backup email — never throws.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export interface ResendEmailInput {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface ResendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend REST API.
 * Returns { ok, id } on success, { ok: false, error } on failure.
 */
export async function sendResendEmail(
  apiKey: string,
  input: ResendEmailInput
): Promise<ResendResult> {
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Resend] API error:", res.status, text);
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Resend] Unexpected error:", msg);
    return { ok: false, error: msg };
  }
}
