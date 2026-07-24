"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { slug: "facility", label: "1. Facility Profile" },
  { slug: "haccp-team", label: "2. HACCP Team (Prelim. 1)" },
  { slug: "gmp", label: "3. GMPs & Prerequisites" },
  { slug: "vendors", label: "4. Vendors / Suppliers" },
  { slug: "products", label: "5. Products (Prelim. 2 & 3)" },
  { slug: "process-flow", label: "6. Process Flow (Prelim. 4 & 5)" },
  { slug: "formulations", label: "7. Formulations" },
  { slug: "hazard-analysis", label: "8. Hazard Analysis (Principle 1)" },
  { slug: "ccp-determination", label: "9. CCP Determination (Principle 2)" },
  { slug: "preventive-controls", label: "10. Preventive Controls (3-7)" },
  { slug: "recall", label: "11. Recall Plan" },
  { slug: "sops", label: "12. SOPs" },
  { slug: "review-export", label: "13. Review & Export" },
];

export default function WizardNav({ planId }: { planId: string }) {
  const pathname = usePathname();

  return (
    <nav className="w-full shrink-0 sm:w-64">
      <ul className="space-y-1">
        {STEPS.map((step) => {
          const href = `/plans/${planId}/${step.slug}`;
          const active = pathname === href;
          return (
            <li key={step.slug}>
              <Link
                href={href}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {step.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/dashboard" className="mt-4 block text-xs text-slate-400 hover:text-slate-600">
        ← Back to dashboard
      </Link>
    </nav>
  );
}
