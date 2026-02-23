import { Producer } from 'kafkajs';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';

type SagaState = 'STARTED' | 'INVENTORY_RESERVING' | 'PAYMENT_PROCESSING' | 'COMPLETED' | 'COMPENSATING' | 'FAILED';

interface SagaContext {
  sagaId: string;
  orderId: string;
  state: SagaState;
  createdAt: string;
  updatedAt: string;
}

const sagas = new Map<string, SagaContext>();

export class SagaOrchestrator {
  constructor(private producer: Producer, private logger: Logger) {}

  async handle(topic: string, event: any): Promise<void> {
    switch (topic) {
      case 'order.created':            return this.onOrderCreated(event);
      case 'inventory.reserved':       return this.onInventoryReserved(event);
      case 'inventory.reserve_failed': return this.onInventoryFailed(event);
      case 'payment.processed':        return this.onPaymentProcessed(event);
      case 'payment.failed':           return this.onPaymentFailed(event);
      case 'inventory.released':       return this.onInventoryReleased(event);
    }
  }

  private async onOrderCreated(event: { orderId: string; userId: string; items: any[] }) {
    const sagaId = uuidv4();
    sagas.set(sagaId, { sagaId, orderId: event.orderId, state: 'INVENTORY_RESERVING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    this.logger.info('Saga started', { sagaId, orderId: event.orderId });
    await this.emit('inventory.reserve', { sagaId, orderId: event.orderId, items: event.items });
  }

  private async onInventoryReserved(event: { sagaId: string; orderId: string }) {
    const saga = sagas.get(event.sagaId);
    if (!saga) return;
    saga.state = 'PAYMENT_PROCESSING';
    await this.emit('payment.process', { sagaId: event.sagaId, orderId: event.orderId });
  }

  private async onInventoryFailed(event: { sagaId: string; orderId: string; reason: string }) {
    const saga = sagas.get(event.sagaId);
    if (!saga) return;
    saga.state = 'FAILED';
    await this.emit('order.failed', { sagaId: event.sagaId, orderId: event.orderId, reason: event.reason });
  }

  private async onPaymentProcessed(event: { sagaId: string; orderId: string }) {
    const saga = sagas.get(event.sagaId);
    if (!saga) return;
    saga.state = 'COMPLETED';
    this.logger.info('Saga completed', { sagaId: event.sagaId });
    await this.emit('order.confirmed', { sagaId: event.sagaId, orderId: event.orderId });
  }

  private async onPaymentFailed(event: { sagaId: string; orderId: string; reason: string }) {
    const saga = sagas.get(event.sagaId);
    if (!saga) return;
    saga.state = 'COMPENSATING';
    this.logger.warn('Payment failed — compensating', { sagaId: event.sagaId });
    await this.emit('inventory.release', { sagaId: event.sagaId, orderId: event.orderId });
  }

  private async onInventoryReleased(event: { sagaId: string; orderId: string }) {
    const saga = sagas.get(event.sagaId);
    if (!saga) return;
    saga.state = 'FAILED';
    await this.emit('order.failed', { sagaId: event.sagaId, orderId: event.orderId, reason: 'Payment failed, inventory released' });
  }

  private async emit(topic: string, payload: object) {
    await this.producer.send({ topic, messages: [{ value: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }) }] });
    this.logger.info(`Emitted: ${topic}`);
  }
}
