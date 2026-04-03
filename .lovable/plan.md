

# Fix Schema Implementation Plan Filename

## Problem
The file `docs/schema/EXOS_Schema_Implementation_Plan_v1.md` contains the CTO-corrected v2 plan but is named as v1. The rejected v1 draft contained the `public/docs/` security error. The filename must be corrected to prevent developers from confusing it with the superseded version.

## Changes

### 1. Rename the file
- Rename `docs/schema/EXOS_Schema_Implementation_Plan_v1.md` to `docs/schema/EXOS_Schema_Implementation_Plan_v2.md`
- Content stays the same (it already contains the corrected v2 plan)

### 2. Update references in `docs/ChangePDFReportsDesign.md`
- If any cross-references to `EXOS_Schema_Implementation_Plan_v1.md` were added (or are pending from the previous update), change them to `EXOS_Schema_Implementation_Plan_v2.md`

### 3. Update references in `docs/ChangeExcelReportsDesign.md`
- Same as above — ensure all references point to `v2`

### 4. Search entire codebase for stale references
- Grep for `Implementation_Plan_v1` across all files and fix any remaining occurrences

## Files Affected
| File | Change |
|---|---|
| `docs/schema/EXOS_Schema_Implementation_Plan_v1.md` | Rename to `…_v2.md` |
| `docs/ChangePDFReportsDesign.md` | Update cross-reference if present |
| `docs/ChangeExcelReportsDesign.md` | Update cross-reference if present |
| Any other files with stale references | Fix to `v2` |

