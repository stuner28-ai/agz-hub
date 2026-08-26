---
name: skill-authoring
description: Use when creating, editing, packaging, or validating reusable Agent Skills in SKILL.md format.
---

# Skill Authoring

## Principle
Create focused skills that trigger reliably and stay cheap until loaded.

## Workflow
1. Write a narrow skill name and a description that states when to use it, not the full workflow.
2. Keep one responsibility per skill; move heavy reference material to references or scripts.
3. Write imperative steps, explicit outputs, quality gates, and common failure boundaries.
4. Test triggering with positive and negative example prompts.
5. Validate naming, frontmatter, file structure, links, and conflicts before packaging.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Description begins with a real trigger condition.
- Skill can be removed without breaking unrelated workflows.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
