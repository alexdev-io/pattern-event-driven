import { appendEvent, getEvents } from '../store/event-store';
import { v4 as uuidv4 } from 'uuid';

interface Account { id: string; owner: string; balance: number; version: number; }

export const rehydrate = (id: string): Account | null => {
  const events = getEvents(id);
  if (!events.length) return null;
  return events.reduce((s, e) => {
    switch (e.eventType) {
      case 'AccountOpened':   return { ...s, id: e.aggregateId, owner: e.payload.owner as string, balance: 0, version: e.version };
      case 'MoneyDeposited':  return { ...s, balance: s.balance + (e.payload.amount as number), version: e.version };
      case 'MoneyWithdrawn':  return { ...s, balance: s.balance - (e.payload.amount as number), version: e.version };
      default: return s;
    }
  }, {} as Account);
};

export const openAccount = (owner: string) => appendEvent(uuidv4(), 'Account', 'AccountOpened', { owner }, 0);
export const deposit = (id: string, amount: number) => { const a = rehydrate(id); if (!a) throw new Error('Not found'); if (amount <= 0) throw new Error('Must be positive'); return appendEvent(id, 'Account', 'MoneyDeposited', { amount }, a.version); };
export const withdraw = (id: string, amount: number) => { const a = rehydrate(id); if (!a) throw new Error('Not found'); if (a.balance < amount) throw new Error('Insufficient funds'); return appendEvent(id, 'Account', 'MoneyWithdrawn', { amount }, a.version); };
