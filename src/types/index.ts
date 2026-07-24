// Facility-wide profile — shared across every product on the plan.
// Per-product details (description, intended use/consumer, packaging,
// shelf life) live on the Product model instead, since a plan can cover
// multiple products.
export interface FacilityProfile {
  facilityName: string;
  address: string;
  // General summary of what's produced at this facility (e.g. "ready-to-eat
  // baked goods, shelf-stable sauces"). Product-specific detail lives per product.
  foodCategories: string;
  // Which US/Canadian regulatory regime(s) this facility operates under.
  // Multiple can apply (e.g. a facility selling into both countries).
  // "FDA_HARPC": general US manufactured food facility under FSMA's Hazard
  //   Analysis & Risk-Based Preventive Controls rule (21 CFR Part 117
  //   Subpart C).
  // "FDA_SEAFOOD": subject to FDA seafood HACCP (21 CFR 123).
  // "FDA_JUICE": subject to FDA juice HACCP (21 CFR 120).
  // "USDA_FSIS": subject to USDA FSIS meat/poultry HACCP (9 CFR 417).
  // "CFIA_SFCR": federally licensed under Canada's Safe Food for Canadians
  //   Regulations (SFCR).
  // "CA_PROVINCIAL": intra-provincial only, regulated by a Canadian
  //   provincial/municipal authority instead of CFIA.
  // "OTHER": any other jurisdiction.
  regulatoryScopes: string[];
  // CFIA licence number, if federally licensed under the SFCR (blank otherwise).
  cfiaLicenseNumber: string;
  // FDA facility registration number, if applicable (blank otherwise).
  fdaRegistrationNumber: string;
  responsibleIndividual: string;
  responsibleIndividualContact: string;
}

export const REGULATORY_SCOPE_OPTIONS: { value: string; label: string }[] = [
  { value: "FDA_HARPC", label: "US — general manufactured food facility (FSMA HARPC, 21 CFR Part 117 Subpart C)" },
  { value: "FDA_SEAFOOD", label: "US — seafood HACCP (21 CFR 123)" },
  { value: "FDA_JUICE", label: "US — juice HACCP (21 CFR 120)" },
  { value: "USDA_FSIS", label: "US — meat/poultry HACCP (USDA FSIS, 9 CFR 417)" },
  { value: "CFIA_SFCR", label: "Canada — federally licensed under the Safe Food for Canadians Regulations (SFCR)" },
  { value: "CA_PROVINCIAL", label: "Canada — provincial/municipal only (intra-provincial sales)" },
  { value: "OTHER", label: "Other / not sure yet" },
];

export const EMPTY_FACILITY_PROFILE: FacilityProfile = {
  facilityName: "",
  address: "",
  foodCategories: "",
  regulatoryScopes: ["FDA_HARPC"],
  cfiaLicenseNumber: "",
  fdaRegistrationNumber: "",
  responsibleIndividual: "",
  responsibleIndividualContact: "",
};

export interface ProductSummary {
  id: string;
  name: string;
}

export interface RecallContactData {
  id: string;
  role: string;
  name: string;
  phone: string | null;
  email: string | null;
  order: number;
}

export interface MockRecallRecordData {
  id: string;
  performedAt: string;
  performedBy: string | null;
  percentTraced: string | null;
  resultsSummary: string | null;
}

export interface VendorData {
  id: string;
  name: string;
  materialsSupplied: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  certification: string | null;
  status: string;
  guaranteeOnFile: boolean;
  guaranteeExpiry: string | null;
  approvalDate: string | null;
  notes: string | null;
  order: number;
}

export const VENDOR_STATUSES = ["APPROVED", "PENDING", "SUSPENDED"] as const;

export const SUGGESTED_RECALL_ROLES = [
  "Recall Coordinator",
  "Alternate Recall Coordinator",
  "Quality / Food Safety Lead",
  "Operations Lead",
  "Communications Lead",
  "Logistics / Distribution Lead",
  "Legal Counsel",
];

export const SUGGESTED_HACCP_TEAM_ROLES = [
  "HACCP Team Leader",
  "Quality Assurance / Food Safety",
  "Production / Operations",
  "Engineering / Maintenance",
  "Microbiology / Technical",
  "Sanitation",
  "Purchasing / Supply Chain",
  "External HACCP Consultant",
];

export interface HaccpTeamMemberData {
  id: string;
  name: string;
  role: string | null;
  expertise: string | null;
  responsibilities: string | null;
  order: number;
}

export interface IngredientData {
  id: string;
  name: string;
  percentageOfFormulation: string | null;
  functionalRole: string | null;
  supplierVendorId: string | null;
  countryOfOrigin: string | null;
  isAllergen: boolean;
  allergenType: string | null;
  notes: string | null;
  order: number;
}

/** Per-product formulation summary passed into SOP rendering for the
 *  per-product allergen declaration. */
export interface ProductFormulationSummary {
  productId: string;
  productName: string;
  ingredients: IngredientData[];
}
