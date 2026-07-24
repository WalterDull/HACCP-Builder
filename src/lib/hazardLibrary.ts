/**
 * Starter hazard suggestions keyed by common process-step names, to give
 * first-time users a running start on hazard analysis (Principle 1). This
 * is a seed list, not a substitute for a facility-specific hazard
 * analysis — the UI always lets users edit, remove, or add hazards freely.
 *
 * Also includes formulation-driven suggestions: an ingredient flagged as
 * an allergen on the Formulations step suggests an allergen cross-contact
 * hazard at the process steps where cross-contact risk is highest
 * (receiving, mixing/formulation, packaging, and allergen changeover/
 * rework) — a HACCP-Builder addition with no equivalent in the reference
 * app, since ingredient-level formulation data doesn't exist there.
 */

export type HazardTypeKey = "BIOLOGICAL" | "CHEMICAL" | "PHYSICAL" | "RADIOLOGICAL";

export interface HazardSuggestion {
  type: HazardTypeKey;
  description: string;
}

export const COMMON_STEP_NAMES = [
  "Receiving",
  "Storage (Refrigerated)",
  "Storage (Frozen)",
  "Storage (Dry)",
  "Washing/Rinsing",
  "Cutting/Slicing",
  "Mixing/Formulation",
  "Cooking/Thermal Processing",
  "Cooling",
  "Packaging",
  "Labeling",
  "Metal Detection/X-ray",
  "Sifting",
  "Dehydration/Drying",
  "Chopping",
  "High-Speed Cutting",
  "Forming",
  "Filling",
  "Stuffing",
  "Deep Frying",
  "Steaming",
  "Smoking",
  "Curing",
  "Extraction",
  "Freezer Storage",
  "Allergen Changeover/Rework",
  "Shipping",
] as const;

