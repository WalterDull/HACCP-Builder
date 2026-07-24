import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await getOwnedPlan(params.id, user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const count = await db.haccpTeamMember.count({ where: { planId: plan.id } });
  const member = await db.haccpTeamMember.create({
    data: {
      planId: plan.id,
      name: body.name || "New team member",
      role: body.role ?? null,
      expertise: body.expertise ?? null,
      responsibilities: body.responsibilities ?? null,
      order: count,
    },
  });
  return NextResponse.json(member, { status: 201 });
}
