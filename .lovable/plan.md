

# Market Intelligence Module with Perplexity API Integration

## Status: ✅ Implemented

### Market Insights Knowledge Base (NEW - Feb 2026)
The Market Intelligence module now includes a **Market Insights Knowledge Base** that pre-generates and stores industry+category-specific intelligence for grounding AI reports.

| Feature | Status |
|---------|--------|
| `market_insights` database table | ✅ Implemented |
| `generate-market-insights` edge function | ✅ Deployed |
| Confidence scoring for combinations | ✅ Working |
| MarketInsightsBanner component | ✅ Integrated |
| Scenario wizard integration | ✅ Active |
| 5 initial insights generated | ✅ Complete |

**Generated Insights:**
- Pharma & Life Sciences + Lab Supplies (100% confidence)
- Automotive (OEM) + Raw Materials (Steel) (98% confidence)
- Retail + Logistics (Small Parcel) (90% confidence)
- SaaS (Enterprise) + IT Software (SaaS) (95% confidence)
- Healthcare + MRO (Maintenance) (85% confidence)

**Perplexity API Pricing:** ~$0.005 per report (sonar-pro model)

## Overview

Add a dedicated Market Intelligence feature to EXOS that leverages Perplexity's Sonar API for real-time analysis of market events, supplier news, commodity trends, and competitive intelligence. This will be accessible via a new navigation tab and powered by a dedicated Edge Function.

## Why Perplexity Sonar API?

Perplexity Sonar is ideal for this use case because:

| Feature | Benefit for EXOS |
|---------|------------------|
| **Grounded Search** | Real-time web search with source citations |
| **Academic Mode** | Access to research papers for regulatory/compliance topics |
| **Domain Filtering** | Focus on industry publications, news sites, financial reports |
| **Recency Filtering** | Get latest news (last day/week/month) |
| **Structured Outputs** | Extract data in consistent JSON schemas |

**Recommended Model**: `sonar-pro` for multi-step reasoning with 2x more citations (ideal for comprehensive market analysis)

## Architecture

```text
+------------------+     +----------------------+     +-------------------+
|                  |     |                      |     |                   |
|   Market Intel   |---->|  market-intelligence |---->|   Perplexity API  |
|   Page/Tab       |     |  Edge Function       |     |   (Sonar Pro)     |
|                  |<----|                      |<----|                   |
+------------------+     +----------------------+     +-------------------+
         |                        |
         |                        v
         |               +-------------------+
         |               |   intel_queries   |
         +-------------->|   (Database)      |
                         +-------------------+
```

## Feature Scope

### Intelligence Query Types

| Query Type | Purpose | Example Query |
|------------|---------|---------------|
| **Supplier News** | Monitor specific supplier developments | "Recent news about [Supplier X] financial health, acquisitions, or operational issues" |
| **Commodity Watch** | Track raw material price movements | "Steel price trends Q1 2026, supply constraints, outlook" |
| **Industry Trends** | Market dynamics and competitive moves | "Cloud infrastructure pricing trends, AWS vs Azure vs GCP" |
| **Regulatory Updates** | Compliance and policy changes | "EU CBAM carbon border adjustments impact on importers" |
| **M&A Activity** | Track supplier/competitor consolidation | "Recent acquisitions in logistics sector, impact on capacity" |
| **Risk Signals** | Early warning for supply chain risks | "Port congestion reports, labor strikes affecting manufacturing" |

### User Interface

New page `/market-intelligence` with:

1. **Query Builder**
   - Query type selector (supplier, commodity, industry, regulatory, M&A, risk)
   - Freeform query input with AI-enhanced suggestions
   - Recency filter (past day/week/month/year)
   - Source domain filter (news, financial, academic)

2. **Results Display**
   - AI-synthesized summary with key insights
   - Source citations with clickable links
   - Relevance indicators
   - Save to collection/share functionality

3. **Intelligence Feed** (stretch goal)
   - Saved queries that auto-refresh
   - Alert configuration for keyword matches

## Implementation Details

### 1. Perplexity Connector Setup

Perplexity is available as a standard connector. Connection flow:
1. Use `connect` tool with `connector_id: "perplexity"` 
2. User selects/creates connection with their API key
3. `PERPLEXITY_API_KEY` becomes available in Edge Functions

### 2. Database Schema

New table to track intelligence queries:

```sql
CREATE TABLE intel_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Query details
  query_type TEXT NOT NULL,  -- supplier, commodity, industry, regulatory, m&a, risk
  query_text TEXT NOT NULL,
  recency_filter TEXT,       -- day, week, month, year
  domain_filter TEXT[],      -- news, financial, academic
  
  -- Response
  summary TEXT,
  citations JSONB,           -- [{url, title, snippet}]
  raw_response JSONB,
  
  -- Metadata
  model_used TEXT,
  processing_time_ms INT,
  success BOOLEAN DEFAULT true,
  error_message TEXT
);
```

