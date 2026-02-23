# Saga Pattern

## Problem
Distributed transactions across microservices cannot use 2PC due to tight coupling and availability concerns.

## Solution
Break the transaction into local transactions, each publishing events. On failure, execute **compensating transactions**.

## Orchestration vs Choreography

| | Choreography | Orchestration |
|---|---|---|
| Coordination | Implicit via events | Explicit via orchestrator |
| Visibility | Hard to track | Centralized |
| This repo | — | ✅ |

## Flow
```
order.created → [orchestrator] → inventory.reserve
  → inventory.reserved → [orchestrator] → payment.process
    → payment.processed ✅ → order.confirmed
    → payment.failed ❌ → inventory.release (compensation) → order.failed
```

## Run
```bash
npm run dev:kafka
ts-node-dev saga/orchestrator/src/index.ts
ts-node-dev saga/services/order/src/index.ts
ts-node-dev saga/services/payment/src/index.ts
ts-node-dev saga/services/inventory/src/index.ts
```
