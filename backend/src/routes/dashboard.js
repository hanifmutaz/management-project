import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';
const r = Router();
r.get('/', authRequired, async (_req, res, next) => {
  try {
    const kpi = (await query('SELECT * FROM v_dashboard_kpi')).rows[0];
    const perProject = (await query('SELECT project_code,name,avg_progress,health,health_reason,done_tasks,total_tasks,owner FROM v_project_stats ORDER BY project_code')).rows;
    const attention = (await query(`SELECT project_code,name,health,health_reason,avg_progress,owner FROM v_project_stats
      WHERE health IN ('at_risk','critical','watch')
      ORDER BY CASE health WHEN 'critical' THEN 0 WHEN 'at_risk' THEN 1 ELSE 2 END`)).rows;
    const statusDist = (await query(`SELECT status, COUNT(*)::int count FROM tasks GROUP BY status`)).rows;
    res.json({ kpi, perProject, attention, statusDist });
  } catch (e) { next(e); }
});
export default r;