### 3. Edge Function: `market-intelligence`

```typescript
// supabase/functions/market-intelligence/index.ts

interface IntelRequest {
  queryType: 'supplier' | 'commodity' | 'industry' | 'regulatory' | 'm&a' | 'risk';
  query: string;
  recencyFilter?: 'day' | 'week' | 'month' | 'year';
  domainFilter?: string[];
  context?: string;  // Optional industry/company context
}

// Build system prompts per query type
const QUERY_TYPE_PROMPTS = {
  supplier: "Analyze supplier-related developments focusing on financial health, operational issues, and strategic moves...",
  commodity: "Analyze commodity market trends including pricing, supply/demand dynamics...",
  industry: "Analyze industry trends, competitive dynamics, and market structure changes...",
  regulatory: "Analyze regulatory developments, compliance requirements, and policy changes...",
  "m&a": "Analyze merger and acquisition activity, consolidation trends...",
  risk: "Identify supply chain risk signals, disruption indicators..."
};

// Call Perplexity API with appropriate parameters
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'sonar-pro',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: enrichedQuery }
    ],
    search_recency_filter: recencyFilter,
    search_domain_filter: domainFilter,
  }),
});
```

### 4. React Hook: `useMarketIntelligence`

```typescript
// src/hooks/useMarketIntelligence.ts

interface UseMarketIntelligenceReturn {
  query: (params: IntelQueryParams) => Promise<IntelResult | null>;
  isLoading: boolean;
  error: string | null;
  recentQueries: IntelQuery[];
}
```

### 5. Page Component: `MarketIntelligence.tsx`

New page following existing patterns with:
- Header component
- Query builder card
- Results display with citations
- Recent queries sidebar

### 6. Navigation Update

Add new nav link in Header:

```tsx
<NavLink 
  to="/market-intelligence" 
  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
  activeClassName="text-foreground"
>
  Intelligence
</NavLink>
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/MarketIntelligence.tsx` | Main page component |
| `src/hooks/useMarketIntelligence.ts` | React hook for API calls |
| `src/components/intelligence/QueryBuilder.tsx` | Query input form |
| `src/components/intelligence/IntelResults.tsx` | Results display with citations |
| `src/components/intelligence/SourceCard.tsx` | Individual citation card |
| `supabase/functions/market-intelligence/index.ts` | Edge function for Perplexity API |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route for `/market-intelligence` |
| `src/components/layout/Header.tsx` | Add "Intelligence" nav link |

## Query Type Examples

### Supplier News Query

**Input**: "TechCorp Inc" + type: supplier + recency: week
**System Prompt**: "Analyze recent news about TechCorp Inc focusing on: financial health indicators, operational challenges, strategic initiatives, leadership changes, customer wins/losses. Flag any concerns for a procurement professional."
**Output**: Structured summary with risk indicators + 5-10 cited sources

### Commodity Watch Query

**Input**: "Lithium battery materials" + type: commodity + recency: month
**System Prompt**: "Analyze lithium and battery materials market: price trends, supply constraints, major producer news, demand forecasts. Focus on procurement timing implications."
**Output**: Price trend analysis, supply risk assessment, procurement recommendations

### Regulatory Update Query

**Input**: "EU sustainability reporting" + type: regulatory + search_mode: academic
**System Prompt**: "Analyze EU Corporate Sustainability Reporting Directive (CSRD) requirements: compliance timelines, supply chain implications, required disclosures."
**Output**: Compliance checklist, timeline, affected suppliers

## Security Considerations

- Perplexity API key stored securely via connector
- No sensitive company data sent to Perplexity (only market queries)
- Query history stored for audit/improvement
- Rate limiting via connector infrastructure

## Future Enhancements

1. **Scheduled Monitoring**: Auto-run saved queries daily/weekly
2. **Alert System**: Notify on keyword matches (e.g., supplier bankruptcy)
3. **Integration with Scenarios**: Pre-populate risk assessments with market intel
4. **Trend Dashboards**: Visualize commodity price history over time

## Summary

This implementation adds a powerful Market Intelligence capability to EXOS:
- **New navigation tab**: "Intelligence" 
- **Dedicated page**: `/market-intelligence` with query builder and results
- **New Edge Function**: `market-intelligence` calling Perplexity Sonar API
- **Database logging**: Track queries for improvement and audit
- **Six query types**: Supplier, Commodity, Industry, Regulatory, M&A, Risk

The feature leverages Perplexity's unique strengths in grounded search with citations, making it ideal for procurement professionals who need reliable, sourced market information.

