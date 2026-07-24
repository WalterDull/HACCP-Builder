import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";
import { getTemplate } from "@/lib/sopTemplates";
import { EMPTY_FACILITY_PROFILE, type FacilityProfile } from "@/types";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await getOwnedPlan(params.id, user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const templateKey = body.templateKey as string | undefined;
  const template = templateKey ? getTemplate(templateKey) : undefined;
  if (!template) return NextResponse.json({ error: "Unknown template" }, { status: 400 });

  const facility: FacilityProfile = plan.facilityProfile
    ? { ...EMPTY_FACILITY_PROFILE, ...JSON.parse(plan.facilityProfile) }
    : EMPTY_FACILITY_PROFILE;

  const [products, vendors, recallContacts, mockRecalls, haccpTeam] = await Promise.all([
    db.product.findMany({ where: { planId: plan.id }, orderBy: { order: "asc" }, include: { ingredients: { orderBy: { order: "asc" } } } }),
    db.vendor.findMany({ where: { planId: plan.id }, orderBy: { order: "asc" } }),
    db.recallContact.findMany({ where: { planId: plan.id }, orderBy: { order: "asc" } }),
    db.mockRecallRecord.findMany({ where: { planId: plan.id } }),
    db.haccpTeamMember.findMany({ where: { planId: plan.id }, orderBy: { order: "asc" } }),
  ]);

  const content = template.render({
    facility,
    products: products.map((p) => ({ id: p.id, name: p.name })),
    vendors,
    recallContacts,
    mockRecalls: mockRecalls.map((r) => ({ ...r, performedAt: r.performedAt.toISOString() })),
    haccpTeam,
    productFormulations: products.map((p) => ({
      productId: p.id,
      productName: p.name,
      ingredients: p.ingredients,
    })),
  });

  const sop = await db.sop.create({
    data: { planId: plan.id, templateKey: template.key, title: template.title, content },
  });

  return NextResponse.json(sop, { status: 201 });
}
