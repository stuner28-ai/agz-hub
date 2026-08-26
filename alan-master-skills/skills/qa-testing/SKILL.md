---
name: qa-testing
description: Use when planning or executing functional, integration, regression, exploratory, compatibility, or release testing beyond unit tests.
---

# QA Testing

## Principle
Test risk-weighted behavior across realistic user journeys and boundaries.

## Workflow
1. Define release risks and critical workflows.
2. Build a coverage matrix across happy paths, edge cases, permissions, failure recovery, platforms, and data states.
3. Automate stable high-value checks; reserve exploration for uncertain behavior.
4. Record reproducible defects with expected versus actual results.
5. Re-test fixes and run targeted regressions before release.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Coverage follows risk, not equal effort per feature.
- A passed smoke test is not treated as full QA.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
