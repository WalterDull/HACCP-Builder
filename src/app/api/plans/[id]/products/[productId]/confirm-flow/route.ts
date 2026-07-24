import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProduct } from "@/lib/session";
import { db } from "@/lib/db";

// Preliminary Step 5: on-site confirmation that the flow diagram (this
// product's ProcessStep list) matches actual practice. Folded onto Product
// rather than a separate model, per the task spec.
export async function POST(req: Request, { params }: { params: { id: string; productId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedProduct(params.id, params.productId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updated = await db.product.update({
    where: { id: owned.id },
    data: {
      flowConfirmedBy: body.confirmedBy || null,
      flowConfirmedAt: new Date(),
      flowConfirmationNotes: body.notes || null,
    },
  });
  return NextResponse.json(updated);
}
