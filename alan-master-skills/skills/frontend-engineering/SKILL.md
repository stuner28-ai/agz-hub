---
name: frontend-engineering
description: Use when building or reviewing web UI components, pages, state flows, forms, accessibility, responsive behavior, or frontend architecture.
---

# Frontend Engineering

## Principle
Build accessible, resilient interfaces around user tasks and observable states.

## Workflow
1. Define user task, states, loading, empty, error, success, and permission variants.
2. Choose component boundaries and state ownership deliberately.
3. Implement keyboard access, semantic structure, labels, focus behavior, and responsive layouts.
4. Minimize unnecessary client work and avoid duplicated server state.
5. Test representative screen sizes and interaction paths.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Every async state has user-visible behavior.
- Accessibility is verified, not assumed.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
