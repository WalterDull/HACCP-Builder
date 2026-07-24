"use client";

import { useState } from "react";

export interface TemplateDoc {
  key: string;
  title: string;
}

export interface GeneratedSop {
  id: string;
  templateKey: string;
  title: string;
  content: string;
}

/**
 * Shared generate/edit UI for a category of SOP templates (GMP, Recall,
 * or SOPs wizard steps). `onGenerate` posts to the plan's sops endpoint to
 * render + save a template; `onSave` persists edits to already-generated
 * content.
 */
export default function TemplateDocsEditor({
  available,
  generated,
  onGenerate,
  onSave,
  onDelete,
}: {
  available: TemplateDoc[];
  generated: GeneratedSop[];
  onGenerate: (key: string) => Promise<void>;
  onSave: (sopId: string, content: string) => Promise<void>;
  onDelete: (sopId: string) => Promise<void>;
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const generatedKeys = new Set(generated.map((g) => g.templateKey));
  const notYetGenerated = available.filter((t) => !generatedKeys.has(t.key));

  return (
    <div className="space-y-6">
      {notYetGenerated.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Generate a document</h3>
          <div className="flex flex-wrap gap-2">
            {notYetGenerated.map((t) => (
              <button
                key={t.key}
                disabled={busyKey === t.key}
                onClick={async () => {
                  setBusyKey(t.key);
                  await onGenerate(t.key);
                  setBusyKey(null);
                }}
                className="rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
              >
                {busyKey === t.key ? "Generating…" : `+ ${t.title}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {generated.map((sop) => {
        const draft = drafts[sop.id] ?? sop.content;
        return (
          <div key={sop.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{sop.title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onSave(sop.id, draft)}
                  className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Save edits
                </button>
                <button
                  onClick={() => onDelete(sop.id)}
                  className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDrafts((d) => ({ ...d, [sop.id]: e.target.value }))}
              rows={14}
              className="w-full rounded-md border border-slate-200 p-3 font-mono text-xs text-slate-700"
            />
          </div>
        );
      })}

      {generated.length === 0 && notYetGenerated.length === 0 && (
        <p className="text-sm text-slate-500">No documents available in this category yet.</p>
      )}
    </div>
  );
}
