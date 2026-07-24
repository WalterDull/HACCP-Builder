// Central SEO constants. Set NEXT_PUBLIC_SITE_URL in your environment once
// deployed (e.g. https://haccp-builder.onrender.com) — every piece of
// metadata, the sitemap, robots.txt, and the JSON-LD structured data below
// all derive from this single value.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haccp-builder.onrender.com").replace(/\/$/, "");

export const SITE_NAME = "HACCP-Builder";

export const SITE_TITLE = "HACCP-Builder — HACCP Plan Builder for US & Canadian Food Facilities";

export const SITE_DESCRIPTION =
  "Build a formal HACCP plan (Codex/NACMCF 5 Preliminary Steps + 7 Principles) for any food facility: hazard analysis, CCP determination, formulations & allergen control, recall planning, and an audit-ready export — satisfying FDA HARPC (21 CFR 117), FDA seafood/juice HACCP, USDA FSIS HACCP, and CFIA/SFCR preventive control requirements.";

export const SITE_KEYWORDS = [
  "HACCP",
  "HACCP plan builder",
  "HACCP software",
  "hazard analysis",
  "critical control point",
  "CCP determination",
  "Codex Alimentarius",
  "NACMCF",
  "FSMA",
  "HARPC",
  "21 CFR 117",
  "21 CFR 123",
  "21 CFR 120",
  "9 CFR 417",
  "FDA food safety plan",
  "USDA FSIS HACCP",
  "CFIA",
  "Safe Food for Canadians Regulations",
  "SFCR",
  "preventive control plan",
  "food safety plan",
  "allergen control",
  "food recall plan",
];
