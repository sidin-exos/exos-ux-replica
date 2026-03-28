import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Header from "@/components/layout/Header";
import PDFPreviewModal from "@/components/reports/pdf/PDFPreviewModal";

const MOCK_ANALYSIS = `## Analysis

The procurement scenario presents a unique intersection between a rapidly scaling B2B SaaS environment and a specific hardware requirement for an industrial sensor housing. While the company's core business is software, the procurement of the custom aluminium housing (ADC12, 850g) suggests a hardware-enabled SaaS model or an IoT integration.

### Cost Driver Breakdown:

1. **Raw Material (ADC12):** At 850g per unit, the raw material cost is a significant portion of the €42.50 quote. Aluminium prices are subject to global market volatility.
2. **Manufacturing & Finishing:** The CNC finishing requirement indicates a medium labor intensity that adds a premium over standard die-casting.
3. **Margin Analysis:** The current supplier's estimated margin of **18-22%** is healthy for the Southern Germany geography. Reducing this to the lower end (18%) or a "best-in-class" **15%** offers immediate savings potential.
4. **Competitive Landscape:** Supplier_B's quote (**€39.80**) provides a critical benchmark. If €39.80 < €42.50, there is clear evidence that the current quote is above market rate for the specified Southern Germany manufacturing zone.

### Strategic Alignment:

The "Balanced" strategy requires weighing cost-savings against the stringent security and compliance needs (SOC2 Type 2, GDPR) mentioned in the industry context. Any vendor—including hardware manufacturers—must be vetted for their ability to integrate into a secure supply chain, especially if the sensors interact with the SaaS platform's data environment.

Confidence Level: High for cost-gap analysis; Moderate for manufacturing overheads due to masked geographic data.

## Recommendations

1. **Price Negotiation (Target: 7–12% Reduction)**
Leverage the €39.80 quote from Supplier_B to challenge the €42.50 pricing. Aim to compress the supplier margin from the estimated 22% toward 17-18%. This aligns with the "Balanced" strategy by maintaining supplier health while approaching the internal target €36.00.

2. **Implement Material Indexing**
Since ADC12 aluminium is a commodity, propose a "Should-Cost" model with a raw material adjustment clause. This protects the company from paying a permanent premium if aluminium prices drop and provides the supplier security against spikes.

3. **Volume-Based Tiering**
Given the Series B "aggressive hiring" and scaling context, provide the supplier with a 12-18 month volume forecast. Negotiate a price step-down once cumulative volume hits specific milestones, reflecting the economies of scale in die-casting.

4. **Compliance-Cost Trade-off**
Verify if the CNC finishing is strictly necessary for functional requirements or if it is aesthetic. If the latter, simplifying the finishing process could reduce labor costs by an estimated **5-8%**.

## Risks

- **Compliance Gap (High Impact):** The hardware vendor may not currently meet the GDPR or SOC2 Type 2 requirements mandated by the SaaS platform's enterprise clients. Failure to secure these certifications could jeopardize the primary software contracts.
- **Geographic Concentration (Medium Impact):** Reliance on Southern Germany for manufacturing may expose the supply chain to regional logistics disruptions or geopolitical shifts.
- **Quality vs. Cost (Medium Impact):** Pushing too close to €39.80 (if significantly lower) might lead the supplier to cut corners on the CNC finishing, resulting in higher failure rates for the industrial sensors.

## Next Steps

1. **Technical Audit:** Confirm if Supplier_B (€39.80) can meet the exact CNC finishing specifications and GDPR compliance.
2. **RFP Refinement:** Issue a formal request for a cost breakdown (Material, Labor, Overhead, Profit) to the current supplier to identify where they exceed the 18% margin floor.
3. **Security Assessment:** Initiate a formal vendor risk assessment for both suppliers to ensure they meet the SOC2 Type 2 and incident response standards required by the core SaaS business.

---

<dashboard-data>{"costWaterfall":{"components":[{"name":"Raw Materials (ADC12)","value":225000,"type":"cost"},{"name":"Labor & CNC Finishing","value":125000,"type":"cost"},{"name":"Overhead","value":85000,"type":"cost"},{"name":"Logistics","value":30000,"type":"cost"},{"name":"Profit Margin","value":35000,"type":"cost"},{"name":"Negotiated Savings","value":45000,"type":"reduction"}],"currency":"€"},"tcoComparison":{"data":[{"year":"Y0","optionA":200000,"optionB":50000,"optionC":80000},{"year":"Y1","optionA":285000,"optionB":220000,"optionC":240000},{"year":"Y2","optionA":370000,"optionB":370000,"optionC":400000},{"year":"Y3","optionA":420000,"optionB":460000,"optionC":520000},{"year":"Y5","optionA":485000,"optionB":520000,"optionC":595000}],"options":[{"id":"optionA","name":"Buy Outright","color":"#4a8a74","totalTCO":485000},{"id":"optionB","name":"3-Year Lease","color":"#6b9e8a","totalTCO":520000},{"id":"optionC","name":"Subscription","color":"#c9a24d","totalTCO":595000}],"currency":"€"}}</dashboard-data>
`;

const MOCK_FORM_DATA: Record<string, string> = {
  "Industry Context":
    "We are a B2B SaaS company providing human resources management solutions to mid-market enterprises (500-5000 employees). We are currently in a Series B growth stage with aggressive hiring plans and expanding to the EU market. Our technology stack is cloud-native, and we require SOC2 Type 2 compliance from all vendors. Recent regulatory changes (GDPR enforcement) have increased our compliance requirements.",
  "Product Specification":
    "Custom aluminium housing for industrial sensor • Material: ADC12 aluminium alloy • Weight: 850g per unit • Manufacturing: Die-casting with CNC finishing • Surface treatment: Anodized • Tolerances: ±0.05mm",
  "Supplier Quote":
    "Supplier quoted price: €42.50 per unit • Minimum order quantity: 1,000 units • Lead time: 6-8 weeks • Payment terms: Net 30 • Tooling cost: €15,000 (one-time) • Location: Southern Germany",
  "Competitor Benchmark": "Supplier_B quote: €39.80 per unit",
  "Target Price": "€36.00 per unit",
  "Strategy": "Balanced — maintain supplier relationship while achieving cost savings",
};

const PdfTestPage = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold text-foreground">
            PDF Formatting Test
          </h1>
          <p className="text-muted-foreground">
            Click the button below to open the PDF preview with mock Cost
            Breakdown Analysis data.
          </p>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => setModalOpen(true)}
          >
            <FileText className="w-5 h-5" />
            Generate PDF Preview
          </Button>
        </div>
      </main>

      <PDFPreviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        scenarioTitle="Cost Breakdown Analysis"
        analysisResult={MOCK_ANALYSIS}
        formData={MOCK_FORM_DATA}
        timestamp={new Date().toISOString()}
        selectedDashboards={["cost-waterfall", "tco-comparison"]}
      />
    </div>
  );
};

export default PdfTestPage;
