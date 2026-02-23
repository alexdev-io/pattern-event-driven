<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=22&duration=3000&pause=1000&color=00E5FF&center=true&vCenter=true&width=700&lines=pattern-event-driven;Saga+%7C+Outbox+%7C+CQRS+%7C+DLQ+%E2%80%94+production+implementations." alt="Typing SVG" />

<br/>

<img src="https://img.shields.io/badge/TypeScript-Patterns-3178C6?style=for-the-badge&logo=typescript&logoColor=3178C6&labelColor=0d0d0d" />
<img src="https://img.shields.io/badge/Kafka-Event_Bus-FF6B35?style=for-the-badge&logo=apachekafka&logoColor=FF6B35&labelColor=0d0d0d" />
<img src="https://img.shields.io/badge/RabbitMQ-Messaging-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=FF6600&labelColor=0d0d0d" />
<img src="https://img.shields.io/badge/CQRS-Event_Sourcing-00E5FF?style=for-the-badge&labelColor=0d0d0d" />

</div>

---

## `> overview`

Four production-grade event-driven patterns in TypeScript/Node.js with Kafka and RabbitMQ. Each is self-contained, runnable, and documented with the tradeoffs that matter in real systems.

> Not theoretical. Running code with real brokers.

---

## `> patterns`

| Pattern | Broker | Port | Purpose |
|:---|:---:|:---:|:---|
| **Saga Orchestrator** | Kafka | — | Distributed transactions with compensation |
| **CQRS + Event Sourcing** | — | 3010 | Separate read/write models, append-only store |
| **Outbox** | Kafka | 3020 | Atomic DB write + event publish |
| **Dead Letter Queue** | RabbitMQ | — | Failed message handling + retry |

---

## `> saga`

```
order.created → [orchestrator] → inventory.reserve
  → inventory.reserved → [orchestrator] → payment.process
    → payment.processed ✅ → order.confirmed
    → payment.failed ❌ → inventory.release (compensate) → order.failed
```

## `> cqrs + event sourcing`

```
POST /deposit → append MoneyDeposited → update projection
GET /account  ← read model (eventually consistent)
```

## `> outbox`

```
BEGIN TX
  INSERT orders + INSERT outbox(published=false)
COMMIT → relay polls → Kafka publish → mark published
```

## `> dlq`

```
orders-queue → fail x3 → dlq-exchange → dlq-queue → alert + replay
```

---

## `> getting started`

```bash
docker-compose -f docker-compose.kafka.yml up -d
docker-compose -f docker-compose.rabbit.yml up -d

npx ts-node-dev saga/orchestrator/src/index.ts
npx ts-node-dev cqrs/src/index.ts
npx ts-node-dev outbox/producer/src/index.ts
npx ts-node-dev dlq/src/index.ts
```

| UI | URL |
|:---|:---|
| Kafka UI | http://localhost:8090 |
| RabbitMQ | http://localhost:15672 |

---

## `> key decisions`

```yaml
saga_style:     orchestrator      # centralized visibility vs choreography
event_store:    in_memory         # replace with PostgreSQL / EventStoreDB
read_models:    in_memory         # replace with Redis / Elasticsearch
outbox_relay:   polling_2s        # replace with Debezium CDC in production
dlq_retry:      exponential_backoff_via_rabbitmq_ttl
brokers:        kafka_for_ordering, rabbitmq_for_routing_flexibility
```

---

<div align="center">

*Built by [@alexpatinoa](https://github.com/alexpatinoa) · [alexdev-io](https://github.com/alexdev-io)*

</div>