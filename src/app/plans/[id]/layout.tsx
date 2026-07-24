import WizardNav from "@/components/WizardNav";

export default function PlanWizardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:flex-row">
      <WizardNav planId={params.id} />
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}
