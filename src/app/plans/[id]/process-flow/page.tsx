"use client";

import { useEffect, useState } from "react";
import ProductSelector from "@/components/ProductSelector";
import GuidancePanel from "@/components/GuidancePanel";
import { COMMON_STEP_NAMES } from "@/lib/hazardLibrary";

interface Step {
  id: string;
  order: number;
  name: string;
  description: string | null;
}

interface ProductData {
  id: string;
  name: string;
  processSteps: Step[];
  flowConfirmedBy: string | null;
  flowConfirmedAt: string | null;
  flowConfirmationNotes: string | null;
}

export default function ProcessFlowPage({ params }: { params: { id: string } }) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmedBy, setConfirmedBy] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");

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

  async function addStep(name: string) {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    load();
  }

  async function updateStep(stepId: string, patch: Partial<Step>) {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function removeStep(stepId: string) {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}`, { method: "DELETE" });
    load();
  }

  async function confirmFlow() {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/confirm-flow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmedBy, notes: confirmNotes }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Process Flow (Preliminary Steps 4 & 5)</h1>
      <p className="mt-1 text-sm text-slate-600">
        Map out each step this product goes through, receiving to shipping, then confirm the
        diagram matches what actually happens on the floor.
      </p>

      <ProductSelector products={products} activeProductId={activeId} onSelect={setActiveId} />

      {active && (
        <>
          <GuidancePanel title="Common step names">
            {COMMON_STEP_NAMES.slice(0, 12).join(" · ")} — click one below to add it, or type your own.
          </GuidancePanel>

          <div className="mb-4 flex flex-wrap gap-2">
            {COMMON_STEP_NAMES.map((name) => (
              <button
                key={name}
                onClick={() => addStep(name)}
                className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                + {name}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {[...active.processSteps].sort((a, b) => a.order - b.order).map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">#{s.order}</span>
                  <input
                    defaultValue={s.name}
                    onBlur={(e) => updateStep(s.id, { name: e.target.value })}
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm font-medium"
                  />
                  <button onClick={() => removeStep(s.id)} className="text-xs font-medium text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
                <textarea
                  defaultValue={s.description ?? ""}
                  onBlur={(e) => updateStep(s.id, { description: e.target.value })}
                  placeholder="Step description"
                  rows={1}
                  className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-800">Preliminary Step 5 — on-site confirmation</h2>
            <p className="mt-1 text-xs text-slate-500">
              {active.flowConfirmedAt
                ? `Confirmed by ${active.flowConfirmedBy ?? "—"} on ${new Date(active.flowConfirmedAt).toLocaleDateString()}.`
                : "Not yet confirmed — walk the floor and confirm this diagram matches actual practice."}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={confirmedBy}
                onChange={(e) => setConfirmedBy(e.target.value)}
                placeholder="Confirmed by (name)"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="Notes"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={confirmFlow}
              className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Confirm flow diagram
            </button>
          </div>
        </>
      )}
    </div>
  );
}
