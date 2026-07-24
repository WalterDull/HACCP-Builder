import Link from "next/link";

const steps = [
  { title: "Facility Profile", desc: "Tell us about your facility and which US and/or Canadian regulatory regime(s) apply." },
  { title: "HACCP Team", desc: "Preliminary Step 1 — assemble the multidisciplinary team responsible for the plan." },
  { title: "GMPs & Prerequisites", desc: "US 21 CFR Part 117 Subpart B and CFIA prerequisite programs — hygiene, sanitation, pest control, training, and more." },
  { title: "Vendors / Suppliers", desc: "Build your approved supplier list, letters of guarantee, and certifications." },
  { title: "Products", desc: "Preliminary Steps 2 & 3 — describe each product, its distribution, intended use, and consumers." },
  { title: "Process Flow", desc: "Preliminary Steps 4 & 5 — map the flow diagram and confirm it on-site." },
  { title: "Formulations", desc: "Ingredient-level detail with US/Canada allergen flagging, tied to your approved supplier list." },
  { title: "Hazard Analysis", desc: "Principle 1 — biological, chemical, physical, and radiological hazards at each step, with seeded and allergen-driven suggestions." },
  { title: "CCP Determination", desc: "Principle 2 — the Codex four-question decision tree, re-evaluated server-side on every answer." },
  { title: "Preventive Controls", desc: "Principles 3-7 — critical limits, monitoring, corrective action, verification, recordkeeping." },
  { title: "Recall Plan", desc: "Assign recall team roles and contacts, and track your annual mock recall." },
  { title: "SOPs", desc: "Per-product allergen declarations, supplier verification, HACCP plan validation & reassessment, and more." },
  { title: "Review & Export", desc: "Download a formatted, audit-ready HACCP Plan as a Word document." },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          HACCP-Builder — for US and Canadian food facility operators
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Build a formal HACCP plan, one guided step at a time
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          A wizard built on the Codex Alimentarius / NACMCF HACCP structure — 5 Preliminary Steps
          and 7 Principles — the same backbone required for FDA seafood (21 CFR 123), FDA juice
          (21 CFR 120), USDA FSIS meat/poultry (9 CFR 417) HACCP, satisfies FDA&apos;s FSMA
          Hazard Analysis &amp; Risk-Based Preventive Controls rule (21 CFR Part 117, &quot;HARPC&quot;)
          for general manufactured food, and aligns with CFIA&apos;s preventive control
          requirements under the Safe Food for Canadians Regulations (SFCR). Make more than one
          product? Add each one and get its own process flow, formulation, and hazard analysis.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-brand-700"
          >
            Start your plan
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            See pricing
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {i + 1}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-16 text-center text-xs text-slate-400">
        This tool assists with drafting a HACCP plan and does not replace review by a qualified
        individual responsible for food safety at your facility, a food safety consultant, or
        FDA/USDA FSIS/CFIA where applicable.
      </p>
    </main>
  );
}
