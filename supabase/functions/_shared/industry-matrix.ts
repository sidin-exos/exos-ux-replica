/**
 * Canonical Industry-Category Compatibility Matrix — Shared Module
 *
 * This is the SINGLE SOURCE OF TRUTH.
 * Client-side copy at src/lib/ai-test-data-generator.ts is for UI reference only.
 *
 * Industry keys = industry_contexts.slug values from DB.
 * Category values = procurement_categories.slug values from DB.
 */

/** Industry → compatible procurement categories (real DB slugs) */
export const INDUSTRY_CATEGORY_MATRIX: Record<string, string[]> = {
  "industrial-manufacturing": [
    "raw-materials-steel-metals", "chemicals-specialty", "plastics-resins",
    "electronic-components", "castings-forgings-machined-parts",
    "mro-maintenance-repair-operations", "packaging-primary",
    "logistics-road-freight", "capital-equipment-industrial-machinery",
    "tooling-dies-moulds", "contract-manufacturing", "utilities-energy",
    "fasteners-springs-fixings", "rubber-elastomers", "adhesives-sealants-coatings",
    "cables-wire-harnesses"
  ],
  "software-it": [
    "cloud-infrastructure-iaas-paas", "it-software-saas", "managed-it-services-msp",
    "cybersecurity-solutions", "professional-services", "it-hardware",
    "telecoms-connectivity-services", "training-education"
  ],
  "healthcare": [
    "medical-devices-clinical-consumables", "pharmaceutical-ingredients-apis",
    "clinical-research-organisation-cro-services", "lab-supplies",
    "scientific-laboratory-equipment-capital", "facilities-management",
    "medical-software-health-it-systems", "professional-services"
  ],
  "retail": [
    "textile-fabrics", "food-ingredients", "packaging-primary",
    "secondary-packaging-labels-print", "logistics-road-freight",
    "last-mile-e-commerce-fulfilment", "marketing-services",
    "facilities-management", "it-software-saas"
  ],
  "professional-services": [
    "professional-services", "corporate-travel", "facilities-management",
    "office-supplies", "managed-it-services-msp", "legal-services",
    "management-consulting-advisory", "training-education",
    "printing-creative-production"
  ],
  "banking-finance": [
    "cloud-infrastructure-iaas-paas", "it-hardware", "professional-services",
    "audit-tax-accounting-services", "facilities-management",
    "cybersecurity-solutions", "management-consulting-advisory",
    "market-research-data-intelligence", "insurance-corporate"
  ],
  "energy-utilities": [
    "capital-equipment-industrial-machinery", "raw-materials-steel-metals",
    "mro-maintenance-repair-operations", "precision-machining-subcontract-engineering",
    "logistics-road-freight", "personal-protective-equipment-ppe",
    "waste-management-recycling", "calibration-testing-inspection-services"
  ],
  "construction-infrastructure": [
    "construction-materials", "raw-materials-steel-metals",
    "capital-equipment-industrial-machinery", "personal-protective-equipment-ppe",
    "logistics-road-freight", "precision-machining-subcontract-engineering",
    "tooling-dies-moulds", "contract-manufacturing"
  ],
  "automotive-oem": [
    "castings-forgings-machined-parts", "electronic-components", "semiconductors",
    "plastics-resins", "rubber-elastomers", "printed-circuit-boards-pcbs",
    "tooling-dies-moulds", "logistics-road-freight", "surface-treatment-plating-coating"
  ],
  "pharma-life-sciences": [
    "pharmaceutical-ingredients-apis", "lab-supplies",
    "scientific-laboratory-equipment-capital",
    "clinical-research-organisation-cro-services",
    "packaging-primary", "cold-chain-logistics",
    "calibration-testing-inspection-services", "medical-software-health-it-systems"
  ],
  "food-beverage": [
    "food-ingredients", "packaging-primary", "secondary-packaging-labels-print",
    "cold-chain-logistics", "logistics-road-freight", "utilities-energy",
    "catering-workplace-food-services", "waste-management-recycling"
  ],
  "electronics": [
    "electronic-components", "semiconductors", "printed-circuit-boards-pcbs",
    "cables-wire-harnesses", "plastics-resins", "contract-manufacturing",
    "tooling-dies-moulds", "packaging-primary"
  ],
  "telecom": [
    "telecom-equipment", "telecoms-connectivity-services",
    "cloud-infrastructure-iaas-paas", "cybersecurity-solutions",
    "it-hardware", "managed-it-services-msp", "cables-wire-harnesses"
  ],
  "aerospace-defense": [
    "castings-forgings-machined-parts", "electronic-components",
    "precision-machining-subcontract-engineering", "adhesives-sealants-coatings",
    "calibration-testing-inspection-services", "capital-equipment-industrial-machinery",
    "surface-treatment-plating-coating"
  ],
  "fmcg-cpg": [
    "packaging-primary", "secondary-packaging-labels-print", "food-ingredients",
    "cosmetics-personal-care-ingredients", "marketing-services",
    "logistics-road-freight", "last-mile-e-commerce-fulfilment"
  ],
};

/** Core category KPIs that must align with generated data (real DB slugs) */
export const CATEGORY_KPIS: Record<string, string[]> = {
  "raw-materials-steel-metals": ["Price volatility (%)", "Lead time reliability", "Quality defect rate (PPM)"],
  "managed-it-services-msp": ["SLA compliance (%)", "Ticket resolution time", "System uptime (%)"],
  "professional-services": ["Billable utilization (%)", "Project delivery on-time", "Client satisfaction"],
  "logistics-road-freight": ["On-time delivery (%)", "Damage rate (%)", "Cost per unit shipped"],
  "capital-equipment-industrial-machinery": ["Uptime (%)", "Maintenance cost ratio", "ROI period (months)"],
  "cloud-infrastructure-iaas-paas": ["Availability (%)", "Cost per compute unit", "Egress cost ratio"],
  "electronic-components": ["Defect rate (PPM)", "Lead time (weeks)", "EOL risk exposure"],
  "pharmaceutical-ingredients-apis": ["Purity (%)", "Regulatory compliance rate", "Supplier audit score"],
};

/** Check if an industry-category pair is compatible */
export function validateIndustryCategoryPair(
  industry: string,
  category: string
): boolean {
  const compatible = INDUSTRY_CATEGORY_MATRIX[industry];
  if (!compatible) return true; // Unknown industry — allow anything
  return compatible.includes(category);
}

/** Get compatible categories for an industry */
export function getCompatibleCategories(industry: string): string[] {
  return INDUSTRY_CATEGORY_MATRIX[industry] || [];
}
