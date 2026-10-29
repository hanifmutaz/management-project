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
  // Recent Work: also carries the linked task's status (when the log is attached to a task)
  // + created_at (already in w.*) so the frontend can compute "X ago".
  const recentLogs = (await query(`SELECT w.*, p.name AS project_name, p.color, p.type AS project_type, t.status AS task_status
    FROM work_logs w JOIN projects p ON p.id=w.project_id LEFT JOIN tasks t ON t.id=w.task_id
    ORDER BY w.log_date DESC, w.id DESC LIMIT 8`)).rows;
  const dueSoon = (await query(`SELECT t.*, p.name AS project_name, p.color FROM tasks t JOIN projects p ON p.id=t.project_id
    WHERE t.status<>'done' AND t.due_date IS NOT NULL AND t.due_date <= CURRENT_DATE + INTERVAL '7 days' ORDER BY t.due_date LIMIT 8`)).rows;
  // Today's Tasks: every task due TODAY (all statuses) so the "x/y done" progress can be
  // computed straight from this array in the frontend, no separate count query needed.
  const tasksToday = (await query(`SELECT t.*, p.name AS project_name, p.color FROM tasks t JOIN projects p ON p.id=t.project_id
    WHERE t.due_date = CURRENT_DATE
    ORDER BY (t.status='done'), CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.id`)).rows;
  // In Progress: every task currently "doing", regardless of due date, so work without a
  // deadline still shows up on the dashboard.
  const tasksDoing = (await query(`SELECT t.*, p.name AS project_name, p.color FROM tasks t JOIN projects p ON p.id=t.project_id
    WHERE t.status='doing'
    ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.due_date NULLS LAST, t.id LIMIT 10`)).rows;
  // Weekly hours per context (project type) for the last 8 weeks, zero-filled
  // (always 8 weeks x every proj_type) so the trend lines never have gaps.
  const hoursTrend = (await query(`
    WITH weeks AS (
      SELECT generate_series(date_trunc('week', CURRENT_DATE) - INTERVAL '7 weeks', date_trunc('week', CURRENT_DATE), INTERVAL '1 week')::date AS wk
    ), types AS (SELECT unnest(enum_range(NULL::proj_type)) AS type)
    SELECT to_char(weeks.wk, 'YYYY-MM-DD') AS week, types.type::text AS type, COALESCE(SUM(l.hours), 0) AS hours
    FROM weeks CROSS JOIN types
    LEFT JOIN projects p ON p.type = types.type
    LEFT JOIN work_logs l ON l.project_id = p.id AND l.log_date >= weeks.wk AND l.log_date < weeks.wk + 7
    GROUP BY weeks.wk, types.type ORDER BY weeks.wk, types.type`)).rows;
  res.json({ kpi: { ...kpi, streak }, hoursByDay, hoursByType, stale, recentLogs, dueSoon, tasksToday, tasksDoing, hoursTrend });
}));

r.get('/analytics', ah(async (_req, res) => {
  const byTypeHours = (await query('SELECT * FROM v_hours_by_type')).rows;
  const incomeByMonth = (await query(`SELECT to_char(paid_date,'YYYY-MM') AS month, SUM(amount) AS income
    FROM payments WHERE status='paid' AND paid_date IS NOT NULL AND currency='IDR' GROUP BY 1 ORDER BY 1`)).rows;
  const topProjects = (await query(`SELECT name,type,color,total_hours FROM v_project_summary ORDER BY total_hours DESC LIMIT 8`)).rows;
  res.json({ byTypeHours, incomeByMonth, topProjects });
}));

export default r;
