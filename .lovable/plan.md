

## Secure Contact Form Email Integration

### Blocker: No Email Domain Configured

The project has no email domain set up. Lovable's transactional email system requires a verified sender domain before emails can be sent. This is the first step.

### Plan

#### Step 1: Set up email domain
Show the email domain setup dialog so you can configure a sender domain (e.g., `notify.exosproc.com`). You'll need to add DNS records at your domain registrar. This is a one-time setup.

#### Step 2: Set up email infrastructure
Once the domain is configured, initialize the email queue, processing pipeline, and required database tables.

#### Step 3: Scaffold transactional email system
Creates the `send-transactional-email` Edge Function, unsubscribe handling, and template registry.

#### Step 4: Create `contact-notification` template
A React Email template in `supabase/functions/_shared/transactional-email-templates/contact-notification.tsx` displaying:
- Full Name, Email, Company (if provided), Subject, Message
- EXOS brand styling (dark primary colors from the app's theme)
- White email background per platform requirements

The template's `to` field will be set to `contact@exosproc.com` in the registry, so the recipient is server-side only.

#### Step 5: Harden the Edge Function
- The `send-transactional-email` function already runs server-side. The `contact-notification` template will have `to: 'contact@exosproc.com'` baked into its registry entry, so the client cannot override the recipient.
- Add `Reply-To` support: pass the submitter's email as `replyTo` in `templateData`, and set it as a header in the send logic.

#### Step 6: Update `ContactForm.tsx`
After the successful database insert, fire a non-blocking call:
```typescript
supabase.functions.invoke('send-transactional-email', {
  body: {
    templateName: 'contact-notification',
    recipientEmail: 'contact@exosproc.com',
    idempotencyKey: `contact-notify-${id}`,
    templateData: {
      name: values.name,
      email: values.email,
      company: values.company,
      subject: values.subject,
      message: values.message,
    },
  },
}).catch(() => {});
```
The form's success state and toast remain independent of the email call.

#### Step 7: Deploy edge functions
Deploy `send-transactional-email`, `process-email-queue`, `handle-email-unsubscribe`, and `handle-email-suppression`.

#### Step 8: Create unsubscribe page
A minimal branded page at an available route for compliance.

### DNS Requirement
You'll need access to DNS settings for `exosproc.com` to add NS records. Emails won't send until DNS verification completes, but everything else can be set up immediately.

### What's NOT included
- LangSmith logging of email handoff (the existing edge function tracing already covers this; no additional work needed)
- Custom `action` field routing — the standard `templateName` routing in `send-transactional-email` achieves the same goal more cleanly

