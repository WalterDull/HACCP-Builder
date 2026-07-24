import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await getOwnedPlan(params.id, user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const count = await db.recallContact.count({ where: { planId: plan.id } });
  const contact = await db.recallContact.create({
    data: {
      planId: plan.id,
      role: body.role || "Team member",
      name: body.name || "New contact",
      phone: body.phone ?? null,
      email: body.email ?? null,
      order: count,
    },
  });
  return NextResponse.json(contact, { status: 201 });
}
