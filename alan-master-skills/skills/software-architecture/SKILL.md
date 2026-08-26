---
name: software-architecture
description: Use when designing or changing system boundaries, services, modules, data flows, deployment topology, or major technical interfaces.
---

# Software Architecture

## Principle
Choose architecture from quality attributes and constraints, not fashion.

## Workflow
1. Define functional needs plus scale, latency, availability, security, operability, cost, and team constraints.
2. Model the simplest architecture that satisfies current requirements.
3. Specify component boundaries, data ownership, interfaces, failure modes, and consistency assumptions.
4. Evaluate build-vs-buy and migration paths for irreversible choices.
5. Record tradeoffs and the conditions that would justify a future redesign.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Every component has a clear responsibility and owner.
- Architecture handles failure paths, not only happy paths.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
