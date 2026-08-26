---
name: context-management
description: Use when a long-running task spans many messages, artifacts, decisions, or state transitions and important context could be lost or contradicted.
---

# Context Management

## Principle
Maintain a compact source of truth for active decisions and current state.

## Workflow
1. Separate stable constraints, current state, completed work, open decisions, and next actions.
2. Prefer the newest explicit instruction when states conflict.
3. Archive superseded decisions instead of mixing them with active ones.
4. Carry forward only context that materially affects the next action.
5. At major milestones, produce a compact state snapshot.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- No regression to superseded state.
- Current state can be reconstructed from the snapshot.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
