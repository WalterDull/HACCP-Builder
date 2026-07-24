"use client";

import { useEffect, useState } from "react";
import ProductSelector from "@/components/ProductSelector";
import DecisionTreeGuide from "@/components/DecisionTreeGuide";
import { evaluateDecisionTree, describeAnswerPath, type DecisionTreeAnswers } from "@/lib/ccpDecisionTree";

interface Hazard {
  id: string;
  type: string;
  description: string;
  requiresPreventiveControl: boolean;
  ccpQ1DoControlMeasuresExist: boolean | null;
  ccpQ2IsStepSpecificallyToControl: boolean | null;
  ccpQ3CouldContaminationExceedLimit: boolean | null;
  ccpQ4WillLaterStepEliminate: boolean | null;
  ccpStatus: string;
}

interface Step {
  id: string;
  order: number;
  name: string;
  hazards: Hazard[];
}

interface ProductData {
  id: string;
  name: string;
  processSteps: Step[];
}

function toAnswers(h: Hazard): DecisionTreeAnswers {
  return {
    q1DoControlMeasuresExist: h.ccpQ1DoControlMeasuresExist,
    q2IsStepSpecificallyToControl: h.ccpQ2IsStepSpecificallyToControl,
    q3CouldContaminationExceedLimit: h.ccpQ3CouldContaminationExceedLimit,
    q4WillLaterStepEliminate: h.ccpQ4WillLaterStepEliminate,
  };
}

export default function CcpDeterminationPage({ params }: { params: { id: string } }) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  async function load(keepActive = true) {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setProducts(plan.products ?? []);
    if (!keepActive || !activeId) setActiveId(plan.products?.[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const active = products.find((p) => p.id === activeId) ?? null;

  async function answer(stepId: string, hazardId: string, field: keyof DecisionTreeAnswers, value: boolean) {
    if (!active) return;
    const fieldMap: Record<keyof DecisionTreeAnswers, string> = {
      q1DoControlMeasuresExist: "ccpQ1DoControlMeasuresExist",
      q2IsStepSpecificallyToControl: "ccpQ2IsStepSpecificallyToControl",
      q3CouldContaminationExceedLimit: "ccpQ3CouldContaminationExceedLimit",
      q4WillLaterStepEliminate: "ccpQ4WillLaterStepEliminate",
    };
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}/hazards/${hazardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [fieldMap[field]]: value }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">CCP Determination (Principle 2)</h1>
      <p className="mt-1 text-sm text-slate-600">
        Run each significant hazard through the Codex four-question decision tree.
      </p>
      <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        Show all hazards (not just those marked significant)
      </label>

      <ProductSelector products={products} activeProductId={activeId} onSelect={setActiveId} />

      {active &&
        [...active.processSteps].sort((a, b) => a.order - b.order).map((step) => {
          const hazards = step.hazards.filter((h) => showAll || h.requiresPreventiveControl);
          if (hazards.length === 0) return null;
          return (
            <div key={step.id} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Step {step.order}: {step.name}
              </h2>
              <div className="mt-3 space-y-4">
                {hazards.map((h) => {
                  const answers = toAnswers(h);
                  const result = evaluateDecisionTree(answers);
                  return (
                    <div key={h.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm font-medium text-slate-800">
                        {h.type}: {h.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{describeAnswerPath(answers) || "No answers yet"}</p>
                      <p
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          result.status === "CCP"
                            ? "bg-red-100 text-red-700"
                            : result.status === "NOT_A_CCP"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {result.status}
                      </p>
                      {result.reason && <p className="mt-1 text-xs text-slate-600">{result.reason}</p>}

                      {result.nextQuestion && (
                        <>
                          <DecisionTreeGuide nextQuestion={result.nextQuestion} />
                          <div className="flex gap-2">
                            <button
                              onClick={() => answer(step.id, h.id, result.nextQuestion!, true)}
                              className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => answer(step.id, h.id, result.nextQuestion!, false)}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              No
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
