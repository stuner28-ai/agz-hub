---
name: execution-controller
description: Use when carrying out a multi-step plan that requires tool use, checkpoints, state tracking, or recovery from partial failure.
---

# Execution Controller

## Principle
Keep execution state explicit and advance only on verified results.

## Workflow
1. Track current step, expected output, and completion evidence.
2. Perform the smallest next action that advances the plan.
3. After each major action, compare actual result with expected result.
4. On failure, diagnose before retrying; do not repeat identical failing actions blindly.
5. At completion, summarize outputs, unresolved risks, and handoff state.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- No claim of completion without evidence.
- Partial progress is preserved instead of restarted unnecessarily.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
