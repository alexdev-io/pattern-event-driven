import { createKafkaClient, createConsumer } from '../../../shared/src/kafka/client';
import { createLogger } from '../../../shared/src/logger';
const logger = createLogger('outbox-consumer');
const processedIds = new Set<string>();
const main = async () => {
  const kafka = createKafkaClient('outbox-consumer');
  const consumer = await createConsumer(kafka, 'outbox-consumer-group');
  await consumer.subscribe({ topics: ['order.order-created'], fromBeginning: false });
  await consumer.run({ eachMessage: async ({ message }) => {
    const outboxId = message.headers?.['outbox-id']?.toString();
    if (outboxId && processedIds.has(outboxId)) { logger.warn('Duplicate skipped', { outboxId }); return; }
    if (outboxId) processedIds.add(outboxId);
    const payload = JSON.parse(message.value?.toString() || '{}');
    logger.info('Order event processed (idempotent)', { orderId: payload.orderId, outboxId });
  }});
  logger.info('Outbox consumer running');
};
main().catch(err => { console.error(err); process.exit(1); });
