import { v4 as uuidv4 } from 'uuid';

export interface DomainEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Record<string, unknown>;
  version: number;
  occurredAt: string;
}

const store: DomainEvent[] = [];

export const appendEvent = (aggregateId: string, aggregateType: string, eventType: string, payload: Record<string, unknown>, expectedVersion: number): DomainEvent => {
  const current = getAggregateVersion(aggregateId);
  if (current !== expectedVersion) throw new Error(`Concurrency conflict: expected ${expectedVersion}, got ${current}`);
  const event: DomainEvent = { eventId: uuidv4(), aggregateId, aggregateType, eventType, payload, version: expectedVersion + 1, occurredAt: new Date().toISOString() };
  store.push(event);
  return event;
};

export const getEvents = (aggregateId: string) => store.filter(e => e.aggregateId === aggregateId).sort((a, b) => a.version - b.version);
export const getAllEvents = () => [...store];
export const getAggregateVersion = (aggregateId: string): number => { const e = getEvents(aggregateId); return e.length === 0 ? 0 : e[e.length - 1].version; };
