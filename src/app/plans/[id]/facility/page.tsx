"use client";

import { useEffect, useState } from "react";
import { EMPTY_FACILITY_PROFILE, REGULATORY_SCOPE_OPTIONS, type FacilityProfile } from "@/types";
import GuidancePanel from "@/components/GuidancePanel";

export default function FacilityProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<FacilityProfile>(EMPTY_FACILITY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/plans/${params.id}`)
      .then((r) => r.json())
      .then((plan) => {
        if (plan.facilityProfile) setProfile({ ...EMPTY_FACILITY_PROFILE, ...plan.facilityProfile });
        setLoading(false);
      });
  }, [params.id]);

  function set<K extends keyof FacilityProfile>(key: K, value: FacilityProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function toggleScope(value: string) {
    setProfile((p) => {
      const has = p.regulatoryScopes.includes(value);
      return { ...p, regulatoryScopes: has ? p.regulatoryScopes.filter((v) => v !== value) : [...p.regulatoryScopes, value] };
    });
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/plans/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facilityProfile: profile }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  const scopesIncludeSector =
    profile.regulatoryScopes.includes("FDA_SEAFOOD") ||
    profile.regulatoryScopes.includes("FDA_JUICE") ||
    profile.regulatoryScopes.includes("USDA_FSIS");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Facility Profile</h1>
      <p className="mt-1 text-sm text-slate-600">
        Shared across every product on this plan. Select every regulatory scope that applies —
        many facilities sell into both the US and Canada.
      </p>

      <GuidancePanel title="Why this matters">
        This HACCP plan follows the Codex/NACMCF structure common to every regime below. If you
        process seafood, juice, or meat/poultry, your plan must additionally satisfy that
        sector&apos;s specific regulation (21 CFR 123, 21 CFR 120, or 9 CFR 417) on top of the
        general structure used throughout this wizard.
      </GuidancePanel>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Facility name</label>
          <input
            value={profile.facilityName}
            onChange={(e) => set("facilityName", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Address</label>
          <input
            value={profile.address}
            onChange={(e) => set("address", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Food categories produced</label>
          <input
            value={profile.foodCategories}
            onChange={(e) => set("foodCategories", e.target.value)}
            placeholder="e.g. ready-to-eat baked goods, shelf-stable sauces"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Regulatory scope(s)</label>
          <div className="mt-2 space-y-2">
            {REGULATORY_SCOPE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={profile.regulatoryScopes.includes(opt.value)}
                  onChange={() => toggleScope(opt.value)}
                  className="mt-0.5"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {scopesIncludeSector && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              You&apos;ve selected a sector with its own dedicated HACCP regulation. This wizard
              covers the general Codex/NACMCF structure that regulation is built on — confirm your
              finished plan also satisfies that regulation&apos;s sector-specific requirements.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">CFIA licence number (if applicable)</label>
            <input
              value={profile.cfiaLicenseNumber}
              onChange={(e) => set("cfiaLicenseNumber", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">FDA registration number (if applicable)</label>
            <input
              value={profile.fdaRegistrationNumber}
              onChange={(e) => set("fdaRegistrationNumber", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Responsible individual / HACCP team leader</label>
            <input
              value={profile.responsibleIndividual}
              onChange={(e) => set("responsibleIndividual", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Their contact info</label>
            <input
              value={profile.responsibleIndividualContact}
              onChange={(e) => set("responsibleIndividualContact", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {savedAt && <span className="ml-3 text-xs text-slate-500">Saved.</span>}
      </div>
    </div>
  );
}
