export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-slate-400">
        <p>
          HACCP-Builder assists with drafting a HACCP plan aligned with the Codex Alimentarius /
          NACMCF structure. It does not replace review and sign-off by the individual(s)
          responsible for food safety at your facility, and does not itself constitute FDA, USDA
          FSIS, or CFIA approval of your plan.
        </p>
        <p className="mt-2">&copy; {new Date().getFullYear()} HACCP-Builder.</p>
      </div>
    </footer>
  );
}
