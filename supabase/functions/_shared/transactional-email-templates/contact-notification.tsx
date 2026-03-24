import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "EXOS"

interface ContactNotificationProps {
  name?: string
  email?: string
  company?: string
  subject?: string
  message?: string
}

const ContactNotificationEmail = ({ name, email, company, subject, message }: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandLabel}>{SITE_NAME}</Text>
        <Heading style={h1}>New Contact Form Submission</Heading>
        <Hr style={divider} />

        <Section style={fieldSection}>
          <Text style={fieldLabel}>Full Name</Text>
          <Text style={fieldValue}>{name || '—'}</Text>
        </Section>

        <Section style={fieldSection}>
          <Text style={fieldLabel}>Email</Text>
          <Text style={fieldValue}>{email || '—'}</Text>
        </Section>

        {company ? (
          <Section style={fieldSection}>
            <Text style={fieldLabel}>Company</Text>
            <Text style={fieldValue}>{company}</Text>
          </Section>
        ) : null}

        <Section style={fieldSection}>
          <Text style={fieldLabel}>Subject</Text>
          <Text style={fieldValue}>{subject || '—'}</Text>
        </Section>

        <Section style={fieldSection}>
          <Text style={fieldLabel}>Message</Text>
          <Text style={messageValue}>{message || '—'}</Text>
        </Section>

        <Hr style={divider} />
        <Text style={footer}>
          This email was sent because someone submitted the contact form on exosproc.com.
          You can reply directly to this email to respond to the sender.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) => `[EXOS Contact] ${data.subject || 'New message'}`,
  displayName: 'Contact form notification',
  to: 'contact@exosproc.com',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Acme Corp',
    subject: 'Enterprise pricing inquiry',
    message: 'Hi, I would like to learn more about your enterprise offerings and schedule a demo for our procurement team.',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#3d8b7a', margin: '0 0 24px', textTransform: 'uppercase' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 8px' }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const fieldSection = { margin: '0 0 16px' }
const fieldLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const fieldValue = { fontSize: '15px', color: '#1a2332', margin: '0', lineHeight: '1.5' }
const messageValue = { fontSize: '15px', color: '#1a2332', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0', lineHeight: '1.5' }
