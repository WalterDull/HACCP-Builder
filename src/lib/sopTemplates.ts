import type {
  FacilityProfile,
  RecallContactData,
  MockRecallRecordData,
  ProductSummary,
  VendorData,
  HaccpTeamMemberData,
  ProductFormulationSummary,
} from "@/types";

export interface SopRenderContext {
  facility: FacilityProfile;
  products?: ProductSummary[];
  recallContacts?: RecallContactData[];
  mockRecalls?: MockRecallRecordData[];
  vendors?: VendorData[];
  haccpTeam?: HaccpTeamMemberData[];
  /** Per-product ingredient/allergen data — drives the per-product allergen
   *  declaration in the allergen-control SOP. This is a genuine improvement
   *  over the reference app, whose allergen-control document is facility-wide
   *  only; here each product gets its own declaration built from real
   *  ingredient data instead of a manually-filled-in blank list. */
  productFormulations?: ProductFormulationSummary[];
}

function fallback(value: string | undefined | null, placeholder: string) {
  return value && value.trim().length > 0 ? value : placeholder;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US");
}

function productListText(products: ProductSummary[] | undefined, facility: FacilityProfile): string {
  if (products && products.length > 0) return products.map((p) => p.name).join(", ");
  return fallback(facility.foodCategories, "[product categories]");
}

function approvedSupplierTable(vendors: VendorData[] | undefined): string {
  if (!vendors || vendors.length === 0) {
    return "[No vendors added yet — add them on the Vendors / Suppliers step and regenerate this document.]";
  }
  const header =
    "| Vendor | Materials supplied | Status | Certification | Guarantee on file | Contact |\n| --- | --- | --- | --- | --- | --- |";
  const rows = vendors
    .map((v) => {
      const contact = [v.contactName, v.phone, v.email].filter(Boolean).join(", ") || "—";
      return `| ${v.name || "—"} | ${v.materialsSupplied || "—"} | ${v.status || "—"} | ${
        v.certification || "—"
      } | ${v.guaranteeOnFile ? "Yes" : "No"}${v.guaranteeExpiry ? ` (exp. ${v.guaranteeExpiry})` : ""} | ${contact} |`;
    })
    .join("\n");
  return `${header}\n${rows}`;
}

function haccpTeamTable(team: HaccpTeamMemberData[] | undefined, f: FacilityProfile): string {
  if (!team || team.length === 0) {
    return `[No HACCP team members added yet — add them on the HACCP Team step. In the meantime, ${fallback(
      f.responsibleIndividual,
      "[Name / Title]"
    )} is recorded as the team lead of record.]`;
  }
  const header = "| Name | Role | Expertise | Responsibilities |\n| --- | --- | --- | --- |";
  const rows = team
    .map((m) => `| ${m.name || "—"} | ${m.role || "—"} | ${m.expertise || "—"} | ${m.responsibilities || "—"} |`)
    .join("\n");
  return `${header}\n${rows}`;
}

/** Regulatory citation note reused across several templates. */
const REG_CITATION_NOTE =
  "This document follows the Codex Alimentarius / NACMCF HACCP structure (5 Preliminary Steps, 7 Principles). That structure is required verbatim for FDA seafood HACCP (21 CFR 123), FDA juice HACCP (21 CFR 120), and USDA FSIS meat/poultry HACCP (9 CFR 417). For general US manufactured-food facilities, it functionally satisfies FDA's FSMA Hazard Analysis and Risk-Based Preventive Controls requirement (21 CFR Part 117 Subpart C, \"HARPC\"). For Canadian facilities, it is the same HACCP foundation CFIA requires for a preventive control plan under the Safe Food for Canadians Regulations (SFCR). If you process seafood, juice, or meat/poultry, confirm your plan additionally satisfies that sector's specific regulation.";

export type SopCategory = "gmp" | "food_safety" | "recall";

export interface SopTemplateDef {
  key: string;
  title: string;
  category: SopCategory;
  render: (ctx: SopRenderContext) => string;
}

// --- GMP / Prerequisite Program templates --------------------------------
// US citation: 21 CFR Part 117 Subpart B (Current Good Manufacturing
// Practice). Canada citation: CFIA prerequisite program guidance under the
// SFCR. Both regimes expect the same underlying practices.

