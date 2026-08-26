---
name: forecasting
description: Use when projecting demand, revenue, costs, capacity, traffic, inventory, or other time-dependent quantities under uncertainty.
---

# Forecasting

## Principle
Forecast distributions and scenarios, not a single number disguised as certainty.

## Workflow
1. Define target, horizon, granularity, and decision use.
2. Establish naive baselines before complex models.
3. Account for trend, seasonality, structural breaks, promotions, and external drivers when justified.
4. Backtest on rolling historical windows with decision-relevant error metrics.
5. Provide central estimate, uncertainty range, scenarios, and update triggers.

## Output contract
- State the result or decision clearly.
- Distinguish verified facts, assumptions, estimates, and unresolved uncertainty when material.
- Include only the detail required to make the output usable.

## Quality gates
- Model beats or justifiably complements a simple baseline.
- Uncertainty grows with horizon unless evidence supports otherwise.

## Stop conditions
- Stop when the requested outcome and quality gates are satisfied.
- Escalate rather than inventing missing authority, credentials, data, or irreversible permission.
