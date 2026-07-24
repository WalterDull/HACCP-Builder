import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProduct } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string; productId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const product = await getOwnedProduct(params.id, params.productId, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const count = await db.ingredient.count({ where: { productId: product.id } });
  const ingredient = await db.ingredient.create({
    data: {
      productId: product.id,
      name: body.name || "New ingredient",
      percentageOfFormulation: body.percentageOfFormulation ?? null,
      functionalRole: body.functionalRole ?? null,
      supplierVendorId: body.supplierVendorId || null,
      countryOfOrigin: body.countryOfOrigin ?? null,
      isAllergen: !!body.isAllergen,
      allergenType: body.allergenType ?? null,
      notes: body.notes ?? null,
      order: count,
    },
  });
  return NextResponse.json(ingredient, { status: 201 });
}
