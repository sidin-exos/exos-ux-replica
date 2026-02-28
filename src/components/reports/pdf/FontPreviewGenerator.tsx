import { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

// EXOS brand colors
const C = {
  navy: "#0a1628",
  surface: "#111d33",
  teal: "#2dd4bf",
  tealDark: "#14b8a6",
  white: "#e2e8f0",
  muted: "#94a3b8",
  border: "#1e3a5f",
};

// --- Font Option Configs ---
interface FontConfig {
  label: string;
  tag: string;
  header: string;
  body: string;
  data: string;
  description: string;
}

const fontOptions: FontConfig[] = [
  {
    label: "Option A: Helvetica Pure",
    tag: "A",
    header: "Helvetica-Bold",
    body: "Helvetica",
    data: "Helvetica",
    description: "Clean sans-serif throughout — modern corporate look",
  },
  {
    label: "Option B: Helvetica + Times",
    tag: "B",
    header: "Helvetica-Bold",
    body: "Times-Roman",
    data: "Times-Roman",
    description: "Sans headers + serif body — classic consulting report feel",
  },
  {
    label: "Option C: Helvetica + Courier Data",
    tag: "C",
    header: "Helvetica-Bold",
    body: "Helvetica",
    data: "Courier",
    description: "Sans prose, monospace for numbers/tables — technical precision",
  },
];

// Sample data
const sampleBullets = [
  "We recommend consolidating from 4 suppliers to 2 strategic partners, reducing management overhead by 35% while maintaining supply resilience.",
  "Total Cost of Ownership analysis indicates a potential annual saving of $2.4M through renegotiated volume discounts and standardized SLAs.",
  "Risk assessment reveals critical single-source dependency in Category B — suggest qualifying a secondary supplier within 90 days.",
];

const sampleTable = [
  { supplier: "Acme Corp", score: "87.3", spend: "$4,250,000" },
  { supplier: "GlobalTech Ltd", score: "72.1", spend: "$2,180,000" },
  { supplier: "NovaParts Inc", score: "91.5", spend: "$1,920,000" },
  { supplier: "Precision Mfg", score: "65.8", spend: "$3,410,000" },
];

const makeStyles = (fc: FontConfig) =>
  StyleSheet.create({
    page: {
      backgroundColor: C.navy,
      padding: 40,
      position: "relative",
    },
    accent: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 6,
      height: "100%",
      backgroundColor: C.teal,
    },
    header: {
      marginBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      paddingBottom: 16,
    },
    brand: {
      fontFamily: fc.header,
      fontSize: 26,
      color: C.teal,
      marginBottom: 4,
    },
    tagline: {
      fontFamily: fc.body,
      fontSize: 10,
      color: C.muted,
      letterSpacing: 3,
    },
    fontLabel: {
      fontFamily: fc.body,
      fontSize: 11,
      color: C.tealDark,
      marginTop: 8,
      padding: 4,
      backgroundColor: C.surface,
      borderRadius: 2,
    },
    sectionTitle: {
      fontFamily: fc.header,
      fontSize: 17,
      color: C.white,
      marginBottom: 12,
      marginTop: 20,
    },
    bullet: {
      flexDirection: "row",
      marginBottom: 8,
      paddingLeft: 4,
    },
    bulletDot: {
      fontFamily: fc.body,
      fontSize: 12,
      color: C.teal,
      marginRight: 8,
      marginTop: 1,
    },
    bulletText: {
      fontFamily: fc.body,
      fontSize: 12,
      color: C.white,
      flex: 1,
      lineHeight: 1.5,
    },
    // Table
    tableContainer: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 4,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      padding: 8,
    },
    tableHeaderCell: {
      fontFamily: fc.header,
      fontSize: 11,
      color: C.teal,
      flex: 1,
    },
    tableRow: {
      flexDirection: "row",
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    tableCellName: {
      fontFamily: fc.body,
      fontSize: 11,
      color: C.white,
      flex: 1,
    },
    tableCellData: {
      fontFamily: fc.data,
      fontSize: 11,
      color: C.white,
      flex: 1,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      textAlign: "center",
    },
    footerText: {
      fontFamily: fc.body,
      fontSize: 8,
      color: C.muted,
      opacity: 0.5,
    },
  });

const SampleDocument = ({ config }: { config: FontConfig }) => {
  const s = makeStyles(config);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accent} />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>EXOS</Text>
          <Text style={s.tagline}>YOUR PROCUREMENT EXOSKELETON</Text>
          <Text style={s.fontLabel}>
            {config.label} — Headers: {config.header} | Body: {config.body} | Data: {config.data}
          </Text>
        </View>

        {/* Executive Summary */}
        <Text style={s.sectionTitle}>Executive Summary</Text>
        {sampleBullets.map((b, i) => (
          <View key={i} style={s.bullet}>
            <Text style={s.bulletDot}>●</Text>
            <Text style={s.bulletText}>{b}</Text>
          </View>
        ))}

        {/* Supplier Table */}
        <Text style={s.sectionTitle}>Supplier Performance Scorecard</Text>
        <View style={s.tableContainer}>
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderCell}>Supplier</Text>
            <Text style={s.tableHeaderCell}>Score</Text>
            <Text style={s.tableHeaderCell}>Annual Spend</Text>
          </View>
          {sampleTable.map((row, i) => (
            <View key={i} style={[s.tableRow, i === sampleTable.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.tableCellName}>{row.supplier}</Text>
              <Text style={s.tableCellData}>{row.score}</Text>
              <Text style={s.tableCellData}>{row.spend}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Powered by EXOS Procurement Intelligence</Text>
        </View>
      </Page>
    </Document>
  );
};

// --- Download Component ---
const FontPreviewGenerator = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async (config: FontConfig) => {
    setLoading(config.tag);
    try {
      const doc = <SampleDocument config={config} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EXOS_Font_Preview_${config.tag}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Preview Fonts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Font Comparison</DialogTitle>
          <DialogDescription>
            Download 3 sample PDFs to compare font options side-by-side.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {fontOptions.map((fc) => (
            <div
              key={fc.tag}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{fc.label}</p>
                <p className="text-xs text-muted-foreground">{fc.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(fc)}
                disabled={loading !== null}
                className="ml-3 shrink-0"
              >
                {loading === fc.tag ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FontPreviewGenerator;