const LIBRARY: Record<string, HazardSuggestion[]> = {
  Receiving: [
    { type: "BIOLOGICAL", description: "Pathogen contamination from incoming raw materials" },
    { type: "CHEMICAL", description: "Undeclared allergens from mislabeled or cross-contaminated ingredients" },
    { type: "CHEMICAL", description: "Pesticide or veterinary drug residues exceeding limits" },
    { type: "PHYSICAL", description: "Foreign material (glass, metal, plastic) in incoming ingredients" },
  ],
  "Storage (Refrigerated)": [
    { type: "BIOLOGICAL", description: "Pathogen growth or toxin formation due to temperature abuse" },
  ],
  "Storage (Frozen)": [
    { type: "BIOLOGICAL", description: "Pathogen survival/growth from inadequate freezer temperature control" },
  ],
  "Storage (Dry)": [
    { type: "BIOLOGICAL", description: "Mold growth from moisture exposure" },
    { type: "PHYSICAL", description: "Pest contamination in dry storage" },
  ],
  "Washing/Rinsing": [
    { type: "BIOLOGICAL", description: "Cross-contamination from wash water or shared equipment" },
    { type: "CHEMICAL", description: "Sanitizer residue exceeding safe levels" },
  ],
  "Cutting/Slicing": [
    { type: "BIOLOGICAL", description: "Cross-contamination from equipment or personnel" },
    { type: "PHYSICAL", description: "Metal fragments from blades or worn equipment" },
  ],
  "Mixing/Formulation": [
    { type: "CHEMICAL", description: "Incorrect allergen or additive formulation" },
    { type: "CHEMICAL", description: "Over-use of a chemical preservative/additive" },
  ],
  "Cooking/Thermal Processing": [
    { type: "BIOLOGICAL", description: "Survival of pathogens due to insufficient time/temperature" },
  ],
  Cooling: [
    { type: "BIOLOGICAL", description: "Spore-forming pathogen growth (e.g., C. perfringens, B. cereus) from slow cooling" },
  ],
  Packaging: [
    { type: "BIOLOGICAL", description: "Post-process contamination from packaging materials or environment" },
    { type: "CHEMICAL", description: "Undeclared allergen from incorrect packaging/labeling match-up" },
  ],
  Labeling: [{ type: "CHEMICAL", description: "Missing or incorrect allergen declaration on label" }],
  "Metal Detection/X-ray": [
    { type: "PHYSICAL", description: "Metal or dense foreign material not detected due to equipment malfunction" },
  ],
  Sifting: [{ type: "PHYSICAL", description: "Foreign material not removed due to torn or incorrect mesh size" }],
  "Dehydration/Drying": [
    { type: "BIOLOGICAL", description: "Pathogen survival due to insufficient water activity (Aw) reduction" },
  ],
  Chopping: [
    { type: "BIOLOGICAL", description: "Cross-contamination from equipment or personnel" },
    { type: "PHYSICAL", description: "Metal fragments from blades or worn equipment" },
  ],
  "High-Speed Cutting": [
    { type: "PHYSICAL", description: "Metal fragments from blade wear or breakage at high speed" },
    { type: "BIOLOGICAL", description: "Cross-contamination from equipment or personnel" },
  ],
  Forming: [{ type: "PHYSICAL", description: "Foreign material introduced from forming equipment or moulds" }],
  Filling: [
    { type: "BIOLOGICAL", description: "Post-process contamination from filler or environment" },
    { type: "PHYSICAL", description: "Foreign material from filling equipment" },
  ],
  Stuffing: [
    { type: "BIOLOGICAL", description: "Cross-contamination from casings, equipment, or personnel" },
    { type: "PHYSICAL", description: "Casing or equipment fragments in product" },
  ],
  "Deep Frying": [
    { type: "BIOLOGICAL", description: "Survival of pathogens due to insufficient oil temperature or time" },
    { type: "CHEMICAL", description: "Acrylamide formation / oil breakdown products from over-heated or degraded oil" },
  ],
  Steaming: [{ type: "BIOLOGICAL", description: "Survival of pathogens due to insufficient steam time/temperature" }],
  Smoking: [
    { type: "BIOLOGICAL", description: "Survival or growth of pathogens (e.g. C. botulinum, L. monocytogenes) due to inadequate time/temperature or Aw" },
    { type: "CHEMICAL", description: "Polycyclic aromatic hydrocarbon (PAH) deposition from smoke" },
  ],
  Curing: [
    { type: "BIOLOGICAL", description: "Growth or toxin formation by C. botulinum due to inadequate curing salt or process control" },
    { type: "CHEMICAL", description: "Over-application of nitrite/nitrate exceeding regulated limits" },
  ],
  Extraction: [
    { type: "CHEMICAL", description: "Residual extraction solvent above acceptable limits" },
    { type: "BIOLOGICAL", description: "Contamination from extraction equipment or process water" },
  ],
  "Freezer Storage": [
    { type: "BIOLOGICAL", description: "Pathogen survival/growth from inadequate freezer temperature control" },
  ],
  "Allergen Changeover/Rework": [
    { type: "CHEMICAL", description: "Cross-contact with an undeclared allergen from inadequate changeover cleaning or rework handling" },
  ],
  Shipping: [{ type: "BIOLOGICAL", description: "Temperature abuse during transport" }],
};

export function suggestHazardsForStep(stepName: string): HazardSuggestion[] {
  return LIBRARY[stepName] ?? [];
}

/** Process steps where allergen cross-contact risk from a formulation
 *  ingredient is highest — used to drive per-ingredient hazard suggestions. */
export const ALLERGEN_RISK_STEP_NAMES = ["Receiving", "Mixing/Formulation", "Packaging", "Allergen Changeover/Rework"];

export interface AllergenIngredientLike {
  name: string;
  isAllergen: boolean;
  allergenType?: string | null;
}

/** Given a process step name and the product's ingredient list, returns
 *  suggested allergen cross-contact hazards for that step (empty if the
 *  step isn't one of the elevated-risk steps, or no allergen ingredients
 *  are on file yet). */
export function suggestAllergenHazardsForStep(
  stepName: string,
  ingredients: AllergenIngredientLike[]
): HazardSuggestion[] {
  if (!ALLERGEN_RISK_STEP_NAMES.includes(stepName)) return [];
  return ingredients
    .filter((i) => i.isAllergen)
    .map((i) => ({
      type: "CHEMICAL" as const,
      description: `Allergen cross-contact: ${i.allergenType || i.name} (from ingredient "${i.name}")`,
    }));
}
