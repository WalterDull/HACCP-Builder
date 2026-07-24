import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";

async function getOwnedMember(planId: string, memberId: string, userId: string) {
  const plan = await getOwnedPlan(planId, userId);
  if (!plan) return null;
  return db.haccpTeamMember.findFirst({ where: { id: memberId, planId: plan.id } });
}

export async function PATCH(req: Request, { params }: { params: { id: string; memberId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedMember(params.id, params.memberId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const f of ["name", "role", "expertise", "responsibilities"] as const) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  const updated = await db.haccpTeamMember.update({ where: { id: owned.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string; memberId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedMember(params.id, params.memberId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.haccpTeamMember.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
}
