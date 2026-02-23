# Outbox Pattern

## Problem
Dual-write: DB write + Kafka publish are not atomic. Either can fail independently.

## Solution
Write event to outbox table in same DB transaction. Relay publishes asynchronously.

```
BEGIN TX
  INSERT orders (...)
  INSERT outbox (event, published=false)
COMMIT
[Relay] polls → publishes to Kafka → marks published=true
```

## Production
Use **Debezium CDC** instead of polling for sub-second latency.

## Run
```bash
npm run dev:kafka
ts-node-dev outbox/producer/src/index.ts
ts-node-dev outbox/consumer/src/index.ts
POST http://localhost:3020/orders { userId, items }
```
