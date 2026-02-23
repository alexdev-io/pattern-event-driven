import express from 'express';
import { openAccount, deposit, withdraw } from './commands/account.commands';
import { getAccountReadModel, getAllAccounts, applyEvent } from './projections/account.projection';
import { createLogger } from '../../shared/src/logger';

const app = express();
const logger = createLogger('cqrs');
app.use(express.json());

app.post('/accounts', (req, res) => { try { const e = openAccount(req.body.owner); applyEvent(e); res.status(201).json({ accountId: e.aggregateId, event: e }); } catch (err: any) { res.status(400).json({ error: err.message }); } });
app.post('/accounts/:id/deposit', (req, res) => { try { const e = deposit(req.params.id, Number(req.body.amount)); applyEvent(e); res.json({ event: e }); } catch (err: any) { res.status(400).json({ error: err.message }); } });
app.post('/accounts/:id/withdraw', (req, res) => { try { const e = withdraw(req.params.id, Number(req.body.amount)); applyEvent(e); res.json({ event: e }); } catch (err: any) { res.status(400).json({ error: err.message }); } });
app.get('/accounts', (_req, res) => res.json(getAllAccounts()));
app.get('/accounts/:id', (req, res) => { const a = getAccountReadModel(req.params.id); if (!a) { res.status(404).json({ error: 'Not found' }); return; } res.json(a); });
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'cqrs' }));

app.listen(3010, () => logger.info('CQRS service running on port 3010'));
