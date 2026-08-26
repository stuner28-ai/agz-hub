---
name: root-cause-analysis
description: Use when failures recur, symptoms have multiple plausible causes, or a fix would be risky without identifying the underlying mechanism.
---

# Root Cause Analysis

## Principle
Find the mechanism that produces the failure before proposing the fix.

## Workflow
1. State the observed failure precisely.
2. Build competing hypotheses from evidence, not intuition.
3. Seek discriminating tests that can eliminate hypotheses quickly.
4. Trace the earliest point where expected and actual behavior diverges.
5. Fix the causal mechanism and verify the original symptom plus nearby regressions.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Do not stop at the first plausible explanation.
- Evidence distinguishes cause from correlation.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
