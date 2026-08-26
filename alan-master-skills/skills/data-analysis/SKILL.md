---
name: data-analysis
description: Use when exploring datasets, answering quantitative questions, finding patterns, testing hypotheses, or producing evidence-backed analytical conclusions.
---

# Data Analysis

## Principle
Start from the decision question, then make the data trustworthy enough to answer it.

## Workflow
1. Define the analytical question, metric definitions, grain, and time window.
2. Profile schema, missingness, duplicates, outliers, and data quality issues.
3. Choose transformations and methods that preserve the intended population and denominator.
4. Analyze with appropriate comparisons and uncertainty.
5. Validate surprising results and communicate findings, limitations, and implications.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Every metric has a defined numerator, denominator, and grain where applicable.
- Correlation is not presented as causation without a causal design.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
