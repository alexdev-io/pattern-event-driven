import { Channel } from 'amqplib';

const MAIN_EXCHANGE = 'orders-exchange';
const MAIN_QUEUE = 'orders-queue';
const DLQ_EXCHANGE = 'orders-dlq-exchange';
export const DLQ_QUEUE = 'orders-dlq-queue';
export const RETRY_EXCHANGE = 'orders-retry-exchange';
const RETRY_QUEUE = 'orders-retry-queue';
export const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

export { MAIN_EXCHANGE, MAIN_QUEUE };

export const setupQueues = async (channel: Channel): Promise<void> => {
  await channel.assertExchange(MAIN_EXCHANGE, 'direct', { durable: true });
  await channel.assertExchange(DLQ_EXCHANGE, 'direct', { durable: true });
  await channel.assertQueue(DLQ_QUEUE, { durable: true });
  await channel.bindQueue(DLQ_QUEUE, DLQ_EXCHANGE, '');
  await channel.assertExchange(RETRY_EXCHANGE, 'direct', { durable: true });
  await channel.assertQueue(RETRY_QUEUE, { durable: true, arguments: { 'x-dead-letter-exchange': MAIN_EXCHANGE, 'x-message-ttl': RETRY_DELAY_MS } });
  await channel.bindQueue(RETRY_QUEUE, RETRY_EXCHANGE, '');
  await channel.assertQueue(MAIN_QUEUE, { durable: true, arguments: { 'x-dead-letter-exchange': DLQ_EXCHANGE } });
  await channel.bindQueue(MAIN_QUEUE, MAIN_EXCHANGE, '');
};
