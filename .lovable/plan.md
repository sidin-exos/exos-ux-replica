
# Deep Analysis UI & Graph Visualization

## Overview

Add a "Deep Analysis (Beta)" button to the GenericScenarioWizard that invokes the LangGraph pipeline (`runExosGraph`) and visualizes the 4-step reasoning process in real-time. Display the result with confidence scoring and validation status.

---

## Architecture

### Approach: Simulated Step Progress with Real Graph Execution

Since `runExosGraph` is a blocking async call (no streaming), we'll use a **simulated progress** approach:
- Start a timer-based step animation when deep analysis begins
- The actual graph runs in the background
- When the graph completes, snap to "completed" state and show results

This provides a responsive UI while the ~10-15 second LangGraph pipeline executes.

---

## Files to Create

### 1. Pipeline Progress Component
**File:** `src/components/analysis/DeepAnalysisPipeline.tsx`

**Purpose:** Visualizes the 4-step LangGraph pipeline with animated step progression.

**UI Specs:**
| Step | Icon | Label | Description |
|------|------|-------|-------------|
| 1 | Shield | Sentinel Layer | Anonymizing sensitive entities |
| 2 | BrainCircuit | AI Reasoning | Generating strategic insights |
| 3 | Scale | Validation Loop | Checking for hallucinations |
| 4 | Unlock | Deanonymization | Restoring real data context |

**Props:**
```typescript
interface DeepAnalysisPipelineProps {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStepIndex: number;
  errorMessage?: string;
}
```

**Visual Design:**
- Vertical step list with icons
- Active step has pulsing animation (framer-motion)
- Completed steps show green checkmark
- Error state shows red styling with error message
- Progress bar at bottom

### 2. Deep Analysis Result View
**File:** `src/components/analysis/DeepAnalysisResult.tsx`

**Purpose:** Displays the LangGraph output with confidence scoring and validation badges.

**UI Specs:**
- Distinctive card with gradient border (purple/blue accent for "Pro" feel)
- Header: "Deep Reasoning Engine Output" with BrainCircuit icon
- Badges row:
  - Confidence Score (e.g., "85% Confidence")
  - Validation Status (Approved/Rejected badge)
  - Retry Count (if > 0)
- Content: Markdown-formatted `finalAnswer` with scroll area
- Footer disclaimer: "Generated via EXOS Autonomous Graph"

**Props:**
```typescript
interface DeepAnalysisResultProps {
  result: {
    finalAnswer: string;
    confidenceScore: number;
    validationStatus: 'pending' | 'approved' | 'rejected';
    retryCount: number;
  };
  onStartOver: () => void;
  onGenerateReport: () => void;
}
```

---

## Files to Modify

### 1. GenericScenarioWizard.tsx

**New State:**
```typescript
// Deep Analysis state
const [isDeepAnalysisRunning, setIsDeepAnalysisRunning] = useState(false);
const [deepAnalysisStep, setDeepAnalysisStep] = useState(0);
const [deepAnalysisResult, setDeepAnalysisResult] = useState<{
  finalAnswer: string;
  confidenceScore: number;
  validationStatus: 'pending' | 'approved' | 'rejected';
  retryCount: number;
} | null>(null);
const [deepAnalysisError, setDeepAnalysisError] = useState<string | null>(null);
```

**New Handler: `handleDeepAnalysis`**
```typescript
const handleDeepAnalysis = async () => {
  setStep("analyzing");
  setIsDeepAnalysisRunning(true);
  setDeepAnalysisStep(0);
  setDeepAnalysisResult(null);
  setDeepAnalysisError(null);
  
  // Start simulated step progress (4 steps, ~3-4s each)
  const stepIntervals = [3500, 4000, 3000, 2500]; // ms per step
  let currentStep = 0;
  const progressInterval = setInterval(() => {
    if (currentStep < 3) {
      currentStep++;
      setDeepAnalysisStep(currentStep);
    }
  }, stepIntervals[currentStep] || 3500);
  
  try {
    // Build query from form data
    const queryText = Object.entries(formData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    const result = await runExosGraph(queryText, {
      provider: configProvider,
      model: configModel,
    });
    
    clearInterval(progressInterval);
    setDeepAnalysisStep(4); // Complete all steps
    setDeepAnalysisResult(result);
    setStep("results");
    toast.success("Deep Analysis complete!");
  } catch (err) {
    clearInterval(progressInterval);
    setDeepAnalysisError(err instanceof Error ? err.message : "Analysis failed");
    setStep("review");
    toast.error("Deep Analysis failed");
  } finally {
    setIsDeepAnalysisRunning(false);
  }
};
```

**UI Changes in Review Step:**