const GMP_TEMPLATES: SopTemplateDef[] = [
  {
    key: "personnel_hygiene",
    title: "Personnel Health & Hygiene Policy",
    category: "gmp",
    render: ({ facility: f }) => `# Personnel Health & Hygiene Policy

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

## Regulatory basis
US: 21 CFR § 117.10 (Personnel — disease control, cleanliness). Canada: CFIA
prerequisite program expectations for personnel hygiene under the SFCR.

## Purpose
Prevents contamination of food, food-contact surfaces, and packaging
materials by personnel.

## Health Reporting
Employees must report to their supervisor before starting work if they are
experiencing symptoms such as diarrhea, vomiting, fever, jaundice, a
diagnosed communicable illness, or an open/infected wound on exposed skin.
Affected employees are reassigned to non-food-contact duties or excluded
from the facility until cleared to return.

## Hand Hygiene
1. Hands are washed and sanitized before starting work, after breaks, after
   using the washroom, after handling waste or non-food items, and any time
   hands become contaminated.
2. Handwashing stations are stocked with soap, single-use towels (or an
   equivalent hand-drying method), and warm running water.
3. Gloves, where used, do not replace handwashing and are changed between
   tasks and whenever damaged or contaminated.

## Jewelry, Personal Items & Habits
Jewelry (except a plain wedding band, where permitted by facility policy),
false nails/nail polish, and personal items are not worn/brought into
production areas. Eating, drinking (other than from designated stations),
chewing gum, and smoking are prohibited in production areas.

## Monitoring
A supervisor performs a visual pre-shift hygiene check for all personnel and
visitors entering production areas, and documents exceptions.

## Corrective Action
Employees not meeting this policy are corrected before entering production
areas; employees reporting illness consistent with a foodborne pathogen are
excluded from food-contact duties until symptom-free for the period defined
by facility policy (consult current public health guidance).

## Recordkeeping
Pre-shift hygiene check records and illness-reporting records are retained
for [retention period] and reviewed by ${fallback(f.responsibleIndividual, "[Name / Title]")}.
`,
  },
  {
    key: "code_of_conduct",
    title: "Employee Code of Conduct (Food Safety)",
    category: "gmp",
    render: ({ facility: f }) => `# Employee Code of Conduct — Food Safety

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

## Purpose
Sets expectations for employee behaviour that protects food safety and
quality at ${fallback(f.facilityName, "[Facility Name]")}.

## Expectations
1. Follow all posted GMP, hygiene, and food safety procedures at all times.
2. Report food safety hazards, near-misses, and non-conformances to a
   supervisor immediately, without fear of reprisal.
3. Do not knowingly release non-conforming product.
4. Complete required food safety training before working unsupervised in
   production areas.
5. Follow facility policy on visitors, contractors, and personal items in
   production areas.
6. Cooperate fully with internal audits, and any FDA, USDA FSIS, or CFIA
   inspections and third-party audits.

## Consequences of Non-Compliance
Violations are addressed through the facility's standard progressive
discipline process; deliberate food safety violations may result in
immediate corrective action up to and including termination.

## Acknowledgement
All employees acknowledge this code of conduct in writing upon hire and
upon any material revision. Signed acknowledgements are kept in each
employee's personnel file.
`,
  },
  {
    key: "dress_code",
    title: "Suitable Attire Policy (Dress Code)",
    category: "gmp",
    render: ({ facility: f }) => `# Suitable Attire Policy

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

## Purpose
Defines attire required in production areas to prevent physical and
biological contamination of ${fallback(f.foodCategories, "[product categories]")}.

## Required Attire in Production Areas
1. Clean uniform or outer garment, put on at the facility and not worn
   outside the plant (or covered when travelling to/from work).
2. Hairnet or hat covering all head hair; beard net for facial hair, where
   applicable.
3. Closed-toe, non-slip footwear designated for or dedicated to the
   production floor.
4. No exposed jewelry (per the Personnel Health & Hygiene Policy).
5. Gloves where required for the task, changed per the hygiene policy.

## Visitors & Contractors
Visitors and contractors entering production areas are provided with, and
must wear, the same protective attire before entry, and are briefed on
basic hygiene rules.

## Monitoring
A supervisor visually verifies attire compliance at the start of each shift
and for all visitors before they enter production areas.

## Corrective Action
Personnel or visitors not in compliant attire are corrected before entering
or continuing in production areas.

## Recordkeeping
Attire compliance checks are documented as part of the daily
pre-operational or GMP checklist and retained for [retention period].
`,
  },
  {
    key: "vendor_qualification",
    title: "Vendor & Supplier Qualification Program",
    category: "gmp",
    render: ({ facility: f, vendors }) => `# Vendor & Supplier Qualification Program

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

## Purpose
Ensures that vendors and suppliers of ingredients, packaging, and
food-contact services meet the food safety requirements of
${fallback(f.facilityName, "[Facility Name]")} before being approved for use.
Maintaining more than one approved vendor for critical materials avoids a
single-source supply vulnerability.

## Qualification Process
1. New vendors submit relevant documentation (e.g., food safety
   certification/GFSI status, licence/registration numbers, specification
   sheets, allergen declarations, certificate of insurance where
   applicable) before first shipment.
2. Documentation is reviewed against this facility's requirements; vendors
   supplying a hazard this facility relies on them to control are subject to
   the additional verification activities in the Supply-Chain Program.
3. Approved vendors are added to the Approved Supplier List below with the
   date of approval and the individual who approved them.

## Approved Supplier List
${approvedSupplierTable(vendors)}

## Ongoing Requirements
Approved vendors must notify ${fallback(
      f.facilityName,
      "[Facility Name]"
    )} of any change in formulation, allergen status, sourcing, or food
safety certification status.

## Re-Evaluation
Vendors are re-evaluated at least annually, or immediately upon a
non-conformance, complaint trend, or certification lapse.

## Recordkeeping
The Approved Vendor List and supporting qualification documents are
maintained and reviewed by ${fallback(f.responsibleIndividual, "[Name / Title]")}.
`,
  },
  {
    key: "transportation_guarantee",
    title: "Transportation Letter of Guarantee",
    category: "gmp",
    render: ({ facility: f }) => `# Transportation Letter of Guarantee

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Address:** ${fallback(f.address, "[Facility Address]")}

## Purpose
A template letter of guarantee to be issued to (or requested from) carriers
transporting ${fallback(f.foodCategories, "[product categories]")} on behalf of
${fallback(f.facilityName, "[Facility Name]")}, confirming food-safe
transportation practices, consistent with both FDA Sanitary Transportation
(21 CFR Part 1, Subpart O) and CFIA transportation expectations.

---

To: [Carrier Name]
From: ${fallback(f.facilityName, "[Facility Name]")}
Date: [Date]

This letter confirms that [Carrier Name] agrees to transport product on
behalf of ${fallback(f.facilityName, "[Facility Name]")} under the following
conditions:

1. Trailers/containers used are clean, free of pests, and in good repair
   before loading.
2. Product requiring temperature control is maintained at
   [temperature range] throughout transport, and temperature is verified
   and recorded at loading and unloading.
3. Food product is not co-mingled with non-food or hazardous materials in a
   manner that could cause contamination.
4. Any incident affecting product integrity during transport (temperature
   excursion, contamination, accident) is reported to
   ${fallback(f.facilityName, "[Facility Name]")} immediately.
5. The carrier maintains records sufficient to demonstrate compliance with
   the above and provides them upon request.

Acknowledged by:

Carrier representative: ________________________  Date: ___________

${fallback(f.facilityName, "[Facility Name]")} representative: ________________________  Date: ___________

---

## Recordkeeping
Signed letters of guarantee are kept on file for each carrier used and
renewed/re-confirmed at least annually.
`,
  },
  {
    key: "sanitation",
    title: "Sanitation Standard Operating Procedure (SSOP)",
    category: "gmp",
    render: ({ facility: f, products }) => `# Sanitation Standard Operating Procedure

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Address:** ${fallback(f.address, "[Facility Address]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Regulatory basis
US: 21 CFR § 117.35 (Sanitary operations). Canada: CFIA sanitation
prerequisite program under the SFCR.

## Purpose
Establishes the procedures for cleaning and sanitizing food-contact
surfaces, equipment, and the facility environment at ${fallback(
      f.facilityName,
      "[Facility Name]"
    )} to prevent contamination of ${fallback(f.foodCategories, "[product categories]")}.

## Scope
Applies to all food-contact surfaces, non-food-contact surfaces in production
areas, equipment, and utensils used in the production of ${productListText(products, f)}.

## Procedure
1. Pre-operational visual inspection of all food-contact surfaces.
2. Removal of gross soil (dry cleaning) before wet cleaning where applicable.
3. Application of an approved detergent, followed by a potable-water rinse.
4. Application of an approved sanitizer at the labeled concentration and
   contact time; verify concentration with a test strip or equivalent method.
5. Air-dry or single-use wipe of food-contact surfaces before resuming
   production.
6. Environmental monitoring of designated zones per the facility's
   environmental monitoring program, where applicable.

## Monitoring
Pre-operational sanitation checks are performed and documented before the
start of each production run by a trained employee.

## Corrective Action
If a surface fails pre-operational inspection or sanitizer verification,
production does not begin (or is halted) until re-cleaning and re-verification
are completed and documented.

## Verification
A supervisor or the responsible individual (${fallback(
      f.responsibleIndividual,
      "[Name / Title]"
    )}) reviews sanitation records at least weekly and reconciles them against
production schedules.

## Recordkeeping
Sanitation records are retained for at least [retention period consistent with
applicable regulations, typically 2 years] and are available for review upon
request, including by FDA, USDA FSIS, or CFIA.
`,
  },
  {
    key: "pest_control",
    title: "Pest Control Program",
    category: "gmp",
    render: ({ facility: f }) => `# Pest Control Program

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Address:** ${fallback(f.address, "[Facility Address]")}

## Purpose
Prevents pest activity from contaminating ${fallback(
      f.foodCategories,
      "[product categories]"
    )}, food-contact surfaces, or packaging at ${fallback(f.facilityName, "[Facility Name]")}.

## Program Elements
1. **Exterior:** Building perimeter kept clear of debris/vegetation
   overgrowth; doors, windows, and utility penetrations sealed against
   pest entry.
2. **Monitoring devices:** Insect light traps, rodent bait/snap stations,
   and pheromone traps are placed at facility entry points, receiving,
   storage, and production areas per a site pest-control map, and serviced
   by [in-house trained staff / licensed pest control provider — specify].
3. **Inspection frequency:** Devices are inspected at least [monthly /
   per contractor schedule], with findings logged.
4. **Chemical control:** Pesticides used, if any, are approved for use in
   food facilities, applied only in non-production areas or per label
   restrictions, and applications are logged.

## Monitoring
Pest activity trends (device catch counts, sightings, droppings) are
reviewed at each servicing visit and summarized [monthly/quarterly].

## Corrective Action
Evidence of pest activity in a production or storage area triggers an
investigation of nearby product for contamination, additional trapping/
treatment, and root-cause corrective action (e.g., sealing an entry point).

## Recordkeeping
Pest control service reports, device maps, and trend logs are retained for
[retention period] and reviewed by ${fallback(f.responsibleIndividual, "[Name / Title]")}.
`,
  },
  {
    key: "personnel_training",
    title: "Personnel Training Program",
    category: "gmp",
    render: ({ facility: f }) => `# Personnel Training Program

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

## Purpose
Ensures personnel at ${fallback(
      f.facilityName,
      "[Facility Name]"
    )} have the knowledge needed to perform their roles safely and in
compliance with this HACCP Plan and applicable FDA/USDA FSIS/CFIA
requirements. US HARPC (21 CFR § 117.4) also requires that the individual(s)
performing preventive-control-related activities be "qualified" through
training and/or experience.

## Training Requirements
1. **Orientation training** (before starting unsupervised work): GMPs,
   personnel hygiene, attire, allergen awareness, and role-specific food
   safety duties.
2. **Role-specific training:** Employees performing a preventive control
   (e.g., a CCP, allergen control point) are trained on the specific
   critical limits, monitoring procedure, and corrective action for that
   control before performing it unsupervised.
3. **Refresher training:** Conducted at least annually, or when a
   procedure changes, a non-conformance trend is identified, or an
   employee returns from extended leave.

## Monitoring
Completed training is logged with employee name, topic, trainer, and date.
Supervisors verify new employees are not assigned unsupervised
food-safety-critical duties before training is complete.

## Corrective Action
Employees found performing duties without required training are retrained
before resuming that duty; the training program is reviewed if gaps are
found to be systemic.

## Recordkeeping
Individual training records are kept in each employee's file and retained
for the duration of employment plus [retention period].
`,
  },
  {
    key: "corporate_structure",
    title: "Corporate Structure / Organizational Chart",
    category: "gmp",
    render: ({ facility: f }) => `# Corporate Structure

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

## Purpose
Documents the reporting structure and food-safety-relevant roles at
${fallback(f.facilityName, "[Facility Name]")}, so responsibility for this
HACCP Plan is clear.

## Organizational Chart
[Insert or describe your organizational chart here — e.g.:]

- Owner / General Manager
  - HACCP Team Leader / Responsible Individual: ${fallback(
    f.responsibleIndividual,
    "[Name / Title]"
  )}
  - Production Supervisor(s)
  - Quality / Food Safety Lead
  - Sanitation Lead
  - Maintenance Lead
  - Shipping/Receiving Lead

## Roles & Responsibilities Summary
Detailed responsibilities for each food-safety-relevant role are documented
in that role's Job Description (see Job Descriptions).

## Review
This structure is reviewed and updated whenever there is a significant
personnel or organizational change, and at least annually.
`,
  },
  {
    key: "job_descriptions",
    title: "Job Descriptions (Food Safety Roles)",
    category: "gmp",
    render: ({ facility: f }) => `# Job Descriptions — Food Safety Roles

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

Below is a starting template — duplicate the block for each food-safety-relevant
role at your facility and fill in the specifics.

## [Role Title — e.g. "Production Supervisor"]
- **Reports to:** [Title]
- **Food safety responsibilities:**
  - [e.g. "Verify pre-operational sanitation checks before production
    start"]
  - [e.g. "Monitor and record CCP critical limits per the HACCP Plan"]
- **Required training/qualifications:** [e.g. GMP orientation, allergen
  awareness, CCP-specific monitoring training]
- **Authority:** [e.g. "Authorized to halt production if a critical limit
  is not met"]

## [Role Title — e.g. "HACCP Team Leader"]
- **Name:** ${fallback(f.responsibleIndividual, "[Name]")}
- **Reports to:** [Title]
- **Food safety responsibilities:**
  - Develop, implement, and maintain this HACCP Plan
  - Convene and lead the HACCP team; coordinate the annual reassessment
  - Review monitoring, verification, and corrective action records
  - Serve as primary contact for FDA, USDA FSIS, or CFIA inspections
    related to this plan
- **Required training/qualifications:** [e.g. HACCP training consistent
  with your regulatory scope, food safety training relevant to the
  facility's products]

## Recordkeeping
Current job descriptions for all food-safety-relevant roles are kept on
file and reviewed at least annually or upon role change.
`,
  },
  {
    key: "pre_operational_inspection",
    title: "Pre-Operational Inspection SOP",
    category: "gmp",
    render: ({ facility: f, products }) => `# Pre-Operational Inspection SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Confirms that the facility, equipment, and food-contact surfaces are clean,
sanitary, and in good repair before production of ${productListText(products, f)}
begins each day, so that pre-existing contamination or equipment defects are
caught before they can affect product.

## Scope
Applies to all production lines, food-contact surfaces, utensils, overhead
structures, drains, and adjacent non-food-contact areas prior to the start of
each shift or production run.

## Procedure
Before production starts, a trained employee inspects and confirms:
1. Food-contact surfaces are visibly clean, sanitized, and dry (cross-checks
   the Sanitation SOP was completed).
2. No standing water, condensation over exposed product, or drain backup.
3. Equipment is intact — no missing bolts, worn gaskets, flaking paint, tape,
   or loose hardware that could become a physical hazard.
4. No evidence of pest activity (droppings, gnaw marks, insects).
5. Utensils, hoses, and small parts are stored off the floor and protected.
6. Hand-wash and sanitizing stations are stocked and functional.
7. Only approved, correctly labeled chemicals are present; no chemicals stored
   over or near exposed product or packaging.

## Monitoring
The inspection is documented on a pre-operational checklist, signed and dated,
before the "go" decision to start production.

## Corrective Action
Any deficiency is corrected and re-inspected before production begins. If a
deficiency is found that could have affected product from a prior run, that
product is placed on hold and investigated.

## Verification
${fallback(f.responsibleIndividual, "[Name / Title]")} reviews completed
pre-operational checklists at least weekly.

## Recordkeeping
Pre-operational inspection checklists are retained for [retention period] and
available for regulatory review.
`,
  },
  {
    key: "preventive_maintenance",
    title: "Preventive Maintenance SOP",
    category: "gmp",
    render: ({ facility: f }) => `# Preventive Maintenance SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Keeps equipment operating as intended so that maintenance-related hazards
(metal fragments from worn parts, temperature-control failures, calibration
drift on monitoring instruments) are prevented rather than discovered after
they affect product.

## Scope
Applies to all production and monitoring equipment whose failure could affect
food safety — including thermometers/thermographs, metal detectors/X-ray,
scales, cutters/blades, seals and gaskets, refrigeration, and any equipment
associated with a CCP or preventive control.

## Program Elements
1. **Equipment list:** Maintain a list of food-safety-relevant equipment and
   its required maintenance tasks and frequencies (per manufacturer
   recommendations and facility experience).
2. **Scheduled maintenance:** Perform and log preventive maintenance on
   schedule (e.g., blade/gasket inspection, lubrication with food-grade
   lubricants only, belt and fastener checks).
3. **Calibration:** Calibrate/verify monitoring instruments used for critical
   limits (thermometers, metal detectors, scales, pH/Aw meters) at a defined
   frequency and after any repair, against a known standard.
4. **Repairs:** Temporary repairs (tape, wire, cardboard) are not used on
   food-contact equipment; after any repair, the area is cleaned/sanitized and
   inspected before returning to production.

## Monitoring
Completed maintenance and calibration are logged with equipment ID, task,
date, result, and technician.

## Corrective Action
If a monitoring instrument is found out of calibration, product produced since
the last good check is evaluated for the affected parameter and held if
necessary. Equipment that fails could-affect-safety maintenance is removed
from service until repaired and verified.

## Verification
${fallback(f.responsibleIndividual, "[Name / Title]")} reviews the maintenance
and calibration logs at least monthly and confirms scheduled tasks are current.

## Recordkeeping
Maintenance schedules, work orders, and calibration records are retained for
[retention period].
`,
  },
];

