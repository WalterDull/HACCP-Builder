import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { stripe, STRIPE_ENABLED, PRICE_ONE_TIME, PRICE_STORAGE_SUBSCRIPTION } from "@/lib/stripe";

/**
 * Creates a Stripe Checkout session for either:
 *  - `type: "plan_unlock"` — one-time fee to unlock export for a specific plan
 *  - `type: "storage_subscription"` — recurring fee for extended cloud storage
 *
 * If Stripe isn't configured (no STRIPE_SECRET_KEY), this route returns a
 * 501 pointing at the dev-mode unlock endpoint instead, so the wizard is
 * still testable end-to-end without live billing credentials.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!STRIPE_ENABLED || !stripe) {
    return NextResponse.json(
      {
        error:
          "Billing isn't configured in this environment. Set STRIPE_SECRET_KEY (and price IDs) in .env to enable real checkout, or use /api/billing/checkout-dev-unlock in development.",
      },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (body.type === "plan_unlock") {
    const plan = await getOwnedPlan(body.planId, user.id);
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [{ price: PRICE_ONE_TIME, quantity: 1 }],
      success_url: `${origin}/plans/${plan.id}/review-export?unlocked=1`,
      cancel_url: `${origin}/plans/${plan.id}/review-export`,
      metadata: { userId: user.id, planId: plan.id, kind: "plan_unlock" },
    });
    return NextResponse.json({ url: session.url });
  }

  if (body.type === "storage_subscription") {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: PRICE_STORAGE_SUBSCRIPTION, quantity: 1 }],
      success_url: `${origin}/dashboard?subscribed=1`,
      cancel_url: `${origin}/pricing`,
      metadata: { userId: user.id, kind: "storage_subscription" },
    });
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: "Unknown checkout type" }, { status: 400 });
}
