---
name: systematic-debugging
description: Use when software, infrastructure, integrations, or tests fail unexpectedly and the cause is not already proven.
---

# Systematic Debugging

## Principle
Diagnose from evidence before changing code.

## Workflow
1. Reproduce the failure reliably or capture the best available evidence.
2. Compare expected versus actual behavior at each boundary.
3. Generate competing hypotheses and design the cheapest discriminating checks.
4. Locate the earliest incorrect state or transition.
5. Apply the smallest causal fix and rerun reproduction plus regression checks.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- No speculative fix before evidence narrows the cause.
- A workaround is labeled as such if root cause remains unresolved.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
