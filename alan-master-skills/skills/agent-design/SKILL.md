---
name: agent-design
description: Use when designing an AI agent, multi-agent workflow, autonomous loop, or tool-using assistant with persistent responsibilities.
---

# Agent Design

## Principle
Design agents around bounded responsibilities, explicit state, and verifiable handoffs.

## Workflow
1. Define one primary responsibility per agent.
2. Specify inputs, outputs, tools, permissions, memory, and forbidden actions.
3. Define handoff contracts and ownership of shared state.
4. Add budget, timeout, retry, escalation, and stop rules.
5. Create evaluation cases for task success, tool misuse, hallucination, and coordination failure.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- No two agents have ambiguous ownership of the same decision.
- Autonomy increases only after evaluation evidence.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
