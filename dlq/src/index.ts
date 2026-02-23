import { connectRabbitMQ } from '../../shared/src/rabbitmq/client';
import { createLogger } from '../../shared/src/logger';
import { setupQueues } from './producer/setup';
import { startMainConsumer } from './consumer/main.consumer';
import { startDLQConsumer } from './consumer/dlq.consumer';
const logger = createLogger('dlq');
const main = async () => {
  const channel = await connectRabbitMQ();
  logger.info('RabbitMQ connected');
  await setupQueues(channel);
  await startMainConsumer(channel, logger);
  await startDLQConsumer(channel, logger);
  logger.info('DLQ pattern running');
};
main().catch(err => { console.error('Fatal:', err); process.exit(1); });
