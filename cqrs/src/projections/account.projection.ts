import { DomainEvent, getAllEvents } from '../store/event-store';

interface AccountReadModel { id: string; owner: string; balance: number; totalDeposits: number; totalWithdrawals: number; transactionCount: number; lastUpdated: string; }

const models = new Map<string, AccountReadModel>();

export const applyEvent = (e: DomainEvent): void => {
  const m = models.get(e.aggregateId) || { id: e.aggregateId, owner: '', balance: 0, totalDeposits: 0, totalWithdrawals: 0, transactionCount: 0, lastUpdated: '' };
  switch (e.eventType) {
    case 'AccountOpened':   models.set(e.aggregateId, { ...m, owner: e.payload.owner as string, lastUpdated: e.occurredAt }); break;
    case 'MoneyDeposited':  models.set(e.aggregateId, { ...m, balance: m.balance + (e.payload.amount as number), totalDeposits: m.totalDeposits + (e.payload.amount as number), transactionCount: m.transactionCount + 1, lastUpdated: e.occurredAt }); break;
    case 'MoneyWithdrawn':  models.set(e.aggregateId, { ...m, balance: m.balance - (e.payload.amount as number), totalWithdrawals: m.totalWithdrawals + (e.payload.amount as number), transactionCount: m.transactionCount + 1, lastUpdated: e.occurredAt }); break;
  }
};

export const rebuildProjections = () => { models.clear(); getAllEvents().forEach(applyEvent); };
export const getAccountReadModel = (id: string) => models.get(id);
export const getAllAccounts = () => [...models.values()];
