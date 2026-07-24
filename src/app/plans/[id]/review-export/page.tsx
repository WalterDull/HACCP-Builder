"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface PlanSummary {
  id: string;
  name: string;
  isPaid: boolean;
  products: { id: string; processSteps: { hazards: { ccpStatus: string }[] }[] }[];
  sops: { id: string }[];
  recallContacts: { id: string }[];
  mockRecallRecords: { id: string }[];
  haccpTeamMembers: { id: string }[];
}

function ReviewExportInner({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const p = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setPlan(p);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (searchParams.get("unlocked")) setMessage("Plan unlocked! You can now export it below.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function devUnlock() {
    setBusy(true);
    const res = await fetch("/api/billing/checkout-dev-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: params.id }),
    });
    setBusy(false);
    if (res.ok) {
      setMessage("Plan unlocked (dev mode).");
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error || "Could not unlock in dev mode.");
    }
  }

  async function realCheckout() {
    setBusy(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "plan_unlock", planId: params.id }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (body.url) {
      window.location.href = body.url;
    } else {
      setMessage(body.error || "Checkout unavailable.");
    }
  }

  if (loading || !plan) return <p className="text-sm text-slate-500">Loading…</p>;

  const totalHazards = plan.products.reduce((sum, p) => sum + p.processSteps.reduce((s, st) => s + st.hazards.length, 0), 0);
  const totalCcps = plan.products.reduce(
    (sum, p) =>
      sum +
      p.processSteps.reduce(
        (s, st) => s + st.hazards.filter((h) => h.ccpStatus === "CCP" || h.ccpStatus === "PRW").length,
        0
      ),
    0
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Review & Export</h1>
      <p className="mt-1 text-sm text-slate-600">Summary of {plan.name}, and your unlock/export options.</p>

      {message && <p className="mt-3 rounded-md border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800">{message}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Products", plan.products.length],
          ["Hazards identified", totalHazards],
          ["CCPs / preventive controls", totalCcps],
          ["HACCP team members", plan.haccpTeamMembers.length],
          ["SOPs generated", plan.sops.length],
          ["Recall team members", plan.recallContacts.length],
          ["Mock recalls logged", plan.mockRecallRecords.length],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </dl>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        {plan.isPaid ? (
          <>
            <p className="text-sm font-semibold text-brand-700">This plan is unlocked.</p>
            <a
              href={`/api/plans/${params.id}/export`}
              className="mt-3 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Download .docx
            </a>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-700">
              Unlock this plan with a one-time fee to enable the formatted Word export.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={realCheckout}
                disabled={busy}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Unlock with Stripe
              </button>
              <button
                onClick={devUnlock}
                disabled={busy}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                (Dev mode) Simulate unlock
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReviewExportPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <ReviewExportInner params={params} />
    </Suspense>
  );
}
