import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function jsonResponse(req: Request, data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse(req, { error: 'Server configuration error' }, 500)
  }

  // Extract token. GET is read-only (validation); POST is state-changing.
  //
  // CSRF model:
  //   - GET takes token from the query string and only ever returns whether
  //     the token is valid. No mutation is performed, so cross-site reads are
  //     harmless.
  //   - POST is destructive (stamps `used_at`). To prevent cross-site forms
  //     from triggering an unsubscribe we accept ONLY two payload shapes:
  //       (a) RFC 8058 One-Click: content-type
  //           `application/x-www-form-urlencoded` with a body that explicitly
  //           contains `List-Unsubscribe=One-Click`. The token MUST come from
  //           the form body, not the query string — a third-party form can
  //           set the action URL freely but cannot construct a body with the
  //           required `List-Unsubscribe` field without the recipient's
  //           consent in their mail client.
  //       (b) App JSON: content-type `application/json` from our own
  //           unsubscribe page. Browsers cannot issue cross-site
  //           `application/json` POSTs without triggering a CORS preflight,
  //           so this content-type is CSRF-safe on its own.
  //     Any other content-type (text/plain, multipart/form-data, etc.) is
  //     rejected — those are the shapes a cross-site `<form>` can produce.
  const url = new URL(req.url)
  let token: string | null = null

  if (req.method === 'GET') {
    token = url.searchParams.get('token')
  } else {
    // req.method === 'POST'
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formText = await req.text()
      const params = new URLSearchParams(formText)

      // RFC 8058: the One-Click marker MUST be present in the body.
      if (params.get('List-Unsubscribe') !== 'One-Click') {
        return jsonResponse(req, 
          {
            error:
              'One-Click unsubscribe required: body must include List-Unsubscribe=One-Click',
          },
          400,
        )
      }

      // Token MUST come from the body. We deliberately ignore any
      // query-string token here — that path was the CSRF vector.
      token = params.get('token')
    } else if (contentType.includes('application/json')) {
      try {
        const body = await req.json()
        if (typeof body?.token === 'string') {
          token = body.token
        }
      } catch {
        return jsonResponse(req, { error: 'Invalid JSON body' }, 400)
      }
    } else {
      return jsonResponse(req, 
        {
          error:
            'Unsupported content-type. Use application/x-www-form-urlencoded (RFC 8058 One-Click) or application/json.',
        },
        415,
      )
    }
  }

  if (!token) {
    return jsonResponse(req, { error: 'Token is required' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Look up the token
  const { data: tokenRecord, error: lookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (lookupError || !tokenRecord) {
    return jsonResponse(req, { error: 'Invalid or expired token' }, 404)
  }

  if (tokenRecord.used_at) {
    return jsonResponse(req, { valid: false, reason: 'already_unsubscribed' })
  }

  // GET: Validate token (the app's unsubscribe page calls this on load)
  if (req.method === 'GET') {
    return jsonResponse(req, { valid: true })
  }

  // POST: Process the unsubscribe
  // Atomic check-and-update to avoid TOCTOU race
  const { data: updated, error: updateError } = await supabase
    .from('email_unsubscribe_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
    .is('used_at', null)
    .select()
    .maybeSingle()

  if (updateError) {
    console.error('Failed to mark token as used', { error: updateError, token })
    return jsonResponse(req, { error: 'Failed to process unsubscribe' }, 500)
  }

  if (!updated) {
    return jsonResponse(req, { success: false, reason: 'already_unsubscribed' })
  }

  // Add email to suppressed list (upsert to handle duplicates)
  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert(
      { email: tokenRecord.email.toLowerCase(), reason: 'unsubscribe' },
      { onConflict: 'email' },
    )

  if (suppressError) {
    console.error('Failed to suppress email', {
      error: suppressError,
      email: tokenRecord.email,
    })
    return jsonResponse(req, { error: 'Failed to process unsubscribe' }, 500)
  }

  console.log('Email unsubscribed', { email: tokenRecord.email })

  return jsonResponse(req, { success: true })
})
