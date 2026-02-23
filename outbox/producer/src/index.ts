import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../../shared/src/logger';
import { outboxStore, startOutboxRelay } from './db/outbox.store';
import { createKafkaClient, createProducer } from '../../../shared/src/kafka/client';

const app = express();
const logger = createLogger('outbox-producer');
app.use(express.json());

app.post('/orders', async (req, res) => {
  try {
    const orderId = uuidv4();
    const { userId, items } = req.body;
    const outboxEntry = { id: uuidv4(), aggregateId: orderId, aggregateType: 'Order', eventType: 'OrderCreated', payload: { orderId, userId, items }, publishedAt: null, createdAt: new Date().toISOString() };
    outboxStore.push(outboxEntry);
    logger.info('Order + outbox entry written atomically', { orderId });
    res.status(201).json({ orderId, outboxEntryId: outboxEntry.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/outbox', (_req, res) => res.json(outboxStore));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'outbox-producer' }));

const start = async () => {
  const kafka = createKafkaClient('outbox-producer');
  const producer = await createProducer(kafka);
  startOutboxRelay(producer, logger);
  app.listen(3020, () => logger.info('Outbox producer running on port 3020'));
};
start().catch(err => { console.error(err); process.exit(1); });
