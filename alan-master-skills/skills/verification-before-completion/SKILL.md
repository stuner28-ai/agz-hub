---
name: verification-before-completion
description: Use when the agent is about to claim that work is complete, fixed, deployed, correct, or ready to ship.
---

# Verification Before Completion

## Principle
Evidence must precede completion claims.

## Workflow
1. Restate the acceptance criteria.
2. Run the strongest available verification for each criterion.
3. Inspect outputs, not just exit codes.
4. Test critical negative and edge cases when applicable.
5. Report exactly what was verified and any unverified residual risk.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Never infer success from intended changes alone.
- A failed verification blocks a success claim.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
