

## EXOS Registration Form Upgrade

### Summary
Replace the current basic 3-field Sign Up tab (email, password, confirm password) with a professional two-step B2B registration form per the uploaded spec, inside the existing `/auth` page.

### Architecture

```text
src/pages/Auth.tsx              ← Keep Sign In tab + forgot password unchanged
                                  Replace Sign Up TabsContent with <SignUpForm />
src/components/auth/
  SignUpForm.tsx                 ← NEW: 2-step form orchestrator
  StepIndicator.tsx             ← NEW: 2-dot progress bar
  PasswordStrengthMeter.tsx     ← NEW: 3-segment strength bar
  ConsentBlock.tsx              ← NEW: 3 checkboxes with required/optional badges
  CountrySelect.tsx             ← NEW: searchable country select with EU priority group
  JobTitleInput.tsx             ← NEW: text input with typeahead suggestions dropdown
```

### Step-by-step plan

**1. Create helper components**

- **StepIndicator**: Two circles connected by a line. Active = filled teal, inactive = outlined. Labels "Step 1 of 2" / "Step 2 of 2".
- **PasswordStrengthMeter**: 3 segments (3px height). Evaluates on keystroke: Weak (red, 1/3), Fair (amber, 2/3), Strong (teal, 3/3). Caption text below.
- **ConsentBlock**: Three shadcn Checkboxes. Consents 1-2 marked "Required" badge, Consent 3 marked "Optional". GDPR tooltip on Consent 2 via info icon.
- **CountrySelect**: shadcn Command-based searchable select. Priority group (DE, NL, IT, ES, FR, PL, BE, AT, CH, SE) shown first with separator, then EU/EEA alphabetically, then rest of world. Stores ISO alpha-2 codes.
- **JobTitleInput**: Text input with a dropdown of suggestions (Procurement Manager, CPO, etc.) that appear as the user types. Free text accepted.

**2. Create SignUpForm component**

- Two-step form using `react-hook-form` with zod validation.
- **Step 1 schema**: fullName, workEmail (with free domain blocklist), companyName, companySize (select), country (searchable select), password (min 10 chars).
- **Step 2 schema**: jobTitle, industry (select with ICP priority grouping), primaryChallenge (select), referralSource (optional select), consentTerms (required), consentDataProcessing (required), consentMarketing (optional).
- Validate on blur. Password strength updates on keystroke.
- Free email domain check: blocklist of 15 domains, inline error on blur.
- "Continue" button disabled until Step 1 valid. "Create My Account" disabled until Step 2 fields + required consents valid.
- Back button on Step 2 preserves Step 1 values.
- On submit: call `supabase.auth.signUp()` with all fields in `options.data` including derived cohort (C1/C2/C3), UTM params from URL.
- Clear password from state after signUp call.
- Handle `over_email_send_rate_limit` error gracefully.
- On success: replace form with confirmation panel (teal checkmark, "Check your inbox", email displayed, "Go back and correct it" link).

**3. Update Auth.tsx**

- Remove the inline sign-up form from the Sign Up `TabsContent`.
- Import and render `<SignUpForm />` instead.
- Remove old `signUpSchema`, `signUpForm`, and `handleEmailSignUp` (all moved into SignUpForm).
- Sign In tab, forgot password flow, and Google OAuth remain untouched.

**4. Styling details**

- Card max-width stays 480px (existing `max-w-md`). Internal padding 40px.
- Input height: 44px (h-11). Font size 14.5px in inputs.
- Focus ring: `ring-primary/12` (teal at 12% opacity).
- Section labels: 11px uppercase with letter-spacing, teal color.
- Error state: destructive border only, no red background.
- Dark mode: uses existing CSS variables (--card, --border, --primary).
- Responsive at 375px mobile.

### What stays unchanged
- Sign In tab (untouched)
- Forgot password flow (untouched)
- Google OAuth button (untouched)
- Route structure (`/auth` only)
- No new database migrations needed — all extra fields go into `raw_user_meta_data` via `options.data`, read by existing `handle_new_user()` trigger.

