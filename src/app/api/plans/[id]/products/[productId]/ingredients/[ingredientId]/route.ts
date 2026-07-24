import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProduct } from "@/lib/session";
import { db } from "@/lib/db";

async function getOwnedIngredient(planId: string, productId: string, ingredientId: string, userId: string) {
  const product = await getOwnedProduct(planId, productId, userId);
  if (!product) return null;
  return db.ingredient.findFirst({ where: { id: ingredientId, productId: product.id } });
}

const STRING_FIELDS = [
  "name",
  "percentageOfFormulation",
  "functionalRole",
  "countryOfOrigin",
  "allergenType",
  "notes",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; productId: string; ingredientId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedIngredient(params.id, params.productId, params.ingredientId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const f of STRING_FIELDS) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  if (typeof body.isAllergen === "boolean") data.isAllergen = body.isAllergen;
  if (body.supplierVendorId === null || typeof body.supplierVendorId === "string") {
    data.supplierVendorId = body.supplierVendorId || null;
  }

  const updated = await db.ingredient.update({ where: { id: owned.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; productId: string; ingredientId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedIngredient(params.id, params.productId, params.ingredientId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.ingredient.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
}
