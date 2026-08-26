---
name: workflow-automation
description: Use when a repeated manual process can be converted into a reliable recurring, event-driven, or semi-automatic workflow.
---

# Workflow Automation

## Principle
Automate stable decisions while preserving explicit boundaries for risky or ambiguous actions.

## Workflow
1. Map trigger, inputs, decisions, actions, outputs, and failure handling.
2. Separate deterministic steps from judgment-heavy steps.
3. Define permissions, budgets, rate limits, and stop conditions.
4. Make actions idempotent where possible and record state for retries.
5. Add monitoring and a manual escape hatch before scaling.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Automation cannot silently exceed permissions.
- Retries do not duplicate irreversible actions.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
