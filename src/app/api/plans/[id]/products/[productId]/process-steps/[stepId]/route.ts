import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProcessStep } from "@/lib/session";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; productId: string; stepId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedProcessStep(params.id, params.productId, params.stepId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.order === "number") data.order = body.order;

  const updated = await db.processStep.update({ where: { id: owned.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; productId: string; stepId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedProcessStep(params.id, params.productId, params.stepId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.processStep.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
}
