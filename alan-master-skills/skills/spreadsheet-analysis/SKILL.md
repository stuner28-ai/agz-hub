---
name: spreadsheet-analysis
description: Use when auditing, cleaning, modeling, formula-checking, or restructuring spreadsheet data for reliable analysis or operations.
---

# Spreadsheet Analysis

## Principle
Treat the workbook as a small data system with explicit inputs, logic, and outputs.

## Workflow
1. Identify sheets, input ranges, formulas, dependencies, named ranges, and outputs.
2. Check types, blanks, duplicates, hidden rows/columns, units, and inconsistent formulas.
3. Separate assumptions/inputs from calculations and presentation.
4. Test formulas with boundary cases and reconcile totals to source data.
5. Document critical formulas and protect or clearly mark editable cells.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- No hard-coded constant is hidden inside a critical formula without explanation.
- Totals reconcile across dependent sheets.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
