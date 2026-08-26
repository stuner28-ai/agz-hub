---
name: threat-modeling
description: Use when designing a new system or high-risk feature and security threats should be identified before implementation or release.
---

# Threat Modeling

## Principle
Model who can do what, through which boundary, against which asset.

## Workflow
1. Define assets, actors, trust boundaries, data flows, and privileged operations.
2. Enumerate abuse cases and attacker goals at each boundary.
3. Rank threats by likelihood, impact, and detectability.
4. Assign preventative, detective, and recovery controls.
5. Convert top threats into security requirements and tests.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Threats are tied to concrete flows.
- Controls have owners or implementation points.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
