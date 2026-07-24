import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Resolves the current authenticated user from the request, or null.
 * Every API route that touches Plan/Product/ProcessStep/Hazard/Ingredient/
 * Vendor/HaccpTeamMember data MUST use this (and then scope its Prisma
 * query by userId) rather than trusting any id passed in the request body —
 * that's what keeps one user's facility data from being readable by
 * another ("isolation by construction", see README).
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

/** Loads a plan only if it belongs to the given user; otherwise returns null. */
export async function getOwnedPlan(planId: string, userId: string) {
  return db.plan.findFirst({ where: { id: planId, userId } });
}

/** Loads a product only if it belongs to a plan owned by the given user; otherwise returns null. */
export async function getOwnedProduct(planId: string, productId: string, userId: string) {
  const owned = await getOwnedPlan(planId, userId);
  if (!owned) return null;
  return db.product.findFirst({ where: { id: productId, planId: owned.id } });
}

/** Loads a process step only if it belongs to an owned product; otherwise returns null. */
export async function getOwnedProcessStep(planId: string, productId: string, stepId: string, userId: string) {
  const product = await getOwnedProduct(planId, productId, userId);
  if (!product) return null;
  return db.processStep.findFirst({ where: { id: stepId, productId: product.id } });
}
