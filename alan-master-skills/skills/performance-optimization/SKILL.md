---
name: performance-optimization
description: Use when latency, throughput, memory, CPU, bundle size, rendering, database cost, or infrastructure efficiency is below target.
---

# Performance Optimization

## Principle
Measure the bottleneck before optimizing it.

## Workflow
1. Define the performance target and representative workload.
2. Profile end-to-end and locate the dominant contributors.
3. Prioritize changes by expected impact and implementation risk.
4. Optimize one bottleneck at a time while preserving correctness.
5. Benchmark before and after under comparable conditions and watch for shifted bottlenecks.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- No optimization claim without measurements.
- Performance changes preserve functional tests.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
