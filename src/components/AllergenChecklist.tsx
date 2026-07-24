"use client";

import { ALLERGEN_CHECKLIST } from "@/lib/allergenLibrary";

/**
 * UI-suggested allergen checklist covering the union of US and Canadian
 * priority allergen lists (see src/lib/allergenLibrary.ts). Clicking an item
 * appends it to the free-text allergenType field, since the underlying
 * Ingredient.allergenType column stays free text (a facility may need to
 * describe something the checklist doesn't cover, e.g. a specific tree nut).
 */
export default function AllergenChecklist({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = new Set(
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  function toggle(label: string) {
    const next = new Set(selected);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    onChange(Array.from(next).join(", "));
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-600">
        Priority allergen checklist (click to add/remove — free text field, so you can add anything not listed)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ALLERGEN_CHECKLIST.map((a) => (
          <button
            key={a.key}
            type="button"
            title={a.note}
            onClick={() => toggle(a.label)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              selected.has(a.label)
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {a.label}
            {a.jurisdiction === "CA_ONLY" && <span className="ml-1 text-[10px] opacity-70">(CA)</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
