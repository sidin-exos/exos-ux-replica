import { Link } from "react-router-dom";
import { Linkedin } from "lucide-react";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "How EXOS Works", to: "/features" },
      { label: "Sample Reports", to: "/reports" },
      { label: "Pricing", to: "/pricing" },
      { label: "Market Intelligence", to: "/welcome" },
    ],
  },
  {
    title: "Scenarios",
    links: [
      { label: "TCO Analysis", to: "/scenarios/tco-analysis" },
      { label: "Supplier Risk Assessment", to: "/scenarios/supplier-risk-assessment" },
      { label: "Negotiation Preparation", to: "/scenarios/negotiation-preparation" },
      { label: "Make or Buy Analysis", to: "/scenarios/make-or-buy-analysis" },
      { label: "Black Swan Simulation", to: "/scenarios/black-swan-simulation" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "Contact Us", to: "/pricing#contact" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold text-sm text-foreground mb-4">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg font-bold text-foreground tracking-tight">
            EXOS
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Follow us</span>
              <a
                href="https://www.linkedin.com/company/exosproc/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="EXOS on LinkedIn"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} EXOS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
