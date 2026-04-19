import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { sendResendEmail } from '../_shared/resend.ts'

// Configuration baked in at scaffold time — do NOT change these manually.
// To update, re-run the email domain setup flow.
const SITE_NAME = "exos-procurement"
// SENDER_DOMAIN is the verified sender subdomain FQDN (e.g., "notify.example.com").
// It MUST match the subdomain delegated to Lovable's nameservers — never the root domain.
// The email API looks up this exact domain; a mismatch causes "No email domain record found".
const SENDER_DOMAIN = "notify.exosproc.com"
// FROM_DOMAIN is the domain shown in the From: header (e.g., "example.com").
// When display_from_root is enabled, this can be the root domain for cleaner branding,
// even though actual sending uses the subdomain above.
const FROM_DOMAIN = "exosproc.com"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// Generate a cryptographically random 32-byte hex token
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Auth note: verify_jwt is FALSE in config.toml because this endpoint must be
// callable by unauthenticated users (e.g., public contact form submissions).
// Security is enforced in-code:
//   1. Templates without a hardcoded `to` field require a valid JWT.
//   2. Caller-provided recipients are checked against an allowlist.
//   3. Input fields are length-limited to prevent abuse.

// Allowed recipient addresses for unauthenticated callers.
// Templates with a hardcoded `to` in the registry bypass this check.
const RECIPIENT_ALLOWLIST = new Set([
  'contact@exosproc.com',
  'support@exosproc.com',
])

