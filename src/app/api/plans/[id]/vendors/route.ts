import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await getOwnedPlan(params.id, user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const count = await db.vendor.count({ where: { planId: plan.id } });
  const vendor = await db.vendor.create({
    data: {
      planId: plan.id,
      name: body.name || "New vendor",
      materialsSupplied: body.materialsSupplied ?? null,
      contactName: body.contactName ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      certification: body.certification ?? null,
      status: body.status || "APPROVED",
      guaranteeOnFile: !!body.guaranteeOnFile,
      guaranteeExpiry: body.guaranteeExpiry ?? null,
      approvalDate: body.approvalDate ?? null,
      notes: body.notes ?? null,
      order: count,
    },
  });
  return NextResponse.json(vendor, { status: 201 });
}
