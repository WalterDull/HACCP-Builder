import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { canExportPlan } from "@/lib/entitlements";
import { buildPlanDocx } from "@/lib/exportDocx";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await db.plan.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      products: {
        include: { processSteps: { include: { hazards: true }, orderBy: { order: "asc" } }, ingredients: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
      vendors: { orderBy: { order: "asc" } },
      sops: true,
      recallContacts: { orderBy: { order: "asc" } },
      mockRecallRecords: true,
      haccpTeamMembers: { orderBy: { order: "asc" } },
    },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canExportPlan(plan)) {
    return NextResponse.json({ error: "Unlock this plan before exporting." }, { status: 402 });
  }

  const buffer = await buildPlanDocx(plan);
  await db.planExport.create({ data: { planId: plan.id, format: "docx" } });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${plan.name.replace(/[^a-z0-9-_ ]/gi, "").trim() || "haccp-plan"}.docx"`,
    },
  });
}
