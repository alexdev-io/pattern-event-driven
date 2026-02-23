# Dead Letter Queue (DLQ)

## Problem
Failed messages block the queue or get silently dropped with no visibility.

## Solution
Route failed messages (after MAX_RETRIES) to a DLQ for inspection and replay.

## Topology
```
orders-exchange → orders-queue
  → fail x3 → dlq-exchange → dlq-queue → DLQ Consumer
```

## Retry with TTL
```
fail → retry-exchange → retry-queue (TTL=5s) → re-queued automatically
```

## Run
```bash
npm run dev:rabbit
ts-node-dev dlq/src/index.ts
# RabbitMQ UI: http://localhost:15672
```
