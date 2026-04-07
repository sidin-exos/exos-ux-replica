

# Fix robots.txt — Add Sitemap Directive & Block Internal Routes

## Single Change

Replace `public/robots.txt` with the exact content provided in the task:
- Keep existing bot-specific `Allow: /` rules
- Add `Disallow` directives for admin/internal routes (`/admin/`, `/dashboards`, `/architecture`, `/dev-workflow`, `/testing-pipeline`, `/org-chart`, `/pdf-test`, `/account`, `/reset-password`, `/unsubscribe`)
- Add `Sitemap: https://exosproc.com/sitemap.xml` at the end
- `/auth` is intentionally NOT disallowed

No other files touched.

