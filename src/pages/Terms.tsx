import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const LAST_UPDATED = "2026-04-16";

const Terms = () => {
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
              <span className="text-gradient">Terms</span> of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <div className="card-elevated border border-border/50 rounded-xl p-8 md:p-10 space-y-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <section>
              <p className="text-foreground leading-relaxed">
                These Terms of Service ("Terms") govern your access to and use of
                the EXOS procurement intelligence platform (the "Service") provided
                by EXOS ("we", "us"). By creating an account or using the Service,
                you agree to these Terms. If you do not agree, do not use the
                Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                1. Service Description
              </h2>
              <p className="text-foreground leading-relaxed">
                EXOS provides AI-assisted procurement scenario analysis, market
                intelligence, and related reporting tools. The Service combines
                structured inputs you provide with external market data and AI
                models to generate decision-support outputs.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                2. Account Responsibilities
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  You are responsible for the accuracy of information you submit.
                </li>
                <li>
                  You must keep your credentials confidential and notify us promptly
                  of any unauthorized access.
                </li>
                <li>
                  You are responsible for actions taken under your account,
                  including by users you invite to your organization.
                </li>
                <li>
                  You must be at least 18 years old and legally authorized to enter
                  into this agreement on behalf of yourself or your organization.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                3. Acceptable Use
              </h2>
              <p className="text-foreground leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  Use the Service to violate any law, regulation, or third-party
                  right.
                </li>
                <li>
                  Attempt to reverse-engineer, probe, or disrupt the Service, its
                  infrastructure, or its rate limits.
                </li>
                <li>
                  Submit content that is unlawful, infringing, harmful, or contains
                  malware.
                </li>
                <li>
                  Use the Service to build a competing product, or resell the
                  Service without written permission.
                </li>
                <li>
                  Submit personal data of third parties without an appropriate legal
                  basis.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                4. Intellectual Property
              </h2>
              <p className="text-foreground leading-relaxed mb-3">
                <strong>Your content.</strong> You retain ownership of all data and
                files you upload to the Service. You grant EXOS a limited,
                non-exclusive license to process that content solely to provide the
                Service to you.
              </p>
              <p className="text-foreground leading-relaxed mb-3">
                <strong>Our platform.</strong> EXOS retains all rights in the
                Service, including software, methodologies, and scenario templates.
              </p>
              <p className="text-foreground leading-relaxed">
                <strong>AI outputs.</strong> Generated reports are provided as-is to
                support your decision-making. They are not a substitute for
                professional judgment. You are responsible for independently
                validating outputs before relying on them for commercial decisions.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                5. Fees and Payment
              </h2>
              <p className="text-foreground leading-relaxed">
                Paid plans are billed according to the pricing in effect when you
                subscribe. Fees are non-refundable except where required by law. We
                may change pricing for future billing periods with reasonable
                notice.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                6. Data Processing and Privacy
              </h2>
              <p className="text-foreground leading-relaxed">
                Our processing of personal data is described in our{" "}
                <a href="/privacy" className="text-primary underline underline-offset-2">
                  Privacy Policy
                </a>
                , which forms part of these Terms. Enterprise customers may request
                a Data Processing Agreement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                7. Disclaimers
              </h2>
              <p className="text-foreground leading-relaxed">
                The Service is provided "as is" and "as available." To the fullest
                extent permitted by law, EXOS disclaims all warranties, express or
                implied, including fitness for a particular purpose, merchantability,
                and non-infringement. AI-generated outputs may contain errors and
                should not be treated as authoritative advice.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                8. Limitation of Liability
              </h2>
              <p className="text-foreground leading-relaxed">
                To the fullest extent permitted by law, EXOS shall not be liable for
                indirect, incidental, special, or consequential damages, or for lost
                profits or lost data, arising out of or related to the Service. Our
                aggregate liability for any claim shall not exceed the fees you paid
                for the Service in the twelve months preceding the event giving rise
                to the claim.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                9. Termination
              </h2>
              <p className="text-foreground leading-relaxed">
                You may stop using the Service at any time and request account
                deletion. We may suspend or terminate your access for material
                breach of these Terms. Upon termination, your right to use the
                Service ceases; sections that by their nature should survive
                (including IP, disclaimers, and limitation of liability) will
                survive.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                10. Governing Law
              </h2>
              <p className="text-foreground leading-relaxed">
                These Terms are governed by the laws of the European Union and the
                member state in which EXOS is established, without regard to
                conflict-of-law principles. Disputes shall be resolved in the
                competent courts of that member state, subject to any mandatory
                consumer-protection rules.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                11. Changes to these Terms
              </h2>
              <p className="text-foreground leading-relaxed">
                We may update these Terms from time to time. Material changes will
                be communicated through the Service or by email. Continued use of
                the Service after changes take effect constitutes acceptance of the
                revised Terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
                12. Contact
              </h2>
              <p className="text-foreground leading-relaxed">
                Questions about these Terms? Contact us via the form on the{" "}
                <a href="/pricing#contact" className="text-primary underline underline-offset-2">
                  Pricing page
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
