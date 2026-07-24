import Link from "next/link";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Simple, plan-based pricing</h1>
      <p className="mt-3 text-slate-600">
        Build and edit as many HACCP plans as you want for free. Pay once per plan to unlock the
        formatted Word export. Add an optional storage subscription to keep every plan available
        indefinitely instead of the default retention window.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Plan unlock</h2>
          <p className="mt-1 text-3xl font-bold text-slate-900">One-time fee</p>
          <p className="mt-2 text-sm text-slate-600">
            Unlocks the audit-ready .docx export for a single HACCP plan. Editing is free and
            unlimited before and after unlock.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Storage subscription</h2>
          <p className="mt-1 text-3xl font-bold text-slate-900">Recurring, optional</p>
          <p className="mt-2 text-sm text-slate-600">
            Keeps all of your plans stored indefinitely instead of expiring after the default
            retention window. Cancel anytime — plans revert to the standard retention window.
          </p>
        </div>
      </div>

      <p className="mt-10 text-sm text-slate-500">
        Billing runs through Stripe. Until real billing is configured on a given deployment, a
        dev-mode &quot;Simulate unlock&quot; option is available so the whole wizard — including
        export — is testable end-to-end without live payment credentials.
      </p>

      <div className="mt-10">
        <Link href="/register" className="rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          Start your plan
        </Link>
      </div>
    </main>
  );
}
