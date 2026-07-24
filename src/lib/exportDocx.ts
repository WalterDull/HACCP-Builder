import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableLayoutType,
  TextRun,
  TableOfContents,
  Footer,
  PageNumber,
  AlignmentType,
} from "docx";
import type {
  Plan,
  Product,
  ProcessStep,
  Hazard,
  Sop,
  RecallContact,
  MockRecallRecord,
  Vendor,
  Ingredient,
  HaccpTeamMember,
} from "@prisma/client";
import type { FacilityProfile } from "@/types";
import { getTemplate } from "@/lib/sopTemplates";
import { REGULATORY_SCOPE_OPTIONS } from "@/types";

type PlanWithRelations = Plan & {
  products: (Product & {
    processSteps: (ProcessStep & { hazards: Hazard[] })[];
    ingredients: Ingredient[];
  })[];
  vendors: Vendor[];
  sops: Sop[];
  recallContacts: RecallContact[];
  mockRecallRecords: MockRecallRecord[];
  haccpTeamMembers: HaccpTeamMember[];
};

function regulatoryScopeLabel(value: string): string {
  return REGULATORY_SCOPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

const CONTENT_WIDTH_DXA = 9360;

function pctToDxa(pcts: number[]): number[] {
  return pcts.map((p) => Math.round((CONTENT_WIDTH_DXA * p) / 100));
}

function cell(text: string, opts: { bold?: boolean; widthDxa?: number } = {}) {
  return new TableCell({
    width: opts.widthDxa ? { size: opts.widthDxa, type: WidthType.DXA } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold })] })],
  });
}

function headerRow(labels: string[], widthsDxa: number[]) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) => cell(l, { bold: true, widthDxa: widthsDxa[i] })),
  });
}

function dataRow(values: string[], widthsDxa: number[]) {
  return new TableRow({ children: values.map((v, i) => cell(v, { widthDxa: widthsDxa[i] })) });
}

function makeTable(widthsDxa: number[], rows: TableRow[]): Table {
  return new Table({
    rows,
    columnWidths: widthsDxa,
    layout: TableLayoutType.FIXED,
    width: { size: widthsDxa.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  });
}

const HEADING_BY_LEVEL = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
];

function headingForLevel(level: number) {
  return HEADING_BY_LEVEL[Math.min(Math.max(level, 1), 6) - 1];
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, pageBreakBefore: true });
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|");
}

function isSeparatorRow(line: string): boolean {
  const t = line.trim();
  return /^\|?[\s:|-]*-[\s:|-]*$/.test(t) && t.includes("-");
}

function parseCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function markdownToBlocks(md: string, demote = 0): (Paragraph | Table)[] {
  const lines = md.split("\n");
  const blocks: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isTableRow(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const header = parseCells(line);
      const bodyLines: string[] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j]) && !isSeparatorRow(lines[j])) {
        bodyLines.push(lines[j]);
        j++;
      }
      const ncols = header.length;
      const widths = pctToDxa(Array.from({ length: ncols }, () => 100 / ncols));
      const rows = [
        headerRow(header, widths),
        ...bodyLines.map((bl) => {
          const cells = parseCells(bl);
          while (cells.length < ncols) cells.push("");
          return dataRow(cells.slice(0, ncols), widths);
        }),
      ];
      blocks.push(makeTable(widths, rows));
      i = j;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(new Paragraph({ text: line.replace("# ", ""), heading: headingForLevel(1 + demote) }));
    } else if (line.startsWith("## ")) {
      blocks.push(new Paragraph({ text: line.replace("## ", ""), heading: headingForLevel(2 + demote) }));
    } else if (line.startsWith("### ")) {
      blocks.push(new Paragraph({ text: line.replace("### ", ""), heading: headingForLevel(3 + demote) }));
    } else if (line.trim().length === 0) {
      blocks.push(new Paragraph({ text: "" }));
    } else {
      blocks.push(new Paragraph({ text: line }));
    }
    i++;
  }

  return blocks;
}

