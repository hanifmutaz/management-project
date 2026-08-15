import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields, checkEnum, ApiError } from '../lib/validate.js';

const r = Router();
const STATUSES = ['todo', 'doing', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

r.get('/', ah(async (req, res) => {
  const { project_id, status } = req.query;
  const cond = [], vals = [];
  if (project_id) { vals.push(project_id); cond.push(`t.project_id=$${vals.length}`); }
  if (status)     { vals.push(status);     cond.push(`t.status=$${vals.length}`); }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  res.json((await query(`SELECT t.*, p.name AS project_name, p.type AS project_type, p.color
    FROM tasks t JOIN projects p ON p.id=t.project_id ${where} ORDER BY t.status, t.due_date NULLS LAST, t.id`, vals)).rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id', 'title']);
  checkEnum(b.status, 'Status', STATUSES);
  checkEnum(b.priority, 'Prioritas', PRIORITIES);
  const t = (await query(`INSERT INTO tasks (project_id,title,status,priority,due_date,tags)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [b.project_id,b.title,b.status||'todo',b.priority||'medium',b.due_date,b.tags||[]])).rows[0];
  res.status(201).json(t);
}));

r.patch('/:id/status', ah(async (req, res) => {
  checkEnum(req.body.status, 'Status', STATUSES);
  requireFields(req.body, ['status']);
  const t = (await query('UPDATE tasks SET status=$2 WHERE id=$1 RETURNING *', [req.params.id, req.body.status])).rows[0];
  if (!t) throw new ApiError(404, 'Task not found');
  res.json(t);
}));

r.put('/:id', ah(async (req, res) => {
  const b = req.body;
  checkEnum(b.status, 'Status', STATUSES);
  checkEnum(b.priority, 'Prioritas', PRIORITIES);
  const t = (await query(`UPDATE tasks SET title=COALESCE($2,title),status=COALESCE($3,status),priority=COALESCE($4,priority),due_date=$5,tags=COALESCE($6,tags) WHERE id=$1 RETURNING *`,
    [req.params.id,b.title,b.status,b.priority,b.due_date,b.tags])).rows[0];
  if (!t) throw new ApiError(404, 'Task not found');
  res.json(t);
}));

r.delete('/:id', ah(async (req, res) => {
  await query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}));

export default r;
