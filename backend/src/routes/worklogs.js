import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields, checkNumber, ApiError } from '../lib/validate.js';

const r = Router();

r.get('/', ah(async (req, res) => {
  const { project_id, from, to, billable, limit } = req.query;
  const cond = [], vals = [];
  if (project_id) { vals.push(project_id); cond.push(`w.project_id=$${vals.length}`); }
  if (from)       { vals.push(from); cond.push(`w.log_date >= $${vals.length}`); }
  if (to)         { vals.push(to);   cond.push(`w.log_date <= $${vals.length}`); }
  if (billable === 'true') cond.push('w.billable = true');
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  // No hard cap by default — this endpoint backs the Work Log page and CSV export,
  // both of which need the complete history, not a silently truncated slice.
  // Pass ?limit=N (e.g. for a "recent activity" widget) to cap it explicitly.
  let limitSql = '';
  if (limit) {
    const n = Number(limit);
    if (Number.isFinite(n) && n > 0) { vals.push(Math.floor(n)); limitSql = ` LIMIT $${vals.length}`; }
  }
  res.json((await query(`SELECT w.*, p.name AS project_name, p.type AS project_type, p.color, t.title AS task_title
    FROM work_logs w JOIN projects p ON p.id=w.project_id LEFT JOIN tasks t ON t.id=w.task_id
    ${where} ORDER BY w.log_date DESC, w.id DESC${limitSql}`, vals)).rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'description']);
  checkNumber(b.hours, 'Jam kerja', { notNegative: true });
  const w = (await query(`INSERT INTO work_logs (project_id,task_id,log_date,description,hours,billable)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [b.project_id,b.task_id||null,b.log_date||new Date(),b.description,b.hours||0,!!b.billable])).rows[0];
  res.status(201).json(w);
}));

r.put('/:id', ah(async (req, res) => {
  const b = req.body;
  checkNumber(b.hours, 'Jam kerja', { notNegative: true });
  const w = (await query(`UPDATE work_logs SET task_id=$2,log_date=COALESCE($3,log_date),description=COALESCE($4,description),hours=COALESCE($5,hours),billable=$6 WHERE id=$1 RETURNING *`,
    [req.params.id,b.task_id||null,b.log_date,b.description,b.hours,!!b.billable])).rows[0];
  if (!w) throw new ApiError(404, 'Work log not found');
  res.json(w);
}));

r.delete('/:id', ah(async (req, res) => {
  await query('DELETE FROM work_logs WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}));

export default r;
