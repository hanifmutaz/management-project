import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../lib/validate.js';

const r = Router();

// The client sends its own local date (?today=YYYY-MM-DD). The database server usually runs in
// UTC, so CURRENT_DATE would be "yesterday" for a user in UTC+7 until 07:00 local time.
const todayParam = (q) => (/^\d{4}-\d{2}-\d{2}$/.test(q || '') ? q : new Date().toISOString().slice(0, 10));

r.get('/', ah(async (req, res) => {
  const today = todayParam(req.query.today);
  const streak = (await query('SELECT fn_streak() AS streak')).rows[0].streak;

  // Every task that is not done, plus tasks that were due today and are already done,
  // so the "x / y" counter for today can be computed in the frontend.
  const tasks = (await query(`SELECT t.id, t.title, t.status, t.priority, t.due_date, t.project_id,
      p.name AS project_name, p.type::text AS project_type, p.color, p.client_name
    FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.status <> 'done' OR t.due_date = $1::date
    ORDER BY t.due_date NULLS LAST,
      CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.id`, [today])).rows;

  // Hours per day per workspace for the last 14 days (the frontend zero-fills missing days).
  const hoursByDayType = (await query(`SELECT to_char(w.log_date, 'YYYY-MM-DD') AS day, p.type::text AS type, SUM(w.hours) AS hours
    FROM work_logs w JOIN projects p ON p.id = w.project_id
    WHERE w.log_date BETWEEN $1::date - 13 AND $1::date
    GROUP BY 1, 2 ORDER BY 1`, [today])).rows;

  // This week (Monday to today) per project; the frontend rolls it up per workspace / client.
  const weekProjects = (await query(`SELECT p.id, p.name, p.type::text AS type, p.color, p.client_name, SUM(w.hours) AS hours
    FROM work_logs w JOIN projects p ON p.id = w.project_id
    WHERE w.log_date BETWEEN date_trunc('week', $1::date)::date AND $1::date
    GROUP BY p.id ORDER BY hours DESC`, [today])).rows;

  const hours = (await query(`SELECT
      COALESCE(SUM(hours) FILTER (WHERE log_date >= date_trunc('week', $1::date)::date AND log_date <= $1::date), 0) AS this_week,
      COALESCE(SUM(hours) FILTER (WHERE log_date >= date_trunc('week', $1::date)::date - 7 AND log_date < date_trunc('week', $1::date)::date), 0) AS last_week
    FROM work_logs`, [today])).rows[0];

  const recentLogs = (await query(`SELECT w.id, w.project_id, w.description, w.hours, w.log_date, w.created_at,
      p.name AS project_name, p.type::text AS project_type, p.color
    FROM work_logs w JOIN projects p ON p.id = w.project_id
    ORDER BY w.log_date DESC, w.id DESC LIMIT 6`)).rows;

  res.json({ streak, tasks, hoursByDayType, weekProjects, hours, recentLogs });
}));

r.get('/analytics', ah(async (req, res) => {
  const today = todayParam(req.query.today);
  const byTypeHours = (await query('SELECT * FROM v_hours_by_type')).rows;
  const incomeByMonth = (await query(`SELECT to_char(paid_date,'YYYY-MM') AS month, SUM(amount) AS income
    FROM payments WHERE status='paid' AND paid_date IS NOT NULL AND currency='IDR' GROUP BY 1 ORDER BY 1`)).rows;
  const topProjects = (await query(`SELECT name,type,color,total_hours FROM v_project_summary ORDER BY total_hours DESC LIMIT 8`)).rows;
  // Weekly hours per workspace for the last 8 weeks, zero-filled (always 8 weeks x every
  // proj_type) so the trend lines never have gaps.
  const hoursTrend = (await query(`
    WITH weeks AS (
      SELECT generate_series(date_trunc('week', $1::date) - INTERVAL '7 weeks', date_trunc('week', $1::date), INTERVAL '1 week')::date AS wk
    ), types AS (SELECT unnest(enum_range(NULL::proj_type)) AS type)
    SELECT to_char(weeks.wk, 'YYYY-MM-DD') AS week, types.type::text AS type, COALESCE(SUM(l.hours), 0) AS hours
    FROM weeks CROSS JOIN types
    LEFT JOIN projects p ON p.type = types.type
    LEFT JOIN work_logs l ON l.project_id = p.id AND l.log_date >= weeks.wk AND l.log_date < weeks.wk + 7
    GROUP BY weeks.wk, types.type ORDER BY weeks.wk, types.type`, [today])).rows;
  res.json({ byTypeHours, incomeByMonth, topProjects, hoursTrend });
}));

export default r;
