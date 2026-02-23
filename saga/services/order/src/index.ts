import { createKafkaClient, createProducer, createConsumer } from '../../../../shared/src/kafka/client';
import { createLogger } from '../../../../shared/src/logger';
const logger = createLogger('order-service');
const main = async () => {
  const kafka = createKafkaClient('order-service');
  const producer = await createProducer(kafka);
  const consumer = await createConsumer(kafka, 'order-service-group');
  await consumer.subscribe({ topics: ['order.confirmed', 'order.failed'], fromBeginning: false });
  await consumer.run({ eachMessage: async ({ topic, message }) => {
    const event = JSON.parse(message.value?.toString() || '{}');
    if (topic === 'order.confirmed') logger.info('Order confirmed', { orderId: event.orderId });
    else if (topic === 'order.failed') logger.warn('Order failed', { orderId: event.orderId, reason: event.reason });
  }});
  setTimeout(async () => {
    const orderId = `order-${Date.now()}`;
    await producer.send({ topic: 'order.created', messages: [{ value: JSON.stringify({ orderId, userId: 'user-123', items: [{ sku: 'PROD-1', qty: 2 }], total: 149.99 }) }] });
    logger.info('Order created — saga started', { orderId });
  }, 3000);
  logger.info('Order service running');
};
main().catch(err => { console.error(err); process.exit(1); });
