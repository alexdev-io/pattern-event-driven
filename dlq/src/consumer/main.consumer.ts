import { Channel, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { MAIN_QUEUE, RETRY_EXCHANGE, MAX_RETRIES } from '../producer/setup';

export const startMainConsumer = async (channel: Channel, logger: Logger): Promise<void> => {
  channel.prefetch(1);
  await channel.consume(MAIN_QUEUE, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    const content = JSON.parse(msg.content.toString());
    const retryCount = (msg.properties.headers?.['x-retry-count'] as number) || 0;
    logger.info('Processing message', { id: content.id, attempt: retryCount + 1 });
    try {
      if (Math.random() < 0.4) throw new Error('Simulated failure');
      logger.info('Message processed', { id: content.id });
      channel.ack(msg);
    } catch (err: any) {
      logger.warn('Processing failed', { id: content.id, attempt: retryCount + 1 });
      if (retryCount >= MAX_RETRIES - 1) {
        logger.error('Max retries exceeded — sending to DLQ', { id: content.id });
        channel.nack(msg, false, false);
      } else {
        channel.ack(msg);
        channel.publish(RETRY_EXCHANGE, '', msg.content, { headers: { 'x-retry-count': retryCount + 1 }, persistent: true });
        logger.info('Retry scheduled', { id: content.id, nextAttempt: retryCount + 2 });
      }
    }
  });
  logger.info(`Main consumer listening on ${MAIN_QUEUE}`);
};
