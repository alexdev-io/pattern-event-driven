# CQRS + Event Sourcing

## CQRS
Separate read (Query) and write (Command) models.

## Event Sourcing
Store the sequence of events, not the current state. State = reduce(events).

## Flow
```
POST /accounts/:id/deposit
  → validate → append MoneyDeposited → update projection
GET /accounts/:id
  → read from projection (optimized read model)
```

## API
```bash
POST /accounts              { owner }
POST /accounts/:id/deposit  { amount }
POST /accounts/:id/withdraw { amount }
GET  /accounts/:id
GET  /accounts
```

## Run
```bash
ts-node-dev cqrs/src/index.ts
```
