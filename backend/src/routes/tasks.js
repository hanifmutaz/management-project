import { Router } from 'express';
import { query } from '../db.js';
const r = Router();
r.get('/', async (req, res, next) => {
  try {
    const { project_id, status } = req.query;
    const cond = [], vals = [];
    if (project_id) { vals.push(project_id); cond.push(`t.project_id=$${vals.length}`); }
    if (status)     { vals.push(status);     cond.push(`t.status=$${vals.length}`); }
    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
    res.json((await query(`SELECT t.*, p.name AS project_name, p.type AS project_type, p.color
      FROM tasks t JOIN projects p ON p.id=t.project_id ${where} ORDER BY t.status, t.due_date NULLS LAST, t.id`, vals)).rows);
  } catch (e) { next(e); }
});
r.post('/', async (req, res, next) => {
  try {
    const b = req.body;
    const t = (await query(`INSERT INTO tasks (project_id,title,status,priority,due_date,tags)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [b.project_id,b.title,b.status||'todo',b.priority||'medium',b.due_date,b.tags||[]])).rows[0];
    res.status(201).json(t);
  } catch (e) { next(e); }
});
r.patch('/:id/status', async (req, res, next) => {
  try { res.json((await query('UPDATE tasks SET status=$2 WHERE id=$1 RETURNING *', [req.params.id, req.body.status])).rows[0]); }
  catch (e) { next(e); }
});
r.put('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const t = (await query(`UPDATE tasks SET title=COALESCE($2,title),status=COALESCE($3,status),priority=COALESCE($4,priority),due_date=$5,tags=COALESCE($6,tags) WHERE id=$1 RETURNING *`,
      [req.params.id,b.title,b.status,b.priority,b.due_date,b.tags])).rows[0];
    res.json(t);
  } catch (e) { next(e); }
});
r.delete('/:id', async (req, res, next) => {
  try { await query('DELETE FROM tasks WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});
export default r;
