

# Add "Methodology & Limitations" Section to PDF Report

## Changes — single file: `src/components/reports/pdf/PDFReportDocument.tsx`

### 1. New styles in `buildDocStyles`
- `methodologyBox`: Light-bordered container (`borderWidth: 1`, `borderColor: c.border`, `borderRadius: 6`, `padding: 14`, `marginBottom: 12`)
- `methodologySubHeader`: 11pt `Helvetica-Bold`, `color: c.text`, `marginBottom: 6`
- `methodologyText`: 10pt `Helvetica`, `color: c.textMuted`, `lineHeight: 1.5`
- `auditTrail`: 8pt muted text, `marginTop: 10`, `paddingTop: 8`, `borderTopWidth: 0.5`

### 2. Add TOC entry
Update `buildTocEntries` to insert `{ label: "Methodology & Limitations", anchor: "section-methodology" }` before "Data Quality Assessment".

### 3. Move Confidence Score
Relocate the confidence score visualization (coverage bar + badge, lines ~871-884) from the "Data Quality Assessment" section into the new "Methodology & Limitations" section. The Data Quality section keeps only the missing-parameters list and help text.

### 4. New section rendered before "Data Quality Assessment" (before line 854)
Structure:
```text
┌─ Methodology & Limitations ─────────────────────┐
│                                                   │
│ ┌─ Analysis Model ─────────────────────────────┐ │
│ │ Analysis performed by EXOS Sentinel Pipeline  │ │
│ │ using advanced LLM orchestration.             │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ ┌─ Data Sources ───────────────────────────────┐ │
│ │ Sources include global industry benchmarks,   │ │
│ │ real-time commodity pricing, and user-provided│ │
│ │ parameters.                                   │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ ┌─ Confidence Assessment ──────────────────────┐ │
│ │ [coverage bar + badge moved from Data Quality]│ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ ┌─ Limitations ────────────────────────────────┐ │
│ │ • AI-generated — validate with professionals │ │
│ │ • Cost estimates are indicative               │ │
│ │ • Based on available data at time of analysis │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ Analysis ID: {reportHash} | Timestamp: {ISO date}│
└───────────────────────────────────────────────────┘
```

### 5. Simplify Data Quality section
After moving confidence score out, the Data Quality section retains only the missing-parameters chips and help text.

