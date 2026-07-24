"use client";

import { useEffect, useState } from "react";
import type { VendorData } from "@/types";
import { VENDOR_STATUSES } from "@/types";

export default function VendorsPage({ params }: { params: { id: string } }) {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setVendors(plan.vendors ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function addVendor() {
    await fetch(`/api/plans/${params.id}/vendors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New vendor" }),
    });
    load();
  }

  async function updateVendor(vendorId: string, patch: Partial<VendorData>) {
    setVendors((vs) => vs.map((v) => (v.id === vendorId ? { ...v, ...patch } : v)));
    await fetch(`/api/plans/${params.id}/vendors/${vendorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function removeVendor(vendorId: string) {
    await fetch(`/api/plans/${params.id}/vendors/${vendorId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Vendors / Approved Suppliers</h1>
      <p className="mt-1 text-sm text-slate-600">
        Facility-wide, shared across all products. Populates the vendor-qualification and
        supplier-verification SOPs, and can be linked from a product&apos;s Formulation entries.
      </p>

      <div className="mt-4 space-y-4">
        {vendors.map((v) => (
          <div key={v.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={v.name}
                onChange={(e) => updateVendor(v.id, { name: e.target.value })}
                placeholder="Vendor name"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={v.materialsSupplied ?? ""}
                onChange={(e) => updateVendor(v.id, { materialsSupplied: e.target.value })}
                placeholder="Materials supplied"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={v.contactName ?? ""}
                onChange={(e) => updateVendor(v.id, { contactName: e.target.value })}
                placeholder="Contact name"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={v.phone ?? ""}
                onChange={(e) => updateVendor(v.id, { phone: e.target.value })}
                placeholder="Phone"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={v.email ?? ""}
                onChange={(e) => updateVendor(v.id, { email: e.target.value })}
                placeholder="Email"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={v.certification ?? ""}
                onChange={(e) => updateVendor(v.id, { certification: e.target.value })}
                placeholder="Certification (e.g. SQF, BRCGS)"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={v.status}
                onChange={(e) => updateVendor(v.id, { status: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {VENDOR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={v.guaranteeOnFile}
                  onChange={(e) => updateVendor(v.id, { guaranteeOnFile: e.target.checked })}
                />
                Letter of guarantee on file
              </label>
            </div>
            <button onClick={() => removeVendor(v.id)} className="mt-3 text-xs font-medium text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addVendor}
          className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          + Add vendor
        </button>
      </div>
    </div>
  );
}
