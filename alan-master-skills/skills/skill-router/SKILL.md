---
name: skill-router
description: Use when a request may match multiple installed skills, domains, or workflows and the agent must choose the smallest effective set.
---

# Skill Router

## Principle
Route work to the fewest skills that fully cover the request.

## Workflow
1. Extract the user's outcome, constraints, artifact, and risk level.
2. List candidate skills by trigger match; prefer exact domain skills over generic ones.
3. Remove duplicates and overlapping skills; keep one owner for each responsibility.
4. Order selected skills by dependency: discovery → planning → execution → verification.
5. If no skill fits, proceed normally instead of forcing a match.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Selected skills are necessary, non-duplicative, and ordered.
- No skill is selected merely because it exists.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
