

## Add 29 scenario URLs to sitemap.xml

Single-file change: append 29 `<url>` entries to `public/sitemap.xml` before the closing `</urlset>` tag. All existing 12 entries remain untouched. Final sitemap will have 41 entries total.

### Technical detail
- File: `public/sitemap.xml`
- Edit: Insert the 29 `<url>` blocks provided in the task between the last existing `</url>` and `</urlset>`
- All URLs use `https://exosproc.com/reports/:slug` format
- No other files modified

