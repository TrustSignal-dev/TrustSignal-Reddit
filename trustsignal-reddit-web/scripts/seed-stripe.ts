/**
 * Stripe seed script — creates products and prices for TrustSignal tiers.
 * Run with: npx tsx scripts/seed-stripe.ts
 *
 * AUTONOMOUS DECISION: Using a standalone script rather than a migration
 * because Stripe state is external and should be idempotent.
 */

import Stripe from "stripe";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

async function seed() {
  console.log("Seeding Stripe products and prices...\n");

  // Pro plan
  const proProduct = await stripe.products.create({
    name: "TrustSignal Pro",
    description:
      "Full AI scoring, 3 subreddits, credential issuance, priority support",
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2900,
    currency: "usd",
    recurring: { interval: "month" },
  });

  console.log(`Pro product: ${proProduct.id}`);
  console.log(`Pro price:   ${proPrice.id}`);

  // Team plan
  const teamProduct = await stripe.products.create({
    name: "TrustSignal Team",
    description:
      "Unlimited subreddits, priority scoring, CSV export, API access, team management",
  });

  const teamPrice = await stripe.prices.create({
    product: teamProduct.id,
    unit_amount: 9900,
    currency: "usd",
    recurring: { interval: "month" },
  });

  console.log(`Team product: ${teamProduct.id}`);
  console.log(`Team price:   ${teamPrice.id}`);

  console.log("\n✓ Done. Add these price IDs to your environment:");
  console.log(`  STRIPE_PRO_PRICE_ID=${proPrice.id}`);
  console.log(`  STRIPE_TEAM_PRICE_ID=${teamPrice.id}`);
}

seed().catch(console.error);
