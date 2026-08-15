import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import worklogRoutes from './routes/worklogs.js';
import paymentRoutes from './routes/payments.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.json({ ok: true, service: 'MUTAZ OS API', ts: new Date() }));
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/worklogs', worklogRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  // ApiError (validation, 404s) messages are safe to show as-is.
  // Anything else (DB errors, bugs) only shows raw detail outside production.
  const isKnown = status < 500;
  const message = isKnown || process.env.NODE_ENV !== 'production' ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 MUTAZ OS API running on http://localhost:${PORT}`));
