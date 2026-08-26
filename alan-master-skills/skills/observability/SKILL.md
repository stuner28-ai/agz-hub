---
name: observability
description: Use when designing or improving logs, metrics, traces, alerts, dashboards, or incident diagnostics for a production system.
---

# Observability

## Principle
Observe user-impacting behavior and causal paths, not raw telemetry volume.

## Workflow
1. Identify critical user journeys, service objectives, and failure modes.
2. Define metrics for rate, errors, duration, saturation, and business outcomes as relevant.
3. Use structured logs with correlation identifiers and traces across boundaries.
4. Alert on actionable symptoms with clear ownership and runbook links.
5. Review telemetry cost, sensitive data exposure, and diagnostic usefulness.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Every alert has an expected human action.
- Telemetry avoids secrets and unnecessary personal data.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
