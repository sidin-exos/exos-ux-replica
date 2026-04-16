import { Link } from "react-router-dom";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Scenarios", to: "/" },
      { label: "Market Intelligence", to: "/market-intelligence" },
      { label: "Enterprise", to: "/enterprise/risk" },
      { label: "My Account", to: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About EXOS", to: "#" },
      { label: "Blog", to: "/blog" },
      { label: "Careers", to: "#" },
      { label: "Press", to: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "GDPR Compliance", to: "/privacy" },
      { label: "Impressum", to: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "#" },
      { label: "Contact Us", to: "/pricing#contact" },
      { label: "System Status", to: "#" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EXOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
