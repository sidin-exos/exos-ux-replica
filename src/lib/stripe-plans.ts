export const STRIPE_PLANS = {
  "price_1TEPHc34h5FyPJ356pnUXQNs": {
    name: "Starter (SMB)",
    price: 29,
    currency: "EUR",
    interval: "month",
  },
  "price_1TEPBt34h5FyPJ35YRdvRUc7": {
    name: "Professional",
    price: 99,
    currency: "EUR",
    interval: "month",
  },
  "price_1TEPId34h5FyPJ35CAqDvL37": {
    name: "Starter (SMB) — Quarterly",
    price: 72,
    currency: "EUR",
    interval: "quarter",
  },
  "price_1TEPCj34h5FyPJ35fAYMOadX": {
    name: "Professional — Quarterly",
    price: 197,
    currency: "EUR",
    interval: "quarter",
  },
} as const;

export type StripePlanId = keyof typeof STRIPE_PLANS;

export function getPlanName(priceId: string | null | undefined): string {
  if (!priceId) return "Free Plan";
  return STRIPE_PLANS[priceId as StripePlanId]?.name ?? "Unknown Plan";
}

export function getPlanDetails(priceId: string | null | undefined) {
  if (!priceId) return null;
  return STRIPE_PLANS[priceId as StripePlanId] ?? null;
}
