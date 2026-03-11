

# Add Global Enterprise Footer

## New File: `src/components/layout/Footer.tsx`

Create a responsive footer with:
- Top border separator, subtle `bg-muted/30` background
- 4-column grid (Product, Company, Legal, Support) collapsing to 2 cols on mobile
- EXOS logo text + copyright bar at bottom
- All links use `react-router-dom` `Link`, placeholder `#` for non-existent pages
- Link styling: `text-sm text-muted-foreground hover:text-foreground transition-colors`

**Columns:**
- **Product:** Scenarios `/`, Market Intelligence `/market-intelligence`, Dashboards `/reports`, Enterprise `/enterprise/risk`
- **Company:** About EXOS `#`, Careers `#`, Press `#`
- **Legal:** Privacy Policy `#`, Terms of Service `#`, GDPR Compliance `#`, Impressum `#`
- **Support:** Help Center `#`, Contact Us `/pricing#contact`, System Status `#`

## Edit: `src/pages/Index.tsx`

Import and render `<Footer />` at the very bottom, after `</main>` closing tag, inside the root div. No changes to existing content.

