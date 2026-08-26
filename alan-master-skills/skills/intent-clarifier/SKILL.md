---
name: intent-clarifier
description: Use when a request is ambiguous in a way that materially changes scope, safety, cost, output, or success criteria.
---

# Intent Clarifier

## Principle
Resolve only ambiguity that changes the result; do not interrogate the user unnecessarily.

## Workflow
1. Separate known facts from unknowns.
2. Identify which unknowns would change the answer materially.
3. Resolve unknowns from available context or tools first.
4. Ask at most the minimum blocking question; otherwise choose a reasonable assumption and state it.
5. Translate the resolved intent into explicit success criteria.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- No repeated questions for information already available.
- Assumptions are visible when they materially affect the result.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
