

# Update Pricing Across EXOS

## Summary
Update the pricing model in two files to reflect the new pricing structure:
- **SMB**: €49 -> €29/month
- **Professional**: €199 -> €99/month, with an annual option at €66/month (billed €197/quarter)
- **Enterprise**: No change

## Changes

### 1. `src/pages/Pricing.tsx`
- Update SMB price from "49" to "29"
- Update Professional price from "199" to "99"
- Add annual pricing info to the Professional card showing "€66/mo billed quarterly at €197" as a secondary line beneath the main €99/month price

### 2. `src/pages/Account.tsx`
- Update SMB price from "€49" to "€29"
- Update Professional price from "€199" to "€99"

### 3. Memory Update
- Update the `pricing-model` memory to reflect new prices

## Technical Details

For the Professional tier on the Pricing page, I will add an `annualPrice` and `annualNote` field to the tier data object, and render a small secondary line below the monthly price showing the annual deal: "or €66/mo billed quarterly (€197/quarter)". This keeps the card layout clean while surfacing the annual discount.

No backend or database changes needed -- this is a frontend-only update to static pricing display data.

