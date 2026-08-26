---
name: database-design
description: Use when designing or changing relational or document schemas, indexes, constraints, transactions, migrations, or data ownership.
---

# Database Design

## Principle
Encode invariants in the data model and design access paths deliberately.

## Workflow
1. List entities, invariants, cardinalities, lifecycle, and query patterns.
2. Choose normalization or denormalization based on consistency and access needs.
3. Define keys, constraints, indexes, transaction boundaries, and retention.
4. Plan migrations for forward/backward compatibility and rollback.
5. Validate representative queries and data volumes.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Critical invariants are enforced, not merely documented.
- Indexes correspond to real query patterns.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
