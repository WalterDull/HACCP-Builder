import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await getOwnedPlan(params.id, user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const record = await db.mockRecallRecord.create({
    data: {
      planId: plan.id,
      performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
      performedBy: body.performedBy ?? null,
      percentTraced: body.percentTraced ?? null,
      resultsSummary: body.resultsSummary ?? null,
    },
  });
  return NextResponse.json(record, { status: 201 });
}
