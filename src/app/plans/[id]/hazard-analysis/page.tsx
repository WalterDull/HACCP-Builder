"use client";

import { useEffect, useState } from "react";
import ProductSelector from "@/components/ProductSelector";
import GuidancePanel from "@/components/GuidancePanel";
import { suggestHazardsForStep, suggestAllergenHazardsForStep, type HazardTypeKey } from "@/lib/hazardLibrary";

interface Hazard {
  id: string;
  type: string;
  description: string;
  severity: string;
  likelihood: string;
  isLikelyToOccur: boolean;
  requiresPreventiveControl: boolean;
  justification: string | null;
  ccpStatus: string;
}

interface Step {
  id: string;
  order: number;
  name: string;
  hazards: Hazard[];
}

interface Ingredient {
  id: string;
  name: string;
  isAllergen: boolean;
  allergenType: string | null;
}

interface ProductData {
  id: string;
  name: string;
  processSteps: Step[];
  ingredients: Ingredient[];
}

const HAZARD_TYPES: HazardTypeKey[] = ["BIOLOGICAL", "CHEMICAL", "PHYSICAL", "RADIOLOGICAL"];
const SEVERITIES = ["LOW", "MODERATE", "HIGH", "SEVERE"];
const LIKELIHOODS = ["RARE", "POSSIBLE", "LIKELY", "ALMOST_CERTAIN"];

export default function HazardAnalysisPage({ params }: { params: { id: string } }) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function addHazard(stepId: string, type: HazardTypeKey, description: string) {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}/hazards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description }),
    });
    load();
  }

  async function suggestForStep(step: Step) {
    if (!active) return;
    const suggestions = [
      ...suggestHazardsForStep(step.name),
      ...suggestAllergenHazardsForStep(step.name, active.ingredients),
    ];
    for (const s of suggestions) {
      await addHazard(step.id, s.type, s.description);
    }
  }

  async function updateHazard(stepId: string, hazardId: string, patch: Partial<Hazard>) {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}/hazards/${hazardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function removeHazard(stepId: string, hazardId: string) {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}/hazards/${hazardId}`, {
      method: "DELETE",
    });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Hazard Analysis (Principle 1)</h1>
      <p className="mt-1 text-sm text-slate-600">
        Identify biological, chemical, physical, and radiological hazards at each process step.
      </p>

      <GuidancePanel title="Seeded suggestions">
        Click &quot;Suggest hazards&quot; on any step for a starting list based on the step name
        and, where an ingredient on the Formulations step is flagged as an allergen, an allergen
        cross-contact hazard at receiving, mixing, packaging, and changeover steps. Always a
        starting point — edit or remove freely.
      </GuidancePanel>

      <ProductSelector products={products} activeProductId={activeId} onSelect={setActiveId} />

      {active &&
        [...active.processSteps].sort((a, b) => a.order - b.order).map((step) => (
          <div key={step.id} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Step {step.order}: {step.name}
              </h2>
              <button
                onClick={() => suggestForStep(step)}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Suggest hazards
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {step.hazards.map((h) => (
                <div key={h.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <select
                      defaultValue={h.type}
                      onChange={(e) => updateHazard(step.id, h.id, { type: e.target.value })}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      {HAZARD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      defaultValue={h.description}
                      onBlur={(e) => updateHazard(step.id, h.id, { description: e.target.value })}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <select
                      defaultValue={h.severity}
                      onChange={(e) => updateHazard(step.id, h.id, { severity: e.target.value })}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          Severity: {s}
                        </option>
                      ))}
                    </select>
                    <select
                      defaultValue={h.likelihood}
                      onChange={(e) => updateHazard(step.id, h.id, { likelihood: e.target.value })}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      {LIKELIHOODS.map((l) => (
                        <option key={l} value={l}>
                          Likelihood: {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    defaultValue={h.justification ?? ""}
                    onBlur={(e) => updateHazard(step.id, h.id, { justification: e.target.value })}
                    placeholder="Justification for significance determination"
                    rows={1}
                    className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={h.requiresPreventiveControl}
                        onChange={(e) => updateHazard(step.id, h.id, { requiresPreventiveControl: e.target.checked })}
                      />
                      Significant — requires a preventive control
                    </label>
                    <button
                      onClick={() => removeHazard(step.id, h.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addHazard(step.id, "BIOLOGICAL", "New hazard")}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                + Add hazard manually
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
