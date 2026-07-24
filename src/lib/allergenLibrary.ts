/**
 * Priority allergen checklist covering the union of both jurisdictions'
 * lists, used to (a) suggest values for Ingredient.allergenType in the
 * Formulations wizard step, and (b) drive the per-product allergen
 * declaration inside the allergen-control SOP (src/lib/sopTemplates.ts).
 *
 * Jurisdiction tags:
 *  - "BOTH": a priority allergen under both FDA (FASTER Act / FALCPA, the
 *    "Big 9") and CFIA (Food and Drug Regulations priority allergen list).
 *  - "CA_ONLY": additional items CFIA requires to be declared (priority
 *    allergens, gluten sources beyond wheat, and added sulphites at or
 *    above 10 ppm) that are not part of the US "Big 9".
 */

export type AllergenJurisdiction = "BOTH" | "CA_ONLY";

export interface AllergenListItem {
  key: string;
  label: string;
  jurisdiction: AllergenJurisdiction;
  note?: string;
}

export const ALLERGEN_CHECKLIST: AllergenListItem[] = [
  { key: "milk", label: "Milk", jurisdiction: "BOTH" },
  { key: "eggs", label: "Eggs", jurisdiction: "BOTH" },
  { key: "fish", label: "Fish", jurisdiction: "BOTH" },
  { key: "crustacean_shellfish", label: "Crustacean shellfish", jurisdiction: "BOTH" },
  { key: "tree_nuts", label: "Tree nuts", jurisdiction: "BOTH" },
  { key: "peanuts", label: "Peanuts", jurisdiction: "BOTH" },
  { key: "wheat", label: "Wheat", jurisdiction: "BOTH" },
  { key: "soybeans", label: "Soybeans (soy)", jurisdiction: "BOTH" },
  { key: "sesame", label: "Sesame", jurisdiction: "BOTH", note: "US: FASTER Act priority allergen since 2023. Canada: CFIA priority allergen." },
  { key: "mustard", label: "Mustard", jurisdiction: "CA_ONLY", note: "CFIA priority allergen — not one of the US 'Big 9'." },
  { key: "gluten_barley", label: "Barley (gluten source)", jurisdiction: "CA_ONLY", note: "CFIA-regulated gluten source beyond wheat." },
  { key: "gluten_rye", label: "Rye (gluten source)", jurisdiction: "CA_ONLY", note: "CFIA-regulated gluten source beyond wheat." },
  { key: "gluten_oats", label: "Oats (gluten source)", jurisdiction: "CA_ONLY", note: "CFIA-regulated gluten source beyond wheat." },
  { key: "gluten_triticale", label: "Triticale (gluten source)", jurisdiction: "CA_ONLY", note: "CFIA-regulated gluten source beyond wheat." },
  { key: "sulphites", label: "Added sulphites (≥10 ppm)", jurisdiction: "CA_ONLY", note: "CFIA requires declaration when added sulphites are present at or above 10 ppm." },
];

export function allergenLabel(key: string): string {
  return ALLERGEN_CHECKLIST.find((a) => a.key === key)?.label ?? key;
}
