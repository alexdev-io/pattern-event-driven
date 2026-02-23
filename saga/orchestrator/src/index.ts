/**
 * SAGA ORCHESTRATOR PATTERN
 *
 * The orchestrator coordinates a distributed transaction across
 * multiple services using Kafka as the event bus.
 *
 * Flow:
 *  1. ORDER CREATED → orchestrator starts saga
 *  2. Orchestrator → RESERVE_INVENTORY command → inventory-service
 *  3. INVENTORY_RESERVED → orchestrator → PROCESS_PAYMENT command → payment-service
 *  4a. PAYMENT_SUCCESS → orchestrator → ORDER_CONFIRMED
 *  4b. PAYMENT_FAILED → orchestrator → RELEASE_INVENTORY (compensating tx)
 */

import { createKafkaClient, createProducer, createConsumer } from '../../shared/src/kafka/client';
import { createLogger } from '../../shared/src/logger';
import { SagaOrchestrator } from './orchestrator';

const logger = createLogger('saga-orchestrator');

const main = async () => {
  const kafka = createKafkaClient('saga-orchestrator');
  const producer = await createProducer(kafka);
  const consumer = await createConsumer(kafka, 'saga-orchestrator-group');

  const orchestrator = new SagaOrchestrator(producer, logger);

  await consumer.subscribe({
    topics: ['order.created','inventory.reserved','inventory.reserve_failed','payment.processed','payment.failed','inventory.released'],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value?.toString() || '{}');
      logger.info(`Received: ${topic}`, { sagaId: event.sagaId });
      await orchestrator.handle(topic, event);
    },
  });

  logger.info('Saga orchestrator running');
};

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
