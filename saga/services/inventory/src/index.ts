import { createKafkaClient, createProducer, createConsumer } from '../../../../shared/src/kafka/client';
import { createLogger } from '../../../../shared/src/logger';
const logger = createLogger('inventory-service');
const inventory: Record<string, number> = { 'PROD-1': 100, 'PROD-2': 50 };
const reservations: Record<string, { sku: string; qty: number }[]> = {};
const main = async () => {
  const kafka = createKafkaClient('inventory-service');
  const producer = await createProducer(kafka);
  const consumer = await createConsumer(kafka, 'inventory-service-group');
  await consumer.subscribe({ topics: ['inventory.reserve', 'inventory.release'], fromBeginning: false });
  await consumer.run({ eachMessage: async ({ topic, message }) => {
    const event = JSON.parse(message.value?.toString() || '{}');
    if (topic === 'inventory.reserve') {
      const ok = event.items.every((i: any) => (inventory[i.sku] || 0) >= i.qty);
      if (ok) {
        event.items.forEach((i: any) => { inventory[i.sku] -= i.qty; });
        reservations[event.orderId] = event.items;
        await producer.send({ topic: 'inventory.reserved', messages: [{ value: JSON.stringify({ sagaId: event.sagaId, orderId: event.orderId }) }] });
        logger.info('Inventory reserved', { orderId: event.orderId });
      } else {
        await producer.send({ topic: 'inventory.reserve_failed', messages: [{ value: JSON.stringify({ sagaId: event.sagaId, orderId: event.orderId, reason: 'Insufficient stock' }) }] });
      }
    }
    if (topic === 'inventory.release') {
      const r = reservations[event.orderId];
      if (r) { r.forEach((i) => { inventory[i.sku] = (inventory[i.sku] || 0) + i.qty; }); delete reservations[event.orderId]; }
      await producer.send({ topic: 'inventory.released', messages: [{ value: JSON.stringify({ sagaId: event.sagaId, orderId: event.orderId }) }] });
      logger.info('Inventory released', { orderId: event.orderId });
    }
  }});
  logger.info('Inventory service running');
};
main().catch(err => { console.error(err); process.exit(1); });
