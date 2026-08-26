---
name: prompt-engineering
description: Use when creating or repairing reusable prompts, system instructions, agent contracts, or tool-using instructions whose behavior must be reliable.
---

# Prompt Engineering

## Principle
Specify outcome, context, authority, evidence, and stop conditions as a testable contract.

## Workflow
1. Define the exact outcome and unacceptable outcomes.
2. Specify available context, tools, permissions, and prohibitions.
3. Separate mandatory rules from preferences.
4. Require evidence or checks for claims that matter.
5. Test the prompt against normal, ambiguous, adversarial, and edge-case inputs; revise observed failure modes.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Instructions are non-contradictory and prioritized.
- The prompt defines when to stop and what success looks like.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
