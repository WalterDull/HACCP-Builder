import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProcessStep } from "@/lib/session";
import { db } from "@/lib/db";
import { evaluateDecisionTree, type DecisionTreeAnswers } from "@/lib/ccpDecisionTree";

async function getOwnedHazard(
  planId: string,
  productId: string,
  stepId: string,
  hazardId: string,
  userId: string
) {
  const step = await getOwnedProcessStep(planId, productId, stepId, userId);
  if (!step) return null;
  return db.hazard.findFirst({ where: { id: hazardId, processStepId: step.id } });
}

const STRING_FIELDS = [
  "type",
  "description",
  "severity",
  "likelihood",
  "justification",
  "criticalLimit",
  "monitoringProcedure",
  "monitoringFrequency",
  "correctionAction",
  "verificationProcedure",
  "recordkeepingProcedure",
  "responsibleParty",
] as const;

const CCP_ANSWER_FIELDS = [
  "ccpQ1DoControlMeasuresExist",
  "ccpQ2IsStepSpecificallyToControl",
  "ccpQ3CouldContaminationExceedLimit",
  "ccpQ4WillLaterStepEliminate",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; productId: string; stepId: string; hazardId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedHazard(params.id, params.productId, params.stepId, params.hazardId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  for (const f of STRING_FIELDS) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  if (typeof body.isLikelyToOccur === "boolean") data.isLikelyToOccur = body.isLikelyToOccur;
  if (typeof body.requiresPreventiveControl === "boolean") data.requiresPreventiveControl = body.requiresPreventiveControl;

  let touchedAnswers = false;
  for (const f of CCP_ANSWER_FIELDS) {
    if (typeof body[f] === "boolean" || body[f] === null) {
      data[f] = body[f];
      touchedAnswers = true;
    }
  }

  // Re-run the CCP decision tree server-side on every answer update, so
  // ccpStatus is never trusted from the client (Principle 2).
  if (touchedAnswers) {
    const merged: DecisionTreeAnswers = {
      q1DoControlMeasuresExist:
        "ccpQ1DoControlMeasuresExist" in data
          ? (data.ccpQ1DoControlMeasuresExist as boolean | null)
          : owned.ccpQ1DoControlMeasuresExist,
      q2IsStepSpecificallyToControl:
        "ccpQ2IsStepSpecificallyToControl" in data
          ? (data.ccpQ2IsStepSpecificallyToControl as boolean | null)
          : owned.ccpQ2IsStepSpecificallyToControl,
      q3CouldContaminationExceedLimit:
        "ccpQ3CouldContaminationExceedLimit" in data
          ? (data.ccpQ3CouldContaminationExceedLimit as boolean | null)
          : owned.ccpQ3CouldContaminationExceedLimit,
      q4WillLaterStepEliminate:
        "ccpQ4WillLaterStepEliminate" in data
          ? (data.ccpQ4WillLaterStepEliminate as boolean | null)
          : owned.ccpQ4WillLaterStepEliminate,
    };
    const result = evaluateDecisionTree(merged);
    data.ccpStatus = result.status;
  }

  const updated = await db.hazard.update({ where: { id: owned.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; productId: string; stepId: string; hazardId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwnedHazard(params.id, params.productId, params.stepId, params.hazardId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.hazard.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
}
