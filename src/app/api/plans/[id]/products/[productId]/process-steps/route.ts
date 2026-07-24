import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProduct } from "@/lib/session";
import { db } from "@/lib/db";
import { suggestHazardsForStep, suggestAllergenHazardsForStep } from "@/lib/hazardLibrary";

export async function POST(req: Request, { params }: { params: { id: string; productId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const product = await getOwnedProduct(params.id, params.productId, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const name = body.name || "New step";
  const count = await db.processStep.count({ where: { productId: product.id } });

  const step = await db.processStep.create({
    data: { productId: product.id, name, description: body.description ?? null, order: count + 1 },
  });

  // Seed hazard suggestions from the static library plus any formulation
  // (ingredient allergen) driven suggestions, so first-time users get a
  // running start on the hazard analysis for this step.
  if (body.seedHazards !== false) {
    const ingredients = await db.ingredient.findMany({ where: { productId: product.id } });
    const suggestions = [
      ...suggestHazardsForStep(name),
      ...suggestAllergenHazardsForStep(name, ingredients),
    ];
    if (suggestions.length > 0) {
      await db.hazard.createMany({
        data: suggestions.map((s) => ({
          processStepId: step.id,
          type: s.type,
          description: s.description,
        })),
      });
    }
  }

  const withHazards = await db.processStep.findUnique({ where: { id: step.id }, include: { hazards: true } });
  return NextResponse.json(withHazards, { status: 201 });
}
