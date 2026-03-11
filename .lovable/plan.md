

# Remove Hardcoded Demo Data from PDF Visualizations

## Problem
All 14 PDF dashboard components fall back to hardcoded demo data when no parsed data is available. This causes fake charts (e.g., "$500K Cost Breakdown") to appear alongside real AI analysis text.

## Approach
Gate rendering at the orchestrator level in `PDFDashboardVisuals.tsx`. If the specific data key for a dashboard type is missing from `parsedData`, render a styled "no data" placeholder instead of the component.

## Changes

### 1. `src/components/reports/pdf/PDFDashboardVisuals.tsx`
- Add a mapping from `DashboardType` to `parsedData` key (e.g., `"cost-waterfall"` → `"costWaterfall"`)
- Update `renderDashboard`: before the switch, check if `parsedData?.[key]` exists. If not, return a new `PDFNoDataPlaceholder` component
- New `PDFNoDataPlaceholder`: light gray box with centered text: *"Visualization data could not be extracted automatically. Please refer to the detailed analysis below."* Uses `#f3f4f6` background (light mode) or muted dark bg, `#6b7280` text, Helvetica font

### 2. All 14 dashboard files — remove `default*` constants and fallback branches
Files: `PDFCostWaterfall`, `PDFTCOComparison`, `PDFSensitivityTornado`, `PDFRiskMatrix`, `PDFDecisionMatrix`, `PDFActionChecklist`, `PDFLicenseTier`, `PDFTimelineRoadmap`, `PDFNegotiationPrep`, `PDFDataQuality`, `PDFSupplierScorecard`, `PDFKraljicQuadrant`, `PDFScenarioComparison`, `PDFSOWAnalysis`

Each file:
- Delete the `const default*` arrays
- Change `data` prop from optional to required (since the orchestrator now guarantees data exists)
- Remove ternary fallbacks (e.g., `data?.components ? ... : defaultBreakdown` becomes just the real-data branch)

This ensures: **no parsed data → placeholder shown; parsed data exists → real visualization rendered. Never fake charts.**

