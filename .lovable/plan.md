## Confirmed copy for item 6

Free-trial line under each paid CTA button:

> 30-day free trial · 30 reports included

(Enterprise card keeps "Contact Sales" without the trial line.)

## Status of remaining /pricing audit items

Done so far: 4, 5, 11, 13.

### Tier 1 — propose to do in the next batch
1. **H1 rewrite** — outcome H1 ("Plans that scale from one buyer to a global procurement team"); demote disclaimers to a sub-line.
3. **Single global billing toggle** — one Monthly/Quarterly toggle above the cards, remove the per-card `<Tabs>` (also fixes a11y item 18).
6. **Free-trial line under CTA** — render "30-day free trial · 30 reports included" directly beneath each paid plan's CTA button.
7. **Expand comparison table** — add rows: AI scenarios/month, Market Intelligence depth, Custom scenarios/month, Multi-user seats, Exports, Data anonymisation, SSO, SLA, Support tier.
9. **VAT note under prices** — append "ex. VAT" beneath each price.
12. **FAQ re-ordering** — lead with cancel/downgrade, what happens after trial, refunds, data ownership, SSO; push customisation/roadmap further down.

### Tier 2 — follow-up batch
2. Trust strip under H1.
8. Annual billing option (replace Quarterly or add as third).
16. "Cancel anytime · Prorated refund within 30 days" reassurance line.

### Tier 3 — polish
10. Enterprise price anchor ("From €X / Typically €X+ MRR").
14. Shrink hero logo on /pricing.
15. Reduce gradient headings (max one per viewport).
17. De-duplicate inline Contact section vs Footer.
18. Tabs a11y — already resolved by item 3.

## Technical scope (Tier 1 batch)

All edits live in `src/pages/Pricing.tsx`:

- Lift `billingInterval` state above the cards; render one shared `<Tabs>` and pass `billingInterval` as a prop into each `PricingCard`.
- Add `<p className="text-xs text-muted-foreground mt-2 text-center">30-day free trial · 30 reports included</p>` under the CTA `<Button>` in Starter and Professional cards only.
- H1 swap: replace current H1 string and split disclaimers into a smaller sub-line beneath it.
- Comparison table: extend the `comparisonRows` array (or inline `<TableRow>`s) with the new rows.
- VAT note: append small `<span className="text-xs text-muted-foreground">ex. VAT</span>` next to/under each price in `PricingCard`.
- Reorder `faqData` array.

No backend, schema, or edge function work. JSON-LD already added in item 13 picks up the new H1 / FAQ order automatically.

Switch to build mode to execute the Tier 1 batch, or tell me to drop/add items.