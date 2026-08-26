---
name: api-design
description: Use when creating or changing HTTP, RPC, event, SDK, or internal service interfaces consumed by other components or clients.
---

# API Design

## Principle
Design contracts for clarity, evolution, failure, and observability.

## Workflow
1. Define resources or operations from consumer jobs.
2. Specify request, response, validation, errors, idempotency, pagination, and concurrency semantics.
3. Choose versioning and backward-compatibility rules.
4. Define authentication, authorization, rate limits, and sensitive-field handling.
5. Provide examples and contract tests for critical behavior.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Errors are machine-actionable.
- Retry and idempotency semantics are explicit where side effects exist.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
