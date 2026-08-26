---
name: test-driven-development
description: Use when implementing a feature, bug fix, refactor, or behavior change where automated tests can define the expected behavior.
---

# Test Driven Development

## Principle
Prove the test can fail for the missing behavior before making it pass.

## Workflow
1. Write the smallest test that expresses one desired behavior.
2. Run it and confirm it fails for the expected reason.
3. Implement the minimum change that makes the test pass.
4. Run the focused test and relevant regression suite.
5. Refactor only while tests remain green, then repeat for the next behavior.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- A passing test that never failed does not prove the new behavior.
- Tests assert externally meaningful behavior rather than mocks alone.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
