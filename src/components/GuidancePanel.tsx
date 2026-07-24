export default function GuidancePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-lg border border-brand-100 bg-brand-50 p-4">
      <h3 className="text-sm font-semibold text-brand-700">{title}</h3>
      <div className="mt-1 text-sm text-brand-900">{children}</div>
    </div>
  );
}
