"use client";

import { useEffect, useState } from "react";
import TemplateDocsEditor, { type GeneratedSop } from "@/components/TemplateDocsEditor";
import { SOP_TEMPLATES } from "@/lib/sopTemplates";
import RegulatoryNote from "@/components/RegulatoryNote";

const AVAILABLE = SOP_TEMPLATES.filter((t) => t.category === "gmp").map((t) => ({ key: t.key, title: t.title }));

export default function GmpPage({ params }: { params: { id: string } }) {
  const [generated, setGenerated] = useState<GeneratedSop[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    const sops = (plan.sops ?? []).filter((s: GeneratedSop) => AVAILABLE.some((a) => a.key === s.templateKey));
    setGenerated(sops);
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
      <h1 className="text-2xl font-bold text-slate-900">GMPs & Prerequisite Programs</h1>
      <p className="mt-1 text-sm text-slate-600">
        Generate starter documents, then edit them to match your facility before finalizing.
      </p>
      <RegulatoryNote>
        US — 21 CFR Part 117 Subpart B (Current Good Manufacturing Practice). Canada — CFIA
        prerequisite program guidance under the SFCR. Both regimes expect the same underlying
        practices.
      </RegulatoryNote>
      <TemplateDocsEditor available={AVAILABLE} generated={generated} onGenerate={generate} onSave={save} onDelete={remove} />
    </div>
  );
}
