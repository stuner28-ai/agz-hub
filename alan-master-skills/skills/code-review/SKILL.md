---
name: code-review
description: Use when reviewing a code change, pull request, patch, or implementation for correctness, maintainability, regressions, and engineering quality.
---

# Code Review

## Principle
Review behavior and risk, not formatting preferences.

## Workflow
1. Understand the intended behavior and changed surface.
2. Trace data, control flow, error paths, concurrency, state, and external side effects.
3. Look for missing validation, edge cases, backward compatibility, and test gaps.
4. Classify findings by severity and cite exact locations.
5. Separate blocking correctness issues from optional improvements.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Every finding explains impact and a plausible failure scenario.
- Do not report stylistic preference as a defect.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
