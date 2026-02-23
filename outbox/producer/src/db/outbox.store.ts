import { Producer } from 'kafkajs';
import { Logger } from 'winston';

export interface OutboxEntry {
  id: string; aggregateId: string; aggregateType: string;
  eventType: string; payload: Record<string, unknown>;
  publishedAt: string | null; createdAt: string;
}

export const outboxStore: OutboxEntry[] = [];

export const startOutboxRelay = (producer: Producer, logger: Logger): void => {
  setInterval(async () => {
    const pending = outboxStore.filter(e => e.publishedAt === null);
    for (const entry of pending) {
      try {
        const topic = `${entry.aggregateType.toLowerCase()}.${entry.eventType.replace(/([A-Z])/g, '.$1').toLowerCase().slice(1)}`;
        await producer.send({ topic, messages: [{ key: entry.aggregateId, value: JSON.stringify(entry.payload), headers: { 'outbox-id': entry.id, 'event-type': entry.eventType } }] });
        entry.publishedAt = new Date().toISOString();
        logger.info('Outbox event published', { id: entry.id, eventType: entry.eventType });
      } catch (err: any) { logger.error('Relay failed', { id: entry.id, error: err.message }); }
    }
  }, 2000);
  logger.info('Outbox relay started — polling every 2s');
};
