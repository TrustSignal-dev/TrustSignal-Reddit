import Stripe from "stripe";

// AUTONOMOUS DECISION: Lazy-initialize Stripe to avoid build-time errors
// when STRIPE_SECRET_KEY is not set (e.g. during next build).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

// Re-export for backward compat
export { getStripe as stripe };

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    subreddits: 1,
    features: ["Basic AI scoring", "Public verification", "1 subreddit"],
  },
  pro: {
    name: "Pro",
    price: 2900, // cents
    priceId: "", // set by seed script
    subreddits: 3,
    features: [
      "Full AI scoring",
      "3 subreddits",
      "Credential issuance",
      "Priority support",
    ],
  },
  team: {
    name: "Team",
    price: 9900, // cents
    priceId: "", // set by seed script
    subreddits: -1, // unlimited
    features: [
      "Unlimited subreddits",
      "Priority scoring",
      "CSV export",
      "API access",
      "Team management",
    ],
  },
} as const;
