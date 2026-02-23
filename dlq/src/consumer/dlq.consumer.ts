import { Channel, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { DLQ_QUEUE } from '../producer/setup';

export const startDLQConsumer = async (channel: Channel, logger: Logger): Promise<void> => {
  await channel.consume(DLQ_QUEUE, (msg: ConsumeMessage | null) => {
    if (!msg) return;
    const content = JSON.parse(msg.content.toString());
    const h = msg.properties.headers || {};
    logger.error('Message in DLQ', { id: content.id, retries: h['x-retry-count'], queue: h['x-first-death-queue'], reason: h['x-first-death-reason'], payload: content });
    // Production: alert on-call, store for manual replay
    channel.ack(msg);
  });
  logger.info(`DLQ consumer listening on ${DLQ_QUEUE}`);
};
