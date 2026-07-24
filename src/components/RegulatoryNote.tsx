/**
 * Reusable inline citation callout, used across wizard steps to surface the
 * US/Canada regulatory framing without branching app logic per sector — see
 * the README "Regulatory framing" section.
 */
export default function RegulatoryNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <span className="font-semibold text-slate-700">Regulatory basis: </span>
      {children}
    </div>
  );
}
