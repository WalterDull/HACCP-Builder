import type { User } from "@prisma/client";

/**
 * Membership / billing rules, centralized so the UI, API routes, and any
 * retention-purge job all agree on what a user is entitled to.
 *
 * Pricing model (identical to the reference PCP Planner app):
 *  - FREE tier: build and edit a plan for free, but exporting the finished
 *    plan (docx) requires the one-time unlock fee.
 *  - One-time fee (per plan, tracked via Plan.isPaid): unlocks export for
 *    that plan and guarantees DEFAULT_RETENTION_DAYS of storage from the
 *    unlock date.
 *  - Storage subscription (recurring, tracked via User.storageSubscriptionEnd):
 *    keeps ALL of a user's plans stored indefinitely (renewed monthly/yearly)
 *    instead of expiring after the default retention window.
 *  - Users can always download their own data on demand regardless of tier
 *    (see /api/plans/[id]/export) as long as the plan itself is unlocked.
 */

export const DEFAULT_RETENTION_DAYS = Number(process.env.DEFAULT_RETENTION_DAYS ?? 90);

export function hasActiveStorageSubscription(user: Pick<User, "storageSubscriptionEnd">): boolean {
  return !!user.storageSubscriptionEnd && user.storageSubscriptionEnd.getTime() > Date.now();
}

export function computeRetentionExpiry(params: {
  from: Date;
  user: Pick<User, "storageSubscriptionEnd">;
}): Date | null {
  if (hasActiveStorageSubscription(params.user)) {
    return null;
  }
  const expiry = new Date(params.from);
  expiry.setDate(expiry.getDate() + DEFAULT_RETENTION_DAYS);
  return expiry;
}

export function canExportPlan(plan: { isPaid: boolean }): boolean {
  return plan.isPaid;
}
