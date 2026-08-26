---
name: security-review
description: Use when code, configuration, architecture, dependencies, authentication, authorization, secrets, or data handling may introduce a security vulnerability.
---

# Security Review

## Principle
Evaluate exploitability, impact, and trust boundaries before recommending fixes.

## Workflow
1. Identify assets, actors, entry points, privileges, and trust boundaries.
2. Inspect input validation, authn/authz, secret handling, data exposure, injection, SSRF, deserialization, file access, and dependency risk as relevant.
3. Trace candidate issues from source to security impact.
4. Assess realistic preconditions and severity; avoid theoretical inflation.
5. Recommend the smallest robust mitigation and verification test.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Findings include exploit path and affected asset.
- Security claims distinguish plausible from demonstrated impact.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
