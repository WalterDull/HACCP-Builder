import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";

async function getOwnedVendor(planId: string, vendorId: string, userId: string) {
  const plan = await getOwnedPlan(planId, userId);
  if (!plan) return null;
  return db.vendor.findFirst({ where: { id: vendorId, planId: plan.id } });
}

const STRING_FIELDS = [
  "name",
  "materialsSupplied",
  "contactName",
  "phone",
  "email",
  "certification",
  "status",
  "guaranteeExpiry",
  "approvalDate",
  "notes",
] as const;

export async function PATCH(req: Request, { params }: { params: { id: string; vendorId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedVendor(params.id, params.vendorId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const f of STRING_FIELDS) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  if (typeof body.guaranteeOnFile === "boolean") data.guaranteeOnFile = body.guaranteeOnFile;

  const updated = await db.vendor.update({ where: { id: owned.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string; vendorId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedVendor(params.id, params.vendorId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.vendor.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
}
