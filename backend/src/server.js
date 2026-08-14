import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import entityRoutes from './routes/entities.js';
import dashboardRoutes from './routes/dashboard.js';
import evidenceRoutes from './routes/evidence.js';
import approvalRoutes from './routes/approvals.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true, service: 'ProjectHub API', version: '1.0', ts: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', entityRoutes);          // tasks, milestones, deliverables, issues, risks, actions, decisions
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: err.message }); });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 ProjectHub API running on http://localhost:${PORT}`));
