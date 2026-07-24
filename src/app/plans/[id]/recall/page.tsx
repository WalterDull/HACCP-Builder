"use client";

import { useEffect, useState } from "react";
import type { RecallContactData, MockRecallRecordData } from "@/types";
import { SUGGESTED_RECALL_ROLES } from "@/types";
import TemplateDocsEditor, { type GeneratedSop } from "@/components/TemplateDocsEditor";
import { SOP_TEMPLATES } from "@/lib/sopTemplates";
import GuidancePanel from "@/components/GuidancePanel";

const AVAILABLE = SOP_TEMPLATES.filter((t) => t.category === "recall").map((t) => ({ key: t.key, title: t.title }));

export default function RecallPage({ params }: { params: { id: string } }) {
  const [contacts, setContacts] = useState<RecallContactData[]>([]);
  const [records, setRecords] = useState<MockRecallRecordData[]>([]);
  const [generated, setGenerated] = useState<GeneratedSop[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRecord, setNewRecord] = useState({ performedAt: "", performedBy: "", percentTraced: "", resultsSummary: "" });

  async function load() {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setContacts(plan.recallContacts ?? []);
    setRecords(plan.mockRecallRecords ?? []);
    setGenerated((plan.sops ?? []).filter((s: GeneratedSop) => AVAILABLE.some((a) => a.key === s.templateKey)));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function addContact() {
    await fetch(`/api/plans/${params.id}/recall-contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "Recall Coordinator", name: "New contact" }),
    });
    load();
  }

  async function updateContact(id: string, patch: Partial<RecallContactData>) {
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    await fetch(`/api/plans/${params.id}/recall-contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function removeContact(id: string) {
    await fetch(`/api/plans/${params.id}/recall-contacts/${id}`, { method: "DELETE" });
    load();
  }

  async function addRecord() {
    await fetch(`/api/plans/${params.id}/mock-recalls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord),
    });
    setNewRecord({ performedAt: "", performedBy: "", percentTraced: "", resultsSummary: "" });
    load();
  }

  async function removeRecord(id: string) {
    await fetch(`/api/plans/${params.id}/mock-recalls/${id}`, { method: "DELETE" });
    load();
  }

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

  const mostRecent = [...records].sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0];
  const overdue = !mostRecent || new Date(mostRecent.performedAt).getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Recall Plan</h1>
      <p className="mt-1 text-sm text-slate-600">
        Assign a recall team, log mock recalls, and generate the written Recall Plan document.
      </p>

      {overdue && (
        <GuidancePanel title="Mock recall overdue or missing">
          Both FDA/USDA FSIS and CFIA expect at least one mock recall annually to verify
          traceability. Log one below.
        </GuidancePanel>
      )}

      <h2 className="mt-6 text-sm font-semibold text-slate-800">Recall Team</h2>
      <p className="text-xs text-slate-500 mb-2">Suggested roles: {SUGGESTED_RECALL_ROLES.join(" · ")}</p>
      <div className="space-y-3">
        {contacts.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                defaultValue={c.role}
                onBlur={(e) => updateContact(c.id, { role: e.target.value })}
                placeholder="Role"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                defaultValue={c.name}
                onBlur={(e) => updateContact(c.id, { name: e.target.value })}
                placeholder="Name"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                defaultValue={c.phone ?? ""}
                onBlur={(e) => updateContact(c.id, { phone: e.target.value })}
                placeholder="Phone"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                defaultValue={c.email ?? ""}
                onBlur={(e) => updateContact(c.id, { email: e.target.value })}
                placeholder="Email"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <button onClick={() => removeContact(c.id)} className="mt-2 text-xs font-medium text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addContact}
          className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          + Add recall team member
        </button>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-800">Mock Recall Log</h2>
      <div className="mt-2 space-y-2">
        {records.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 text-sm">
            <span>
              {new Date(r.performedAt).toLocaleDateString()} — {r.performedBy ?? "—"}, traced {r.percentTraced ?? "—"}.{" "}
              {r.resultsSummary}
            </span>
            <button onClick={() => removeRecord(r.id)} className="text-xs font-medium text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-4">
        <input
          type="date"
          value={newRecord.performedAt}
          onChange={(e) => setNewRecord((r) => ({ ...r, performedAt: e.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
        <input
          value={newRecord.performedBy}
          onChange={(e) => setNewRecord((r) => ({ ...r, performedBy: e.target.value }))}
          placeholder="Performed by"
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
        <input
          value={newRecord.percentTraced}
          onChange={(e) => setNewRecord((r) => ({ ...r, percentTraced: e.target.value }))}
          placeholder="% traced"
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
        <input
          value={newRecord.resultsSummary}
          onChange={(e) => setNewRecord((r) => ({ ...r, resultsSummary: e.target.value }))}
          placeholder="Results summary"
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      <button
        onClick={addRecord}
        className="mt-2 rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        + Log mock recall
      </button>

      <h2 className="mt-8 text-sm font-semibold text-slate-800">Recall Plan Document</h2>
      <div className="mt-2">
        <TemplateDocsEditor available={AVAILABLE} generated={generated} onGenerate={generate} onSave={save} onDelete={remove} />
      </div>
    </div>
  );
}
