import { Helmet } from "react-helmet-async";

/**
 * Belt-and-braces noindex for authenticated / utility routes that are also
 * disallowed in robots.txt. If a crawler ever bypasses robots.txt (e.g. via
 * an external link), this still keeps the URL out of the index.
 */
export const NoIndex = () => (
  <Helmet>
    <meta name="robots" content="noindex,nofollow" />
  </Helmet>
);
