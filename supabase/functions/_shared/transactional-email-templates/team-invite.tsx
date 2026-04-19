import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "EXOS"

interface TeamInviteProps {
  inviterName?: string
  organizationName?: string
  role?: string
  inviteUrl?: string
  expiresInDays?: number
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Team member',
  manager: 'Manager',
  admin: 'Admin',
}

const TeamInviteEmail = ({
  inviterName,
  organizationName,
  role,
  inviteUrl,
  expiresInDays,
}: TeamInviteProps) => {
  const safeInviter = inviterName || 'A colleague'
  const safeOrg = organizationName || 'their organization'
  const safeRole = ROLE_LABELS[role ?? 'user'] || 'Team member'
  const safeUrl = inviteUrl || '#'
  const safeExpiry = expiresInDays ?? 7

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{safeInviter} invited you to join {safeOrg} on {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brandLabel}>{SITE_NAME}</Text>
          <Heading style={h1}>You're invited to join {safeOrg}</Heading>
          <Text style={lede}>
            {safeInviter} has invited you to collaborate on {SITE_NAME} as a{' '}
            <strong>{safeRole}</strong>.
          </Text>

          <Section style={ctaWrap}>
            <Button href={safeUrl} style={ctaButton}>
              Accept invitation
            </Button>
          </Section>

          <Text style={fallback}>
            Or paste this link into your browser:
            <br />
            <a href={safeUrl} style={link}>{safeUrl}</a>
          </Text>

          <Hr style={divider} />

          <Text style={footer}>
            This invitation expires in {safeExpiry} days. If you weren't expecting
            this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TeamInviteEmail,
  subject: (data: Record<string, any>) =>
    `${data.inviterName || 'A colleague'} invited you to join ${data.organizationName || 'their team'} on ${SITE_NAME}`,
  displayName: 'Team invitation',
  previewData: {
    inviterName: 'Jane Doe',
    organizationName: 'Acme Corp',
    role: 'user',
    inviteUrl: 'https://exosproc.com/auth?invite=00000000-0000-0000-0000-000000000000&tab=sign-up',
    expiresInDays: 7,
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandLabel: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '2px',
  color: '#3d8b7a', margin: '0 0 24px', textTransform: 'uppercase' as const,
}
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 16px', lineHeight: '1.3' }
const lede = { fontSize: '15px', color: '#1a2332', margin: '0 0 28px', lineHeight: '1.6' }
const ctaWrap: React.CSSProperties = { margin: '8px 0 28px', textAlign: 'center' as const }
const ctaButton: React.CSSProperties = {
  backgroundColor: '#1a2332',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const fallback = { fontSize: '13px', color: '#6b7280', margin: '0 0 24px', lineHeight: '1.5' }
const link = { color: '#3d8b7a', wordBreak: 'break-all' as const }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0', lineHeight: '1.5' }
