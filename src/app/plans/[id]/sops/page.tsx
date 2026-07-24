"use client";

import { useEffect, useState } from "react";
import TemplateDocsEditor, { type GeneratedSop } from "@/components/TemplateDocsEditor";
import { SOP_TEMPLATES } from "@/lib/sopTemplates";
import RegulatoryNote from "@/components/RegulatoryNote";

const AVAILABLE = SOP_TEMPLATES.filter((t) => t.category === "food_safety").map((t) => ({ key: t.key, title: t.title }));

export default function SopsPage({ params }: { params: { id: string } }) {
  const [generated, setGenerated] = useState<GeneratedSop[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setGenerated((plan.sops ?? []).filter((s: GeneratedSop) => AVAILABLE.some((a) => a.key === s.templateKey)));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function generate(key: string) {
    await fetch(`/api/plans/${params.id}/sops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateKey: key }),
    });
    load();
  }

  async function save(sopId: string, content: string) {
    await fetch(`/api/plans/${params.id}/sops/${sopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    load();
  }

  async function remove(sopId: string) {
    await fetch(`/api/plans/${params.id}/sops/${sopId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">SOPs</h1>
      <p className="mt-1 text-sm text-slate-600">
        Remaining hazard-specific documents, including a per-product allergen declaration built
        from your Formulations data, and the HACCP-specific validation/reassessment and
        corrective-action/verification records.
      </p>
      <RegulatoryNote>
        The Allergen Control Plan below auto-generates a per-product declaration from each
        product&apos;s ingredient list (Formulations step) — a genuine improvement over a single
        facility-wide list, since it stays accurate as formulations change.
      </RegulatoryNote>
      <TemplateDocsEditor available={AVAILABLE} generated={generated} onGenerate={generate} onSave={save} onDelete={remove} />
    </div>
  );
}
