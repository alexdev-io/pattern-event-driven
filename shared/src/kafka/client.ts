import { Kafka, Producer, Consumer } from 'kafkajs';

export const createKafkaClient = (clientId: string) => new Kafka({
  clientId,
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

export const createProducer = async (kafka: Kafka): Promise<Producer> => {
  const producer = kafka.producer({ allowAutoTopicCreation: true });
  await producer.connect();
  return producer;
};

export const createConsumer = async (kafka: Kafka, groupId: string): Promise<Consumer> => {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
};
