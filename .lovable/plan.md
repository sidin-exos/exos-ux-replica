

## Persist query filters in URL search params

Two files modified. No other files touched.

### File 1: `src/pages/MarketIntelligence.tsx`

- Replace `const [searchParams] = useSearchParams()` with `const [searchParams, setSearchParams] = useSearchParams()`
- Delete `modeParam` variable (line 24), `defaultScenario` (line 37), `selectedScenario` useState (line 39), and the sync useEffect (lines 41-45)
- Add URL-derived `selectedScenario`: `const selectedScenario = (searchParams.get('mode') === 'regular' ? 'regular' : 'adhoc') as IntelScenario`
- Add `updateFilter` helper using `setSearchParams` with `{ replace: true }`
- Wire `IntelScenarioSelector.onSelect` to: `updateFilter('mode', val === 'adhoc' ? '' : val)`
- Remove `useState` and `useEffect` from imports (keep `useState` only if used elsewhere — it's not, so remove both)

### File 2: `src/components/intelligence/QueryBuilder.tsx`

- Add `import { useSearchParams } from 'react-router-dom'`
- Add `const [searchParams, setSearchParams] = useSearchParams()` at top of component
- Add same `updateFilter` helper
- Replace 3 useState declarations with URL-derived values:
  - `queryType`: `searchParams.get('type') as QueryType ?? "supplier"`
  - `recencyFilter`: `searchParams.get('recency') ?? "__none__"`
  - `selectedDomains`: parsed from `searchParams.get('domains')?.split(',').filter(Boolean) ?? []`
- Replace setter calls:
  - `setQueryType(type)` → `updateFilter('type', type === 'supplier' ? '' : type)`
  - `setRecencyFilter` in Select's `onValueChange` → `updateFilter('recency', v === '__none__' ? '' : v)`
  - `toggleDomain` → compute next array, call `updateFilter('domains', next.join(','))`
- Keep `queryName`, `queryText`, `context`, `showAdvanced` as regular useState (excluded per spec)
- `handleSubmit` call site unchanged — `queryType`, `recencyFilter`, `selectedDomains` resolve to same types

### Default value cleanup rules
| Param | Default | URL when default |
|-------|---------|-----------------|
| mode | adhoc | deleted |
| type | supplier | deleted |
| recency | __none__ | deleted |
| domains | [] | deleted |

### What does NOT change
- Form submission logic, edge function params, visual UI
- Tab path navigation (Session 1 `navigate()` calls untouched)
- Insights tab gets zero query params
- App.tsx not modified

