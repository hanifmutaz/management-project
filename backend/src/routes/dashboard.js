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
  // Kerjaan Terakhir: sekarang ikut bawa status task terkait (kalau log-nya nempel ke task)
  // + created_at (udah ada dari w.*) buat itung "X lalu" di frontend.
  const recentLogs = (await query(`SELECT w.*, p.name AS project_name, p.color, p.type AS project_type, t.status AS task_status
    FROM work_logs w JOIN projects p ON p.id=w.project_id LEFT JOIN tasks t ON t.id=w.task_id
    ORDER BY w.log_date DESC, w.id DESC LIMIT 8`)).rows;
  const dueSoon = (await query(`SELECT t.*, p.name AS project_name, p.color FROM tasks t JOIN projects p ON p.id=t.project_id
    WHERE t.status<>'done' AND t.due_date IS NOT NULL AND t.due_date <= CURRENT_DATE + INTERVAL '7 days' ORDER BY t.due_date LIMIT 8`)).rows;
  // Today's Tasks: semua task due HARI INI (semua status, biar progress "x/y selesai" bisa dihitung
  // dari array ini langsung di frontend — ga perlu query count terpisah).
  const tasksToday = (await query(`SELECT t.*, p.name AS project_name, p.color FROM tasks t JOIN projects p ON p.id=t.project_id
    WHERE t.due_date = CURRENT_DATE
    ORDER BY (t.status='done'), CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.id`)).rows;
  res.json({ kpi: { ...kpi, streak }, hoursByDay, hoursByType, stale, recentLogs, dueSoon, tasksToday });
}));

r.get('/analytics', ah(async (_req, res) => {
  const byTypeHours = (await query('SELECT * FROM v_hours_by_type')).rows;
  const incomeByMonth = (await query(`SELECT to_char(paid_date,'YYYY-MM') AS month, SUM(amount) AS income
    FROM payments WHERE status='paid' AND paid_date IS NOT NULL AND currency='IDR' GROUP BY 1 ORDER BY 1`)).rows;
  const topProjects = (await query(`SELECT name,type,color,total_hours FROM v_project_summary ORDER BY total_hours DESC LIMIT 8`)).rows;
  res.json({ byTypeHours, incomeByMonth, topProjects });
}));

export default r;
