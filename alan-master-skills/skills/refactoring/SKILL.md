---
name: refactoring
description: Use when improving internal code structure while intentionally preserving external behavior.
---

# Refactoring

## Principle
Change structure under a safety net, not behavior by accident.

## Workflow
1. Define behavior that must remain invariant and establish tests.
2. Identify the specific structural problem and desired simplification.
3. Make small transformations that keep tests green.
4. Remove duplication, reduce coupling, improve naming, or clarify boundaries without adding unrelated features.
5. Run regression and performance checks where structure affects hot paths.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Behavior changes are separated into their own task.
- Each step leaves the system working.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
