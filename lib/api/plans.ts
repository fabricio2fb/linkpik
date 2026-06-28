export const PLAN_LIMITS = {
  free: {
    max_products: 3,
    max_links: 5,
    custom_domain: false,
    analytics_days: 7,
    upsell: false,
    marketplace_fee: 0.10,
  },
  pro: {
    max_products: 999,
    max_links: 999,
    custom_domain: true,
    analytics_days: 90,
    upsell: true,
    marketplace_fee: 0.05,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function calculateMarketplaceFees(params: { amount: number; plan: Plan }): {
  platformFee: number;
  creatorAmount: number;
} {
  const limits = getPlanLimits(params.plan);
  const platformFee = Math.round(params.amount * limits.marketplace_fee * 100) / 100;
  const creatorAmount = Math.round((params.amount - platformFee) * 100) / 100;

  return {
    platformFee,
    creatorAmount: Math.max(0, creatorAmount),
  };
}
