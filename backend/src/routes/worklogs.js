import { Router } from 'express';
import { query } from '../db.js';
const r = Router();
r.get('/', async (req, res, next) => {
  try {
    const { project_id, from, to, billable } = req.query;
    const cond = [], vals = [];
    if (project_id) { vals.push(project_id); cond.push(`w.project_id=$${vals.length}`); }
    if (from)       { vals.push(from); cond.push(`w.log_date >= $${vals.length}`); }
    if (to)         { vals.push(to);   cond.push(`w.log_date <= $${vals.length}`); }
    if (billable === 'true') cond.push('w.billable = true');
    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
    res.json((await query(`SELECT w.*, p.name AS project_name, p.type AS project_type, p.color, t.title AS task_title
      FROM work_logs w JOIN projects p ON p.id=w.project_id LEFT JOIN tasks t ON t.id=w.task_id
      ${where} ORDER BY w.log_date DESC, w.id DESC LIMIT 300`, vals)).rows);
  } catch (e) { next(e); }
});
r.post('/', async (req, res, next) => {
  try {
    const b = req.body;
    const w = (await query(`INSERT INTO work_logs (project_id,task_id,log_date,description,hours,billable)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [b.project_id,b.task_id||null,b.log_date||new Date(),b.description,b.hours||0,!!b.billable])).rows[0];
    res.status(201).json(w);
  } catch (e) { next(e); }
});
r.put('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const w = (await query(`UPDATE work_logs SET task_id=$2,log_date=COALESCE($3,log_date),description=COALESCE($4,description),hours=COALESCE($5,hours),billable=$6 WHERE id=$1 RETURNING *`,
      [req.params.id,b.task_id||null,b.log_date,b.description,b.hours,!!b.billable])).rows[0];
    res.json(w);
  } catch (e) { next(e); }
});
r.delete('/:id', async (req, res, next) => {
  try { await query('DELETE FROM work_logs WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});
export default r;