// Maximum size limits to prevent abuse
const MAX_TEMPLATE_NAME_LEN = 100
const MAX_EMAIL_LEN = 254
const MAX_TEMPLATE_DATA_KEYS = 20
const MAX_TEMPLATE_DATA_VALUE_LEN = 5000

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= MAX_EMAIL_LEN
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Parse request body
  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (!templateName || typeof templateName !== 'string' || templateName.length > MAX_TEMPLATE_NAME_LEN) {
    return new Response(
      JSON.stringify({ error: 'templateName is required and must be a short string' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Validate templateData size
  const dataKeys = Object.keys(templateData)
  if (dataKeys.length > MAX_TEMPLATE_DATA_KEYS) {
    return new Response(
      JSON.stringify({ error: `templateData must have at most ${MAX_TEMPLATE_DATA_KEYS} keys` }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
  for (const [key, value] of Object.entries(templateData)) {
    if (typeof value === 'string' && value.length > MAX_TEMPLATE_DATA_VALUE_LEN) {
      return new Response(
        JSON.stringify({ error: `templateData.${key} exceeds maximum length` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  }

  // 1. Look up template from registry (early — needed to resolve recipient)
  const template = TEMPLATES[templateName]

  if (!template) {
    // Do not enumerate available templates to unauthenticated callers
    return new Response(
      JSON.stringify({ error: 'Template not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Resolve effective recipient: template-level `to` takes precedence over
  // the caller-provided recipientEmail. This allows notification templates
  // to always send to a fixed address (e.g., site owner from env var).
  const effectiveRecipient = template.to || recipientEmail

  if (!effectiveRecipient) {
    return new Response(
      JSON.stringify({
        error: 'recipientEmail is required (unless the template defines a fixed recipient)',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Validate email format
  if (!isValidEmail(effectiveRecipient)) {
    return new Response(
      JSON.stringify({ error: 'Invalid recipient email address' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Security: if the template does NOT have a hardcoded recipient, the caller
  // controls who receives the email. In that case, either:
  //   a) the caller-provided address must be in the allowlist, or
  //   b) the caller must be authenticated (JWT required).
  if (!template.to) {
    const isAllowlisted = RECIPIENT_ALLOWLIST.has(effectiveRecipient.toLowerCase())
    if (!isAllowlisted) {
      // Require authentication for non-allowlisted recipients
      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authentication required for this template' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const token = authHeader.replace('Bearer ', '')
      const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
      const { error: authError } = await authClient.auth.getUser(token)
      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 2. Check suppression list (fail-closed: if we can't verify, don't send)
  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', effectiveRecipient.toLowerCase())
    .maybeSingle()

  if (suppressionError) {
    console.error('Suppression check failed — refusing to send', {
      error: suppressionError,
      effectiveRecipient,
    })
    return new Response(
      JSON.stringify({ error: 'Failed to verify suppression status' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (suppressed) {
    // Log the suppressed attempt
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })

    console.log('Email suppressed', { effectiveRecipient, templateName })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 3. Get or create unsubscribe token (one token per email address)
  const normalizedEmail = effectiveRecipient.toLowerCase()
  let unsubscribeToken: string

  // Check for existing token for this email
  const { data: existingToken, error: tokenLookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) {
    console.error('Token lookup failed', {
      error: tokenLookupError,
      email: normalizedEmail,
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to look up unsubscribe token',
    })
    return new Response(
      JSON.stringify({ error: 'Failed to prepare email' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (existingToken && !existingToken.used_at) {
    // Reuse existing unused token
    unsubscribeToken = existingToken.token
  } else if (!existingToken) {
    // Create new token — upsert handles concurrent inserts gracefully
    unsubscribeToken = generateToken()
    const { error: tokenError } = await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (tokenError) {
      console.error('Failed to create unsubscribe token', {
        error: tokenError,
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to create unsubscribe token',
      })
      return new Response(
        JSON.stringify({ error: 'Failed to prepare email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If another request raced us, our upsert was silently ignored.
    // Re-read to get the actual stored token.
    const { data: storedToken, error: reReadError } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (reReadError || !storedToken) {
      console.error('Failed to read back unsubscribe token after upsert', {
        error: reReadError,
        email: normalizedEmail,
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to confirm unsubscribe token storage',
      })
      return new Response(
        JSON.stringify({ error: 'Failed to prepare email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    unsubscribeToken = storedToken.token
  } else {
    // Token exists but is already used — email should have been caught by suppression check above.
    // This is a safety fallback; log and skip sending.
    console.warn('Unsubscribe token already used but email not suppressed', {
      email: normalizedEmail,
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
      error_message:
        'Unsubscribe token used but email missing from suppressed list',
    })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 4. Render React Email template to HTML and plain text
  const html = await renderAsync(
    React.createElement(template.component, templateData)
  )
  const plainText = await renderAsync(
    React.createElement(template.component, templateData),
    { plainText: true }
  )

  // Resolve subject — supports static string or dynamic function
  const resolvedSubject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  // 5. Send via Resend synchronously. Logs 'pending' first so we have a trace
  // even if the function crashes mid-send.

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
    metadata: {
      from_domain: FROM_DOMAIN,
      sender_domain: SENDER_DOMAIN,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
    },
  })

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    await supabase
      .from('email_send_log')
      .update({ status: 'failed', error_message: 'RESEND_API_KEY not configured' })
      .eq('message_id', messageId)
    return new Response(
      JSON.stringify({ error: 'Email service not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const sendResult = await sendResendEmail(resendApiKey, {
    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
    to: effectiveRecipient,
    subject: resolvedSubject,
    text: plainText,
    html,
  })

  if (!sendResult.ok) {
    console.error('Resend send failed', {
      error: sendResult.error,
      templateName,
      effectiveRecipient,
    })
    await supabase
      .from('email_send_log')
      .update({ status: 'failed', error_message: sendResult.error ?? 'unknown Resend error' })
      .eq('message_id', messageId)
    return new Response(
      JSON.stringify({ error: 'Failed to send email', detail: sendResult.error }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  await supabase
    .from('email_send_log')
    .update({ status: 'sent', metadata: { resend_id: sendResult.id } })
    .eq('message_id', messageId)

  console.log('Transactional email sent', {
    templateName,
    effectiveRecipient,
    resendId: sendResult.id,
  })

  return new Response(
    JSON.stringify({ success: true, sent: true, resendId: sendResult.id }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
