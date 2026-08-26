---
name: devops-deployment
description: Use when designing or changing CI/CD, environments, containerization, deployment, rollback, secrets, infrastructure automation, or release processes.
---

# Devops Deployment

## Principle
Make releases reproducible, observable, and reversible.

## Workflow
1. Define environments, artifact promotion, configuration, secrets, and ownership.
2. Automate build and test gates from a clean state.
3. Use immutable artifacts and environment-specific configuration.
4. Add health checks, progressive rollout or safe deployment strategy, and rollback.
5. Verify deployed behavior and record release evidence.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- The same artifact can move between environments.
- Rollback does not depend on rebuilding old code.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
