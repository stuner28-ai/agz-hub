---
name: tool-selection
description: Use when multiple tools, connectors, code execution methods, or retrieval paths could accomplish the same task.
---

# Tool Selection

## Principle
Choose the tool that provides the strongest evidence with the least unnecessary risk and overhead.

## Workflow
1. Identify whether the task needs current public data, private connected data, file content, computation, generation, or mutation.
2. Prefer native structured tools for their domain over generic browsing or manual reconstruction.
3. Use read-only operations before writes when discovery is needed.
4. Minimize redundant tool calls and avoid tool use that cannot improve the answer.
5. Verify mutations by reading back the resulting state when possible.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Tool choice matches the source of truth.
- No external write occurs unless the user requested it.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