export async function buildPlanDocx(plan: PlanWithRelations): Promise<Buffer> {
  const facility: Partial<FacilityProfile> = plan.facilityProfile ? JSON.parse(plan.facilityProfile) : {};
  const products = [...plan.products].sort((a, b) => a.order - b.order);
  const team = [...plan.haccpTeamMembers].sort((a, b) => a.order - b.order);

  const children: (Paragraph | Table | TableOfContents)[] = [];

  // --- Title page + index --------------------------------------------------
  children.push(
    new Paragraph({ text: "HACCP Plan", heading: HeadingLevel.TITLE }),
    new Paragraph({ text: plan.name, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            "Built on the Codex Alimentarius / NACMCF HACCP structure (5 Preliminary Steps, 7 Principles). See the Regulatory Basis note in each section for the specific US (FDA/USDA FSIS) and Canadian (CFIA) citations that apply to this facility's scope.",
          italics: true,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Contents", bold: true, size: 28 })] }),
    new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" })
  );

  // --- 1. Facility Profile -------------------------------------------------
  children.push(
    sectionHeading("1. Facility Profile"),
    new Paragraph({ text: `Facility name: ${facility.facilityName ?? ""}` }),
    new Paragraph({ text: `Address: ${facility.address ?? ""}` }),
    new Paragraph({ text: `Food categories: ${facility.foodCategories ?? ""}` }),
    new Paragraph({
      text: `Regulatory scope(s): ${
        (facility.regulatoryScopes ?? []).map(regulatoryScopeLabel).join("; ") || ""
      }`,
    }),
    new Paragraph({ text: `CFIA licence number: ${facility.cfiaLicenseNumber ?? ""}` }),
    new Paragraph({ text: `FDA registration number: ${facility.fdaRegistrationNumber ?? ""}` }),
    new Paragraph({
      text: `Responsible individual / HACCP team leader: ${facility.responsibleIndividual ?? ""} (${
        facility.responsibleIndividualContact ?? ""
      })`,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            "If this facility processes seafood, juice, or meat/poultry, this plan must additionally satisfy that sector's specific regulation (21 CFR 123, 21 CFR 120, or 9 CFR 417 respectively) on top of the general HACCP structure used throughout this document.",
          italics: true,
        }),
      ],
    })
  );

  // --- 2. Preliminary Step 1: HACCP Team -----------------------------------
  children.push(sectionHeading("2. HACCP Team (Preliminary Step 1)"));
  if (team.length === 0) {
    children.push(new Paragraph({ text: "No HACCP team members have been added yet." }));
  } else {
    const teamWidths = pctToDxa([20, 20, 25, 35]);
    const rows = [
      headerRow(["Name", "Role", "Expertise", "Responsibilities"], teamWidths),
      ...team.map((m) =>
        dataRow([m.name, m.role ?? "—", m.expertise ?? "—", m.responsibilities ?? "—"], teamWidths)
      ),
    ];
    children.push(makeTable(teamWidths, rows));
  }
  children.push(new Paragraph({ text: "" }));

  // --- 3. Products (Preliminary Steps 2 & 3) -------------------------------
  children.push(sectionHeading("3. Products (Preliminary Steps 2 & 3)"));
  if (products.length === 0) {
    children.push(new Paragraph({ text: "No products have been added to this plan yet." }));
  } else {
    for (const p of products) {
      children.push(new Paragraph({ text: p.name, heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ text: `Product description & distribution: ${p.productDescription ?? ""}` }));
      children.push(new Paragraph({ text: `Intended use: ${p.intendedUse ?? ""}` }));
      children.push(new Paragraph({ text: `Intended consumer: ${p.intendedConsumer ?? ""}` }));
      children.push(new Paragraph({ text: `Packaging type: ${p.packagingType ?? ""}` }));
      children.push(new Paragraph({ text: `Shelf life & storage: ${p.shelfLifeAndStorage ?? ""}` }));
      children.push(new Paragraph({ text: "" }));
    }
  }

  // --- 4. Approved Suppliers ------------------------------------------------
  children.push(sectionHeading("4. Approved Suppliers"));
  const vendors = [...plan.vendors].sort((a, b) => a.order - b.order);
  if (vendors.length === 0) {
    children.push(new Paragraph({ text: "No vendors/suppliers have been added to this plan yet." }));
  } else {
    const vendorWidths = pctToDxa([20, 26, 12, 14, 14, 14]);
    const rows = [
      headerRow(["Vendor", "Materials supplied", "Status", "Certification", "Guarantee", "Contact"], vendorWidths),
      ...vendors.map((v) =>
        dataRow(
          [
            v.name,
            v.materialsSupplied ?? "—",
            v.status,
            v.certification ?? "—",
            v.guaranteeOnFile ? `Yes${v.guaranteeExpiry ? ` (exp. ${v.guaranteeExpiry})` : ""}` : "No",
            [v.contactName, v.phone, v.email].filter(Boolean).join(", ") || "—",
          ],
          vendorWidths
        )
      ),
    ];
    children.push(makeTable(vendorWidths, rows));
  }
  children.push(new Paragraph({ text: "" }));

  // --- 5. GMPs & Prerequisite Programs --------------------------------------
  children.push(sectionHeading("5. GMPs & Prerequisite Programs"));
  const gmpSops = plan.sops.filter((s) => getTemplate(s.templateKey)?.category === "gmp");
  if (gmpSops.length === 0) {
    children.push(new Paragraph({ text: "No GMP / prerequisite program documents have been generated yet." }));
  } else {
    for (const sop of gmpSops) {
      children.push(...markdownToBlocks(sop.content, 1));
      children.push(new Paragraph({ text: "" }));
    }
  }

  // --- 6. Process Flow & Formulations (Preliminary Steps 4 & 5) -----------
  children.push(sectionHeading("6. Process Flow & Formulations (Preliminary Steps 4 & 5)"));

  for (const product of products) {
    children.push(new Paragraph({ text: product.name, heading: HeadingLevel.HEADING_2 }));

    const steps = [...product.processSteps].sort((a, b) => a.order - b.order);
    if (steps.length === 0) {
      children.push(new Paragraph({ text: "No process steps recorded for this product." }));
    } else {
      const stepWidths = pctToDxa([12, 30, 58]);
      const rows = [
        headerRow(["Step #", "Name", "Description"], stepWidths),
        ...steps.map((s) => dataRow([String(s.order), s.name, s.description ?? "—"], stepWidths)),
      ];
      children.push(makeTable(stepWidths, rows));
    }
    children.push(new Paragraph({ text: "" }));

    children.push(new Paragraph({ text: "Preliminary Step 5 — on-site confirmation of flow diagram:" }));
    children.push(
      new Paragraph({
        text: product.flowConfirmedAt
          ? `Confirmed by ${product.flowConfirmedBy ?? "—"} on ${product.flowConfirmedAt.toLocaleDateString(
              "en-US"
            )}. ${product.flowConfirmationNotes ?? ""}`.trim()
          : "Not yet confirmed on-site — before finalizing this plan, walk the actual production floor and confirm the flow diagram above matches what happens in practice.",
      })
    );
    children.push(new Paragraph({ text: "" }));

    const ingredients = [...product.ingredients].sort((a, b) => a.order - b.order);
    children.push(new Paragraph({ text: "Formulation", heading: HeadingLevel.HEADING_3 }));
    if (ingredients.length === 0) {
      children.push(new Paragraph({ text: "No ingredients recorded for this product." }));
    } else {
      const ingWidths = pctToDxa([22, 12, 18, 14, 10, 24]);
      const rows = [
        headerRow(
          ["Ingredient", "% of formulation", "Functional role", "Country of origin", "Allergen?", "Allergen type"],
          ingWidths
        ),
        ...ingredients.map((i) =>
          dataRow(
            [
              i.name,
              i.percentageOfFormulation ?? "—",
              i.functionalRole ?? "—",
              i.countryOfOrigin ?? "—",
              i.isAllergen ? "Yes" : "No",
              i.allergenType ?? "—",
            ],
            ingWidths
          )
        ),
      ];
      children.push(makeTable(ingWidths, rows));
    }
    children.push(new Paragraph({ text: "" }));
  }

  // --- 7. Hazard Analysis & CCP Determination (Principles 1 & 2) ----------
  children.push(sectionHeading("7. Hazard Analysis & CCP Determination (Principles 1 & 2)"));

  for (const product of products) {
    const steps = [...product.processSteps].sort((a, b) => a.order - b.order);
    if (steps.length === 0) continue;
    children.push(new Paragraph({ text: product.name, heading: HeadingLevel.HEADING_2 }));

    for (const step of steps) {
      children.push(new Paragraph({ text: `Step ${step.order}: ${step.name}` }));
      if (step.hazards.length === 0) {
        children.push(new Paragraph({ text: "No hazards recorded for this step." }));
        continue;
      }
      const hazardWidths = pctToDxa([12, 26, 8, 12, 20, 22]);
      const rows = [
        headerRow(["Hazard type", "Description", "Sig.?", "CCP status", "Critical limit", "Monitoring"], hazardWidths),
        ...step.hazards.map((h) =>
          dataRow(
            [
              h.type,
              h.description,
              h.requiresPreventiveControl ? "Yes" : "No",
              h.ccpStatus,
              h.criticalLimit ?? "—",
              h.monitoringProcedure ?? "—",
            ],
            hazardWidths
          )
        ),
      ];
      children.push(makeTable(hazardWidths, rows));
      children.push(new Paragraph({ text: "" }));
    }
  }

  // --- 8. Preventive Controls Detail (Principles 3-7) ----------------------
  children.push(sectionHeading("8. Preventive Controls Detail (Principles 3-7)"));
  const anyCcps = products.some((p) =>
    p.processSteps.some((s) => s.hazards.some((h) => h.ccpStatus === "CCP" || h.ccpStatus === "PRW"))
  );
  if (!anyCcps) {
    children.push(new Paragraph({ text: "No critical control points or process preventive controls have been designated yet." }));
  } else {
    for (const product of products) {
      const ccpHazards = product.processSteps.flatMap((s) =>
        s.hazards.filter((h) => h.ccpStatus === "CCP" || h.ccpStatus === "PRW")
      );
      if (ccpHazards.length === 0) continue;

      children.push(new Paragraph({ text: product.name, heading: HeadingLevel.HEADING_2 }));
      for (const h of ccpHazards) {
        children.push(new Paragraph({ text: h.description, heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: `Status: ${h.ccpStatus}` }));
        children.push(new Paragraph({ text: `Critical limit (Principle 3): ${h.criticalLimit ?? "—"}` }));
        children.push(new Paragraph({ text: `Monitoring procedure (Principle 4): ${h.monitoringProcedure ?? "—"}` }));
        children.push(new Paragraph({ text: `Monitoring frequency: ${h.monitoringFrequency ?? "—"}` }));
        children.push(new Paragraph({ text: `Corrective action (Principle 5): ${h.correctionAction ?? "—"}` }));
        children.push(new Paragraph({ text: `Verification procedure (Principle 6): ${h.verificationProcedure ?? "—"}` }));
        children.push(new Paragraph({ text: `Recordkeeping (Principle 7): ${h.recordkeepingProcedure ?? "—"}` }));
        children.push(new Paragraph({ text: `Responsible party: ${h.responsibleParty ?? "—"}` }));
        children.push(new Paragraph({ text: "" }));
      }
    }
  }

  // --- 9. Recall Plan --------------------------------------------------------
  children.push(sectionHeading("9. Recall Plan"));

  children.push(new Paragraph({ text: "Recall Team", heading: HeadingLevel.HEADING_2 }));
  if (plan.recallContacts.length === 0) {
    children.push(new Paragraph({ text: "No recall team members have been assigned yet." }));
  } else {
    const contactWidths = pctToDxa([25, 25, 20, 30]);
    const rows = [
      headerRow(["Role", "Name", "Phone", "Email"], contactWidths),
      ...plan.recallContacts.map((c) => dataRow([c.role, c.name, c.phone ?? "—", c.email ?? "—"], contactWidths)),
    ];
    children.push(makeTable(contactWidths, rows));
  }
  children.push(new Paragraph({ text: "" }));

  children.push(new Paragraph({ text: "Mock Recall Log (Annual)", heading: HeadingLevel.HEADING_2 }));
  if (plan.mockRecallRecords.length === 0) {
    children.push(
      new Paragraph({
        text: "No mock recall is on file yet. Both FDA/USDA FSIS and CFIA expect one to be performed and documented at least annually.",
      })
    );
  } else {
    const mockWidths = pctToDxa([15, 20, 15, 50]);
    const rows = [
      headerRow(["Date", "Performed by", "% traced", "Results summary"], mockWidths),
      ...[...plan.mockRecallRecords]
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())
        .map((r) =>
          dataRow(
            [r.performedAt.toLocaleDateString("en-US"), r.performedBy ?? "—", r.percentTraced ?? "—", r.resultsSummary ?? "—"],
            mockWidths
          )
        ),
    ];
    children.push(makeTable(mockWidths, rows));
  }
  children.push(new Paragraph({ text: "" }));

  const recallSop = plan.sops.find((s) => s.templateKey === "recall");
  if (recallSop) {
    children.push(...markdownToBlocks(recallSop.content, 1));
    children.push(new Paragraph({ text: "" }));
  }

  // --- 10. Food Safety SOPs --------------------------------------------------
  children.push(sectionHeading("10. Food Safety SOPs"));
  const foodSafetySops = plan.sops.filter((s) => getTemplate(s.templateKey)?.category === "food_safety");
  if (foodSafetySops.length === 0) {
    children.push(new Paragraph({ text: "No additional food safety SOPs have been generated yet." }));
  } else {
    for (const sop of foodSafetySops) {
      children.push(...markdownToBlocks(sop.content, 1));
      children.push(new Paragraph({ text: "" }));
    }
  }

  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({
      text:
        "This document was drafted with the assistance of HACCP-Builder and should be reviewed and signed off by the individual(s) responsible for food safety at your facility — and, where applicable, a qualified HACCP consultant — before use.",
    })
  );

  const doc = new Document({
    features: { updateFields: true },
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun("Page "),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun(" of "),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
