import amqp, { Channel, Connection } from 'amqplib';

let connection: Connection;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<Channel> => {
  connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
  channel = await connection.createChannel();
  return channel;
};

export const getChannel = (): Channel => {
  if (!channel) throw new Error('RabbitMQ not connected. Call connectRabbitMQ() first.');
  return channel;
};