Add a second button next to "Analyze with AI":
```tsx
<div className="flex gap-3">
  <Button variant="hero" size="lg" onClick={handleAnalyze} disabled={!canProceed}>
    <Sparkles className="w-4 h-4" />
    Analyze with AI
  </Button>
  <Button 
    variant="outline" 
    size="lg" 
    onClick={handleDeepAnalysis} 
    disabled={!canProceed || isDeepAnalysisRunning}
    className="gap-2 border-purple-500/50 hover:bg-purple-500/10"
  >
    <BrainCircuit className="w-4 h-4" />
    Deep Analysis
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">BETA</Badge>
  </Button>
</div>
```

**UI Changes in Analyzing Step:**

Conditionally render the pipeline visualization:
```tsx
{step === "analyzing" && (
  <motion.div>
    {isDeepAnalysisRunning ? (
      <DeepAnalysisPipeline 
        status="running" 
        currentStepIndex={deepAnalysisStep} 
      />
    ) : (
      <AnalysisPipelineAnimation isProcessing={isProcessing} currentApiStage={currentStage} />
    )}
  </motion.div>
)}
```

**UI Changes in Results Step:**

Show Deep Analysis result if available:
```tsx
{step === "results" && (
  <motion.div>
    {deepAnalysisResult ? (
      <DeepAnalysisResult 
        result={deepAnalysisResult}
        onStartOver={() => {
          setDeepAnalysisResult(null);
          setStep("input");
        }}
        onGenerateReport={handleGenerateReport}
      />
    ) : (
      // Existing standard result UI
    )}
  </motion.div>
)}
```

---

## New Imports Required

```typescript
// GenericScenarioWizard.tsx
import { BrainCircuit } from "lucide-react";
import { runExosGraph } from "@/lib/ai/graph";
import { DeepAnalysisPipeline } from "@/components/analysis/DeepAnalysisPipeline";
import { DeepAnalysisResult } from "@/components/analysis/DeepAnalysisResult";
```

---

## Component Visual Layout

### DeepAnalysisPipeline
```text
┌──────────────────────────────────────────────────┐
│  🛡️ Sentinel Layer                              │
│     Anonymizing sensitive entities        ✓     │
├──────────────────────────────────────────────────┤
│  🧠 AI Reasoning            ← current (pulsing) │
│     Generating strategic insights   ● ● ●       │
├──────────────────────────────────────────────────┤
│  ⚖️ Validation Loop                   (dimmed)  │
│     Checking for hallucinations                 │
├──────────────────────────────────────────────────┤
│  🔓 Deanonymization                   (dimmed)  │
│     Restoring real data context                 │
└──────────────────────────────────────────────────┘
│████████████░░░░░░░░░░░░░░░░░░░░│ 50%
```

### DeepAnalysisResult
```text
┌─────────────────────────────────────────────────────────────┐
│  ┌─ Deep Reasoning Engine Output ────────────────────────┐  │
│  │                                                        │  │
│  │  [85% Confidence] [✓ Approved] [0 Retries]            │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  ## Strategic Analysis                          │  │  │
│  │  │                                                 │  │  │
│  │  │  Based on the provided procurement data...      │  │  │
│  │  │  ...                                            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ℹ️ Generated via EXOS Autonomous Graph               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [← Start Over]                      [Generate Report →]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Styling Notes

- **DeepAnalysisResult card**: Use gradient border with purple/blue tones
  ```css
  border-image: linear-gradient(135deg, #8b5cf6, #3b82f6) 1;
  ```
  Or use pseudo-element approach for rounded corners

- **Badge colors**:
  - Confidence >= 70%: `bg-green-500/20 text-green-600`
  - Confidence 50-69%: `bg-yellow-500/20 text-yellow-600`
  - Confidence < 50%: `bg-red-500/20 text-red-600`
  - Approved: Green badge
  - Rejected: Red badge

- **BETA badge**: Small secondary badge with uppercase text

---

## Integration Summary

| Component | Purpose |
|-----------|---------|
| `DeepAnalysisPipeline` | 4-step visualization with animation |
| `DeepAnalysisResult` | Result display with confidence/validation |
| `GenericScenarioWizard` | Integration of Deep Analysis button and flow |
| `runExosGraph` | LangGraph entry point (already exists) |
| `useModelConfig` | Provider/model config (already integrated) |

---

## Acceptance Criteria

1. User sees two buttons in Review step: "Analyze with AI" (primary) and "Deep Analysis (Beta)" (outline)
2. Clicking "Deep Analysis" transitions to analyzing step with 4-step pipeline visualization
3. Steps light up one-by-one with pulsing animation on current step
4. On completion, results show with confidence score badge and validation status
5. Request uses the provider/model selected in Settings (BYOK support)
6. Error state shows error message and allows returning to Review step

---

## Technical Summary

| Item | Details |
|------|---------|
| New files | 2 (`DeepAnalysisPipeline.tsx`, `DeepAnalysisResult.tsx`) |
| Modified files | 1 (`GenericScenarioWizard.tsx`) |
| New icons | `BrainCircuit`, `Scale`, `Unlock` from lucide-react |
| Animation | framer-motion pulse effect for active step |
| State additions | 4 new state variables in wizard |
