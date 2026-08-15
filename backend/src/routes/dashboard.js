import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../lib/validate.js';

const r = Router();

r.get('/', ah(async (_req, res) => {
  const kpi = (await query('SELECT * FROM v_dashboard')).rows[0];
  const streak = (await query('SELECT fn_streak() AS streak')).rows[0].streak;
  const hoursByDay = (await query('SELECT * FROM v_hours_by_day')).rows;
  const hoursByType = (await query('SELECT * FROM v_hours_by_type')).rows;
  const stale = (await query(`SELECT id,name,type,color,days_idle FROM v_project_summary
    WHERE status='active' AND days_idle >= 5 ORDER BY days_idle DESC LIMIT 6`)).rows;
  const recentLogs = (await query(`SELECT w.*, p.name AS project_name, p.color, p.type AS project_type
    FROM work_logs w JOIN projects p ON p.id=w.project_id ORDER BY w.log_date DESC, w.id DESC LIMIT 8`)).rows;
  const dueSoon = (await query(`SELECT t.*, p.name AS project_name, p.color FROM tasks t JOIN projects p ON p.id=t.project_id
    WHERE t.status<>'done' AND t.due_date IS NOT NULL AND t.due_date <= CURRENT_DATE + INTERVAL '7 days' ORDER BY t.due_date LIMIT 8`)).rows;
  res.json({ kpi: { ...kpi, streak }, hoursByDay, hoursByType, stale, recentLogs, dueSoon });
}));

r.get('/analytics', ah(async (_req, res) => {
  const byTypeHours = (await query('SELECT * FROM v_hours_by_type')).rows;
  const incomeByMonth = (await query(`SELECT to_char(paid_date,'YYYY-MM') AS month, SUM(amount) AS income
    FROM payments WHERE status='paid' AND paid_date IS NOT NULL AND currency='IDR' GROUP BY 1 ORDER BY 1`)).rows;
  const topProjects = (await query(`SELECT name,type,color,total_hours FROM v_project_summary ORDER BY total_hours DESC LIMIT 8`)).rows;
  res.json({ byTypeHours, incomeByMonth, topProjects });
}));

export default r;