// --- Food-safety (hazard-specific) templates ------------------------------

const FOOD_SAFETY_TEMPLATES: SopTemplateDef[] = [
  {
    key: "recall",
    title: "Recall Plan",
    category: "recall",
    render: ({ facility: f, products, recallContacts, mockRecalls }) => {
      const contacts = recallContacts ?? [];
      const teamSection =
        contacts.length > 0
          ? contacts
              .map(
                (c) =>
                  `- **${fallback(c.role, "Team member")}:** ${fallback(c.name, "[Name]")}${
                    c.phone ? ` — ${c.phone}` : ""
                  }${c.email ? ` — ${c.email}` : ""}`
              )
              .join("\n")
          : `- Recall coordinator: ${fallback(
              f.responsibleIndividual,
              "[Name / Title]"
            )}\n- Alternates and cross-functional contacts: [add recall team members on the Recall Plan step]`;

      const sortedMockRecalls = [...(mockRecalls ?? [])].sort(
        (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      );
      const latestMockRecall = sortedMockRecalls[0];
      const mockRecallSection = latestMockRecall
        ? `Most recent mock recall: **${formatDate(latestMockRecall.performedAt)}**, performed by ${fallback(
            latestMockRecall.performedBy,
            "[Name]"
          )}, tracing ${fallback(latestMockRecall.percentTraced, "[% traced]")}. ${fallback(
            latestMockRecall.resultsSummary,
            ""
          )}`.trim()
        : "No mock recall is on file yet — one should be conducted and logged on the Recall Plan step before this plan is finalized.";

      const mockRecallHistory =
        sortedMockRecalls.length > 0
          ? sortedMockRecalls
              .map(
                (r) =>
                  `- ${formatDate(r.performedAt)} — performed by ${fallback(r.performedBy, "[Name]")}, traced ${fallback(
                    r.percentTraced,
                    "[% traced]"
                  )}${r.resultsSummary ? ` — ${r.resultsSummary}` : ""}`
              )
              .join("\n")
          : "- No mock recalls logged yet.";

      return `# Recall Plan

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")} — ${fallback(
        f.responsibleIndividualContact,
        "[Contact Info]"
      )}
**CFIA licence number (if applicable):** ${fallback(f.cfiaLicenseNumber, "[Licence Number]")}
**FDA registration number (if applicable):** ${fallback(f.fdaRegistrationNumber, "[Registration Number]")}

## Purpose
Establishes procedures to promptly and effectively remove affected product
(${productListText(products, f)}) from the market if it is found to present a
risk to consumers, consistent with US recall expectations (FDA 21 CFR Part 7
Subpart C; USDA FSIS recall procedures where applicable) and CFIA recall
requirements under the Safe Food for Canadians Regulations.

## Recall Team
${teamSection}

## Trigger Criteria
A recall is initiated when the facility becomes aware that distributed product
may be adulterated or misbranded in a way that presents a health risk (e.g.,
positive pathogen test, undeclared allergen, foreign material complaint
pattern, supplier notification of contaminated ingredient).

## Procedure
1. Convene the recall team immediately upon identifying a potential issue.
2. Use lot codes and distribution records to identify all affected product
   and its location in the supply chain.
3. Notify direct customers/distributors within [target timeframe, e.g., 24
   hours] with lot numbers, reason, and instructions.
4. Notify the applicable regulator(s) as required — FDA (and/or USDA FSIS for
   meat/poultry) in the US, and/or the Canadian Food Inspection Agency (CFIA)
   in Canada, using the facility's registration/licence numbers above.
5. Issue a public notice if warranted, in coordination with the regulator.
6. Track returned/destroyed product and reconcile against distribution
   records to confirm effectiveness.

## Mock Recalls
A mock recall is performed at least **annually** to verify traceability
records allow the facility to account for all affected product within a
reasonable timeframe (commonly one business day).

${mockRecallSection}

### Mock Recall History
${mockRecallHistory}

## Recordkeeping
Distribution and lot-coding records sufficient to conduct a recall are
maintained for [retention period] and reviewed for completeness quarterly.
`;
    },
  },
  {
    key: "allergen_control",
    title: "Allergen Control Plan (Per-Product)",
    category: "food_safety",
    render: ({ facility: f, productFormulations }) => {
      const products = productFormulations ?? [];

      if (products.length === 0) {
        return `# Allergen Control Plan

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

No products with formulation data are on file yet. Add products and their
ingredients on the Products and Formulations steps, then regenerate this
document — each product will get its own allergen declaration built directly
from its ingredient list, rather than a manually maintained facility-wide
list.

## Regulatory basis
US: priority allergens under the FASTER Act / FALCPA ("Big 9": milk, eggs,
fish, crustacean shellfish, tree nuts, peanuts, wheat, soybeans, sesame).
Canada: CFIA priority allergens (the same 9, plus mustard), gluten sources
(wheat, barley, rye, oats, triticale), and added sulphites at or above
10 ppm, all of which must be declared under Canada's Food and Drug
Regulations.
`;
      }

      const perProduct = products
        .map((p) => {
          const allergenIngredients = p.ingredients.filter((i) => i.isAllergen);
          const declaration =
            allergenIngredients.length > 0
              ? allergenIngredients
                  .map((i) => `- **${i.allergenType || "[allergen type not set]"}** — from ingredient "${i.name}"${
                      i.percentageOfFormulation ? ` (${i.percentageOfFormulation} of formulation)` : ""
                    }${i.supplierVendorId ? "" : ""}`)
                  .join("\n")
              : "- No ingredients on this product are currently flagged as allergen-containing. Confirm this is accurate on the Formulations step before finalizing.";

          const table =
            p.ingredients.length > 0
              ? [
                  "| Ingredient | % of formulation | Functional role | Country of origin | Allergen? | Allergen type |",
                  "| --- | --- | --- | --- | --- | --- |",
                  ...p.ingredients.map(
                    (i) =>
                      `| ${i.name || "—"} | ${i.percentageOfFormulation || "—"} | ${i.functionalRole || "—"} | ${
                        i.countryOfOrigin || "—"
                      } | ${i.isAllergen ? "Yes" : "No"} | ${i.allergenType || "—"} |`
                  ),
                ].join("\n")
              : "[No ingredients recorded for this product yet — add them on the Formulations step.]";

          return `## ${p.productName}

### Allergen Declaration (auto-populated from formulation data)
${declaration}

### Full Formulation
${table}
`;
        })
        .join("\n");

      return `# Allergen Control Plan

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

## Regulatory basis
US: priority allergens under the FASTER Act / FALCPA ("Big 9": milk, eggs,
fish, crustacean shellfish, tree nuts, peanuts, wheat, soybeans, sesame).
Canada: CFIA priority allergens (the same 9, plus mustard), gluten sources
(wheat, barley, rye, oats, triticale), and added sulphites at or above
10 ppm. This facility's allergen declaration below is US-and-Canada-priority
combined — confirm with your regulatory scope (Facility Profile step) which
subset legally applies to your labeling.

## Purpose
Prevents undeclared allergens in finished product through control of
ingredient receiving, storage, formulation, changeovers/cleaning, and
labeling. Unlike a single facility-wide list, each product below has its own
allergen declaration, generated directly from that product's ingredient
records (Formulations step) — so it stays accurate as formulations change.

${perProduct}

## Controls
1. **Receiving:** Verify supplier ingredient specifications/labels match
   allergen declarations on file before acceptance.
2. **Storage:** Store allergen-containing ingredients in designated,
   clearly labeled areas to prevent cross-contact; segregate from
   allergen-free ingredients where feasible.
3. **Scheduling/Changeovers:** Sequence production to run allergen-free
   products before allergen-containing products where practical; perform a
   validated allergen cleanout between changeovers.
4. **Labeling:** Verify the correct label matching the actual formulation
   (including required bilingual English/French text where selling into
   Canada) is applied to every production run before release.
5. **Rework:** Only use rework that shares the same allergen profile as the
   product it's added to, and document the addition.

## Monitoring
Label/formulation reconciliation is checked and documented at the start of
each production run. Allergen cleanout effectiveness is verified per the
facility's cleaning verification method (e.g., ATP swab or allergen-specific
test) before allergen-free production resumes.

## Corrective Action
If a label/formulation mismatch is found, affected product is placed on hold
pending investigation and, if necessary, relabeled or subjected to the recall
plan.

## Verification
${fallback(f.responsibleIndividual, "[Name / Title]")} reviews allergen control
records at least monthly, and re-confirms each product's allergen declaration
above whenever its formulation changes.
`;
    },
  },
  {
    key: "raw_material_inspection",
    title: "Raw Material / Incoming Material Inspection SOP",
    category: "food_safety",
    render: ({ facility: f, products }) => `# Raw Material / Incoming Material Inspection SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Ensures incoming ingredients, packaging, and other materials used to produce
${productListText(products, f)} are inspected on receipt for contamination,
damage, temperature abuse, and correct identity before acceptance —
controlling hazards at the receiving step.

## Scope
Applies to every shipment of raw materials, ingredients, processing aids, and
food-contact packaging received at the facility.

## Procedure
On receipt, a trained employee verifies and records:
1. **Supplier:** Material is from an approved supplier (see Vendor & Supplier
   Qualification Program).
2. **Documentation:** Shipping documents, and where required a Certificate of
   Analysis (see Vendor Guarantee & CoA SOP), match the material and lot.
3. **Vehicle/condition:** Transport vehicle is clean, free of pests, odours,
   and non-food contaminants; refrigerated/frozen loads are at the required
   temperature (measured and recorded).
4. **Integrity:** Packaging is intact — no tears, leaks, infestation, rust,
   glass, swelling, or signs of tampering.
5. **Identity & allergens:** Product name, spec, and allergen declaration
   match the purchase order and the facility's ingredient specification (see
   Formulations data for each product using this ingredient).
6. **Coding:** Lot codes and best-before/expiry dates are present and within
   acceptable range.

## Monitoring
Each receipt is documented on a receiving log/checklist with date, supplier,
lot, temperature (where applicable), inspector, and accept/reject decision.

## Corrective Action
Material that fails any check is rejected or placed on hold and clearly
identified, segregated, and dispositioned (returned, destroyed, or released
only after the deviation is resolved). Repeated failures from a supplier
trigger review under the Vendor & Supplier Qualification Program.

## Verification
${fallback(f.responsibleIndividual, "[Name / Title]")} reviews receiving records
at least [weekly/monthly].

## Recordkeeping
Receiving logs, temperature records, and rejection records are retained for
[retention period].
`,
  },
  {
    key: "label_inspection",
    title: "Label Inspection SOP",
    category: "food_safety",
    render: ({ facility: f, products }) => `# Label Inspection SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Ensures the correct, accurate label is applied to every unit of
${productListText(products, f)}, with particular attention to allergen
declaration and label accuracy, to prevent undeclared allergens and
misbranding — a leading cause of food recalls in both the US and Canada.

## Scope
Applies to all consumer and shipping labels at each production run and at any
label changeover.

## Procedure
1. **Correct label:** Before a run starts, verify the label pulled matches the
   product and formulation scheduled (product name, net quantity, format).
2. **Allergen accuracy:** Confirm the label's allergen statement matches the
   product's current allergen declaration (see the per-product Allergen
   Control Plan, generated from Formulations data) and that all applicable
   priority allergens, gluten sources, and added sulphites are declared for
   the market(s) this lot ships to.
3. **Ingredient list:** Confirm the ingredient list matches the current
   approved formulation, in descending order by weight.
4. **Bilingual & mandatory elements (Canada-bound product):** Confirm
   required bilingual (English/French) text and other mandatory elements are
   present and legible where the product is sold into Canada.
5. **Lot/date coding:** Confirm lot code and best-before/expiry are correctly
   applied and legible.
6. **First-article check:** Inspect the first labeled unit off the line, and
   at a defined frequency thereafter, plus at every label roll/changeover.

## Monitoring
Label checks (first-article, periodic, and changeover) are documented with the
run/lot, label version, checker, and result.

## Corrective Action
On any mismatch, the line is stopped, affected product is placed on hold, the
correct label is confirmed, and mislabeled product is relabeled or destroyed.
If mislabeled product may have shipped, the Customer Complaints/Recall
procedures are triggered.

## Verification
${fallback(f.responsibleIndividual, "[Name / Title]")} reviews label inspection
records at least monthly and reconciles label inventory to production.

## Recordkeeping
Label inspection records and retained label specimens are kept for
[retention period].
`,
  },
  {
    key: "vendor_guarantee_coa",
    title: "Vendor Guarantee & Certificate of Analysis (CoA) SOP",
    category: "food_safety",
    render: ({ facility: f }) => `# Vendor Guarantee & Certificate of Analysis (CoA) SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Uses supplier guarantees (letters of guarantee/continuing guarantee) and
Certificates of Analysis to provide documented assurance that incoming
materials are free from contamination and meet specification — supporting
the "supply-chain program" hazards this facility relies on suppliers to
control under both US HARPC (21 CFR § 117.136) and CFIA supply-chain
expectations.

## Scope
Applies to ingredients and materials where a supplier guarantee and/or CoA is
the basis for accepting the lot (e.g., allergen status, pathogen testing,
mycotoxin/heavy-metal limits, potency/identity).

## Letter of Guarantee
1. Obtain a signed letter of (continuing) guarantee from each supplier stating
   that materials supplied comply with applicable food law in the
   jurisdiction(s) they're shipped to and the facility's specifications, and
   that the supplier will notify the facility of any change to formulation,
   allergen status, or sourcing.
2. Keep current guarantees on file for every approved supplier; re-confirm at
   least annually.

## Certificate of Analysis (CoA)
1. Define which materials require a CoA and which parameters must appear
   (e.g., pathogen results, allergen statement, moisture/Aw, potency,
   contaminant limits).
2. On receipt, match each CoA to the specific lot received, and verify each
   reported result meets specification before the lot is released to
   production.
3. Where CoAs are relied on in place of incoming testing, periodically verify
   supplier CoA reliability (e.g., independent verification testing at a
   defined frequency).

## Monitoring
CoA review (lot match + results within spec) and guarantee currency are
documented at receiving; exceptions are flagged.

## Corrective Action
A missing CoA, a lot mismatch, or an out-of-spec result results in the lot
being held pending resolution; unresolved lots are rejected. Recurring CoA
issues trigger supplier re-evaluation.

## Verification
${fallback(f.responsibleIndividual, "[Name / Title]")} reviews CoA and guarantee
records at least [monthly/quarterly].

## Recordkeeping
Letters of guarantee and CoAs are retained for [retention period] and linked to
the lots they cover.
`,
  },
  {
    key: "customer_complaints",
    title: "Customer Complaint Handling SOP",
    category: "food_safety",
    render: ({ facility: f }) => `# Customer Complaint Handling SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Ensures food safety and quality complaints are captured, assessed, and acted
on quickly — and that any complaint indicating a potential health risk triggers
the facility's Recall Plan.

## Scope
Applies to all complaints received from consumers, customers, distributors,
retailers, or regulators regarding ${fallback(f.foodCategories, "[product categories]")}.

## Procedure
1. **Capture:** Log every complaint with date received, complainant contact,
   product, lot/date code, nature of the complaint, and any sample/photo.
2. **Classify:** Assess whether the complaint is:
   - **Food safety / health risk** (e.g., foreign material, illness,
     undeclared allergen, spoilage/pathogen indication), or
   - **Quality only** (e.g., appearance, texture, taste).
3. **Immediate action for potential health risk:** Notify
   ${fallback(f.responsibleIndividual, "[Name / Title]")} immediately, place
   potentially affected lots on hold, and evaluate whether the Recall Plan must
   be initiated (see Recall Plan). Notify FDA, USDA FSIS, and/or CFIA where
   required.
4. **Investigate:** Determine root cause using production, monitoring, and
   distribution records for the implicated lot.
5. **Respond:** Acknowledge the complainant and, where appropriate, provide a
   resolution.

## Monitoring
Complaints are trended (by type, product, and lot) at least [monthly] to detect
emerging patterns that may indicate a systemic problem or a developing recall
situation.

## Corrective Action
Confirmed food safety complaints drive root-cause corrective action; a trend or
a confirmed health risk triggers the Recall Plan and, where required,
notification to the applicable regulator(s).

## Verification
${fallback(f.responsibleIndividual, "[Name / Title]")} reviews the complaint log
and trend analysis at least monthly.

## Recordkeeping
Complaint records, investigations, and any resulting corrective actions or
recalls are retained for [retention period].
`,
  },
  {
    key: "receiving",
    title: "Receiving SOP (with Receiving Log)",
    category: "food_safety",
    render: ({ facility: f }) => `# Receiving SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Establishes how incoming raw materials, ingredients, and packaging are
received, inspected, and recorded — including capturing each material's
supplier lot code and assigning an internal lot code so that traceability
begins at receiving (see the Traceability & Lot Coding SOP).

## Procedure
1. Confirm the material is from an approved supplier and matches the purchase
   order.
2. Inspect condition, temperature (for refrigerated/frozen loads), packaging
   integrity, and coding per the Raw Material Inspection SOP.
3. Record the **supplier lot code** exactly as it appears on the material,
   and assign an **internal (in-house) lot code** used to track that material
   through production.
4. Accept, reject, or hold the shipment and record the decision.
5. File the receiving log entry so it can be linked to the batch records that
   later consume the material.

## Receiving Log

| Date received | Supplier | Material / ingredient | Supplier lot code | Internal lot code | Qty | Temp (if applicable) | Condition | Accept/Reject | Received by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |

## Monitoring & Corrective Action
Each shipment is logged at receipt. Non-conforming material is rejected or
held and dispositioned; the supplier is reviewed if failures recur.

## Recordkeeping
Receiving logs are retained for [retention period] and are the starting point
for any trace or recall.
`,
  },
  {
    key: "shipping",
    title: "Shipping SOP (with Shipping Log)",
    category: "food_safety",
    render: ({ facility: f, products }) => `# Shipping SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Ensures finished product (${productListText(products, f)}) is shipped under
food-safe conditions and that each shipment is recorded with the finished
product lot code and customer — completing the traceability chain so any lot
can be traced forward to the customers who received it.

## Procedure
1. Verify finished product is correctly labeled and within shelf life before
   loading (see Label Inspection SOP).
2. Inspect the transport vehicle for cleanliness, pests, odours, and (for
   temperature-controlled loads) pre-cooling to the required temperature.
3. Record the **finished product lot code**, quantity, customer/destination,
   ship date, and carrier for every outbound shipment.
4. Record load temperature at dispatch where applicable.

## Shipping Log

| Ship date | Customer / destination | Finished product | Finished product lot code | Qty | Carrier | Load temp (if applicable) | Shipped by |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

## Monitoring & Corrective Action
Each shipment is logged at dispatch. A shipment that fails inspection (unclean
vehicle, temperature not met) is held until corrected.

## Recordkeeping
Shipping logs are retained for [retention period] and are used, together with
the receiving log and batch records, to trace product forward during a recall.
`,
  },
  {
    key: "traceability",
    title: "Traceability & Lot Coding SOP (with Batch Record)",
    category: "food_safety",
    render: ({ facility: f, products }) => `# Traceability & Lot Coding SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Ensures one-up/one-back traceability for ${productListText(products, f)}: every
finished product lot can be traced **back** to the raw material lots it was made
from, and **forward** to the customers it was shipped to. This is the backbone
of an effective recall under both FDA/USDA FSIS and CFIA expectations (and, for
FDA-regulated high-risk foods, the additional traceability recordkeeping
requirements of 21 CFR Part 1 Subpart S where applicable).

## The Traceability Chain
1. **Receiving:** Each incoming material's supplier lot code is recorded and an
   internal lot code is assigned (Receiving SOP / Receiving Log).
2. **Production:** For each production run, the **batch record** captures which
   internal raw-material lot codes were used to make which **finished product
   lot code**.
3. **Shipping:** Each finished product lot code is recorded against the
   customer it shipped to (Shipping SOP / Shipping Log).

## Lot Coding
- Assign a unique finished product lot code to each production run (e.g., a
  date/line/sequence code). Document the coding convention here so anyone can
  interpret a code: [describe your lot code format].
- The finished product lot code appears on the product label and links to the
  batch record.

## Batch Record

| Field | Entry |
| --- | --- |
| Product | [product name] |
| Finished product lot code | [assigned lot code] |
| Production date & line | [date / line] |
| Raw material lots used (internal lot codes) | [list each ingredient and its internal lot code] |
| Quantity produced | [units] |
| Key process checks (e.g., cook temp/time, CCP records) | [reference or values] |
| Label version / lot verified | [initials] |
| Completed by | [name / initials] |

Raw material lots consumed in a run:

| Ingredient / material | Supplier lot code | Internal lot code | Quantity used |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |

## Verification (Mock Recall)
Traceability is verified at least annually via a mock recall (see Recall Plan)
by selecting a finished product lot and confirming it can be traced back to raw
material lots and forward to customers within a reasonable timeframe.

## Recordkeeping
Batch records, receiving logs, and shipping logs are retained for [retention
period] and cross-reference each other by lot code.
`,
  },
  {
    key: "water_potability",
    title: "Water Potability & Annual Testing SOP",
    category: "food_safety",
    render: ({ facility: f }) => `# Water Potability & Annual Testing SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Ensures water (and ice/steam that contacts food or food-contact surfaces) at
${fallback(f.facilityName, "[Facility Name]")} is potable and does not
introduce biological or chemical hazards, verified by testing at least
annually (US: 21 CFR § 117.37; Canada: CFIA water potability expectations
under the SFCR, and per municipal requirements).

## Scope
Applies to all water used in product, cleaning of food-contact surfaces, hand
washing, and ice/steam generation.

## Requirements
1. **Source:** Identify the water source (municipal / private well). Private
   wells and any non-municipal source require more frequent testing.
2. **Annual testing (minimum):** Test potable water at least annually for
   microbiological parameters (e.g., total coliforms and E. coli) and, as
   applicable, chemical parameters, using an accredited laboratory. Increase
   frequency for well water or if a result is unsatisfactory.
3. **Backflow prevention:** Maintain backflow/cross-connection controls so
   non-potable lines cannot contaminate potable water.
4. **Ice & steam:** Ice and culinary steam that contact food are made from
   potable water.

## Testing Log

| Sample date | Sample location | Parameter(s) tested | Result | Lab | Pass/Fail | Reviewed by |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

## Corrective Action
An unsatisfactory result triggers immediate action (e.g., stop using the
affected water, switch to a potable source, boil-water/flush-and-retest per
public health guidance) and investigation before the water is used again.

## Recordkeeping
Laboratory certificates of analysis and the testing log are retained for
[retention period] and reviewed by ${fallback(f.responsibleIndividual, "[Name / Title]")}.
`,
  },
  {
    key: "temperature_monitoring",
    title: "Temperature Monitoring SOP (with Log)",
    category: "food_safety",
    render: ({ facility: f }) => `# Temperature Monitoring SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Ensures temperature-dependent controls (cold storage, freezing, hot holding,
cooking, cooling) stay within limits, where applicable to this facility's
products, so temperature-related hazards are prevented.

## Scope
Applies to all coolers, freezers, hot-holding units, and process steps where
temperature is a control (including any CCP with a temperature critical limit).

## Procedure
1. Identify each unit/step to monitor and its target temperature range.
2. Check and record temperatures at the defined frequency (e.g., start of
   shift and every [X] hours), using a calibrated thermometer/data logger
   (see Preventive Maintenance SOP for calibration).
3. Sign/initial each reading.

## Temperature Log

| Date | Time | Unit / step | Target range | Actual temp | In spec? | Corrective action (if out) | Initials |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

## Corrective Action
An out-of-range reading triggers immediate action: assess affected product
(hold/evaluate), correct the equipment/process, and record what was done. For
a CCP deviation, follow that CCP's corrective action procedure.

## Verification
${fallback(f.responsibleIndividual, "[Name / Title]")} reviews temperature logs
at least [weekly] and confirms corrective actions were completed.

## Recordkeeping
Temperature logs are retained for [retention period].
`,
  },
  {
    key: "supplier_verification",
    title: "Supply-Chain (Supplier Verification) Program",
    category: "food_safety",
    render: ({ facility: f, vendors }) => `# Supply-Chain Program

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}

## Regulatory basis
US: 21 CFR § 117.136 (Supply-chain program, part of HARPC). Canada: CFIA
supply-chain / supplier verification expectations under the SFCR.

## Purpose
Ensures raw materials and ingredients received by ${fallback(
      f.facilityName,
      "[Facility Name]"
    )} are adequately controlled for hazards that this facility relies on its
suppliers to control (i.e., hazards not otherwise controlled at this
facility). Works together with the Vendor & Supplier Qualification Program.

## Approved Supplier List
Only ingredients from approved suppliers are accepted. A supplier is added to
the approved list after:
1. Reviewing the supplier's relevant food safety documentation (e.g., HACCP
   plan summary, GFSI certification, or equivalent).
2. Confirming the supplier's control of the hazard(s) this facility is relying
   on them to manage.

Current approved suppliers:

${approvedSupplierTable(vendors)}

## Verification Activities
Depending on hazard severity and supplier risk, verification may include:
- Annual or more frequent onsite audits
- Review of certificates of analysis (CoA) with each lot or periodically
- Sampling and testing of incoming lots
- Review of the supplier's relevant food safety certification

## Ongoing Monitoring
Supplier performance (non-conformances, complaint trends, audit results) is
reviewed at least annually, or sooner if an issue arises, to determine whether
continued approval is warranted.

## Corrective Action
Lots received from a supplier with an active non-conformance are placed on
hold pending investigation. Suppliers failing to resolve non-conformances may
be removed from the approved list.

## Recordkeeping
Supplier approval documentation, verification records, and CoAs are retained
for [retention period] and reviewed by ${fallback(
      f.responsibleIndividual,
      "[Name / Title]"
    )}.
`,
  },
  {
    key: "haccp_validation_reassessment",
    title: "HACCP Plan Validation & Annual Reassessment Record",
    category: "food_safety",
    render: ({ facility: f, haccpTeam, products }) => `# HACCP Plan Validation & Annual Reassessment Record

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**HACCP team leader:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
${REG_CITATION_NOTE}

Both regimes expect that a HACCP/preventive control plan is **validated**
before first use (confirming it will actually control the identified
hazards) and **reassessed at least annually**, or sooner if a change occurs
that could affect the hazard analysis.

## HACCP Team of Record
${haccpTeamTable(haccpTeam, f)}

## Initial Validation
Validation confirms the plan's scientific/technical basis — that the
critical limits chosen for each CCP will, in fact, control the hazard they're
intended to control (e.g., a cook time/temperature combination validated
against a recognized process authority, guideline, or in-house challenge
study).

| Product | CCP / preventive control | Validation basis (study, published guidance, process authority letter) | Validated by | Date |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |

Products currently on this plan: ${productListText(products, f)}

## Annual Reassessment Log
Complete one row per reassessment cycle, or sooner upon any of the following
triggers: a new ingredient/supplier, a process or equipment change, a new
product, a recall or significant complaint trend, a CCP deviation trend, or
new regulatory guidance.

| Date | Trigger (annual / event-driven — specify) | Changes identified | Plan updated? (Y/N) | Reviewed by |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |

## Recordkeeping
Validation studies/references and the reassessment log are retained for the
life of the HACCP plan plus [retention period], and made available to
FDA, USDA FSIS, or CFIA upon request.
`,
  },
  {
    key: "corrective_action_verification_records",
    title: "Corrective Action & Verification Records SOP",
    category: "food_safety",
    render: ({ facility: f }) => `# Corrective Action & Verification Records SOP

**Facility:** ${fallback(f.facilityName, "[Facility Name]")}
**Responsible individual:** ${fallback(f.responsibleIndividual, "[Name / Title]")}

## Purpose
Implements Principles 5-7 of the HACCP system as a standalone recordkeeping
procedure: how corrective actions are documented when a critical limit is
not met, and how verification activities (confirming the whole plan is
working as designed) are scheduled, performed, and recorded.

## Corrective Action Procedure
1. When monitoring shows a critical limit has not been met (a "deviation"),
   the responsible party immediately: (a) identifies and isolates/holds any
   product produced while out of control, (b) corrects the cause of the
   deviation, and (c) evaluates the affected product's safety before it is
   released, reworked, or destroyed.
2. Every deviation is logged with: date/time, CCP/step affected, the
   critical limit, the observed value, product affected (lot codes), the
   corrective action taken, disposition of affected product, and who
   performed/approved it.
3. Deviation trends are reviewed at least monthly; a recurring deviation at
   the same CCP triggers a review of whether the critical limit, monitoring
   frequency, or process itself needs to change (feeding into the annual
   reassessment — see HACCP Plan Validation & Reassessment Record).

### Corrective Action Log

| Date/time | CCP / step | Critical limit | Observed value | Product/lot affected | Corrective action taken | Disposition | By |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

## Verification Activities
Verification confirms the plan as a whole is working — it is broader than
the routine monitoring done at each CCP.

1. **Record review:** Monitoring and corrective action records for every CCP
   are reviewed by someone other than the person who performed the
   monitoring, at a defined frequency (at minimum, before the lot ships).
2. **Calibration verification:** Monitoring instruments are calibrated per
   the Preventive Maintenance SOP.
3. **Direct observation:** Periodic direct observation of monitoring
   activities to confirm they're being performed as written.
4. **End-product/environmental testing** (where used as a verification
   tool, not a sole control): results are reviewed against expectations.
5. **Annual reassessment:** See HACCP Plan Validation & Annual Reassessment
   Record.

### Verification Log

| Date | Verification activity | Scope (CCP/plan-wide) | Result | Follow-up needed? | Performed by |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## Recordkeeping
Corrective action and verification records are retained for [retention
period] and are the primary evidence reviewed during an FDA, USDA FSIS, or
CFIA inspection of this HACCP plan.
`,
  },
];

export const SOP_TEMPLATES: SopTemplateDef[] = [...GMP_TEMPLATES, ...FOOD_SAFETY_TEMPLATES];

export function getTemplate(key: string): SopTemplateDef | undefined {
  return SOP_TEMPLATES.find((t) => t.key === key);
}

export function getTemplatesByCategory(category: SopCategory): SopTemplateDef[] {
  return SOP_TEMPLATES.filter((t) => t.category === category);
}
