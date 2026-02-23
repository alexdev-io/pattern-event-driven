import { createKafkaClient, createProducer, createConsumer } from '../../../../shared/src/kafka/client';
import { createLogger } from '../../../../shared/src/logger';
const logger = createLogger('payment-service');
const main = async () => {
  const kafka = createKafkaClient('payment-service');
  const producer = await createProducer(kafka);
  const consumer = await createConsumer(kafka, 'payment-service-group');
  await consumer.subscribe({ topics: ['payment.process'], fromBeginning: false });
  await consumer.run({ eachMessage: async ({ topic, message }) => {
    const event = JSON.parse(message.value?.toString() || '{}');
    logger.info('Processing payment', { orderId: event.orderId });
    const success = Math.random() > 0.2;
    await producer.send({ topic: success ? 'payment.processed' : 'payment.failed', messages: [{ value: JSON.stringify({ sagaId: event.sagaId, orderId: event.orderId, ...(success ? { transactionId: `txn-${Date.now()}` } : { reason: 'Insufficient funds' }) }) }] });
    logger.info(success ? 'Payment processed' : 'Payment failed', { orderId: event.orderId });
  }});
  logger.info('Payment service running');
};
main().catch(err => { console.error(err); process.exit(1); });
