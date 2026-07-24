import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProcessStep } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string; productId: string; stepId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const step = await getOwnedProcessStep(params.id, params.productId, params.stepId, user.id);
  if (!step) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const hazard = await db.hazard.create({
    data: {
      processStepId: step.id,
      type: body.type || "BIOLOGICAL",
      description: body.description || "New hazard",
    },
  });
  return NextResponse.json(hazard, { status: 201 });
}
