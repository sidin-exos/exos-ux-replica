import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const LAST_UPDATED = "2026-04-16";

const Privacy = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-12 relative">
        <article className="max-w-3xl mx-auto">
          <header className="mb-10 text-center animate-fade-up">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              <span className="text-gradient">Privacy</span> Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <div className="card-elevated border border-border/50 rounded-xl p-8 md:p-10 space-y-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <section>
              <p className="text-foreground leading-relaxed">
                EXOS ("we", "us", "our") operates the EXOS procurement intelligence
                platform (the "Service"). This Privacy Policy explains what personal
                data we collect, why we collect it, and how we handle it. We process
                personal data in accordance with the EU General Data Protection
                Regulation (GDPR).
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                1. Data Controller
              </h2>
              <p className="text-foreground leading-relaxed">
                EXOS is the data controller for personal data processed through the
                Service. For data access, correction, deletion, portability, or
                objection requests, contact us via the form on our Pricing page.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                2. Data We Collect
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  <strong>Account information:</strong> name, email, organization,
                  role, and authentication identifiers.
                </li>
                <li>
                  <strong>Procurement inputs:</strong> scenario parameters, uploaded
                  files, and other content you submit to the Service for analysis.
                </li>
                <li>
                  <strong>Usage data:</strong> interactions with the Service,
                  including feature usage, page views, and funnel events, used to
                  improve product quality and measure adoption.
                </li>
                <li>
                  <strong>Technical data:</strong> IP address, browser type, device
                  identifiers, and session metadata, used for security, fraud
                  prevention, and rate limiting.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                3. Purposes and Legal Bases
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  <strong>Service delivery</strong> — processing your procurement
                  inputs and producing analytical reports.{" "}
                  <em>Legal basis: performance of a contract.</em>
                </li>
                <li>
                  <strong>Account management and support</strong> — authentication,
                  billing, and user support.{" "}
                  <em>Legal basis: performance of a contract.</em>
                </li>
                <li>
                  <strong>Product analytics and improvement</strong> — measuring how
                  features are used so we can improve them.{" "}
                  <em>Legal basis: legitimate interests, with a prominent consent
                    gate at signup covering data processing.</em>
                </li>
                <li>
                  <strong>Security and rate limiting</strong> — protecting the
                  Service from abuse.{" "}
                  <em>Legal basis: legitimate interests.</em>
                </li>
                <li>
                  <strong>Marketing communications</strong> — product updates and
                  insights.{" "}
                  <em>Legal basis: consent (opt-in, revocable at any time).</em>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                4. Third-Party Processors
              </h2>
              <p className="text-foreground leading-relaxed mb-3">
                We use third-party sub-processors to deliver the Service. These
                categories include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Cloud infrastructure and database hosting (EU regions).</li>
                <li>
                  AI model providers used to generate analytical reports from your
                  inputs.
                </li>
                <li>Market-intelligence data providers.</li>
                <li>Transactional email and error-monitoring tools.</li>
              </ul>
              <p className="text-foreground leading-relaxed mt-3">
                Sub-processors are bound by data processing agreements and process
                personal data only on our documented instructions. Enterprise
                customers can request the current sub-processor list.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                5. Data Retention
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  <strong>Account data:</strong> retained for the lifetime of your
                  account plus 30 days after deletion, unless longer retention is
                  required by law.
                </li>
                <li>
                  <strong>Procurement inputs and generated reports:</strong>{" "}
                  retained until you delete them or close your account.
                </li>
                <li>
                  <strong>Usage and analytics data:</strong> retained in
                  aggregated/pseudonymized form for up to 24 months.
                </li>
                <li>
                  <strong>Security logs:</strong> retained for up to 12 months.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                6. Your Rights
              </h2>
              <p className="text-foreground leading-relaxed mb-3">
                Under GDPR you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request erasure ("right to be forgotten").</li>
                <li>Request data portability in a machine-readable format.</li>
                <li>Object to or restrict specific processing.</li>
                <li>Withdraw consent for processing based on consent.</li>
                <li>Lodge a complaint with your national supervisory authority.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                7. Cookies and Tracking
              </h2>
              <p className="text-foreground leading-relaxed">
                We use strictly necessary cookies to operate the Service (session,
                authentication, security). We also record funnel events that measure
                how users move through the product; these events are tied to your
                account and are governed by the consent you provide at signup.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                8. International Transfers
              </h2>
              <p className="text-foreground leading-relaxed">
                Where personal data is transferred outside the European Economic
                Area, we rely on Standard Contractual Clauses approved by the
                European Commission.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                9. Changes to this Policy
              </h2>
              <p className="text-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. Material
                changes will be communicated through the Service or by email. The
                "Last updated" date at the top of this page reflects the most recent
                revision.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                10. Contact
              </h2>
              <p className="text-foreground leading-relaxed">
                For privacy questions or data-subject requests, contact us via the
                form on the <a href="/pricing#contact" className="text-primary underline underline-offset-2">Pricing page</a>.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
