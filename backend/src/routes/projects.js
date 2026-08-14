import { Router } from 'express';
import { query } from '../db.js';
const r = Router();
r.get('/', async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const cond = [], vals = [];
    if (type)   { vals.push(type);   cond.push(`type=$${vals.length}`); }
    if (status) { vals.push(status); cond.push(`status=$${vals.length}`); }
    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
    res.json((await query(`SELECT * FROM v_project_summary ${where} ORDER BY pinned DESC,
      CASE status WHEN 'active' THEN 0 WHEN 'on_hold' THEN 1 WHEN 'done' THEN 2 ELSE 3 END, last_activity DESC NULLS LAST`, vals)).rows);
  } catch (e) { next(e); }
});
r.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const p = (await query('SELECT * FROM v_project_summary WHERE id=$1', [id])).rows[0];
    if (!p) return res.status(404).json({ error: 'Project not found' });
    const [tasks, logs, pays] = await Promise.all([
      query('SELECT * FROM tasks WHERE project_id=$1 ORDER BY status, sort_order, id', [id]),
      query('SELECT w.*, t.title AS task_title FROM work_logs w LEFT JOIN tasks t ON t.id=w.task_id WHERE w.project_id=$1 ORDER BY log_date DESC, id DESC', [id]),
      query('SELECT * FROM payments WHERE project_id=$1 ORDER BY created_at', [id]),
    ]);
    res.json({ ...p, tasks: tasks.rows, work_logs: logs.rows, payments: pays.rows });
  } catch (e) { next(e); }
});
r.post('/', async (req, res, next) => {
  try {
    const b = req.body;
    const p = (await query(`INSERT INTO projects
      (name,type,status,description,client_name,rate_type,rate,currency,color,tags,notes,pinned,start_date,due_date,last_activity)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CURRENT_DATE) RETURNING *`,
      [b.name,b.type||'personal',b.status||'active',b.description,b.client_name,b.rate_type||'none',
       b.rate||0,b.currency||'IDR',b.color||'#5b8cff',b.tags||[],b.notes,!!b.pinned,b.start_date,b.due_date])).rows[0];
    res.status(201).json(p);
  } catch (e) { next(e); }
});
r.put('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const p = (await query(`UPDATE projects SET name=COALESCE($2,name),type=COALESCE($3,type),status=COALESCE($4,status),
      description=$5,client_name=$6,rate_type=COALESCE($7,rate_type),rate=COALESCE($8,rate),currency=COALESCE($9,currency),
      color=COALESCE($10,color),tags=COALESCE($11,tags),notes=$12,start_date=$13,due_date=$14,pinned=COALESCE($15,pinned),updated_at=now()
      WHERE id=$1 RETURNING *`,
      [req.params.id,b.name,b.type,b.status,b.description,b.client_name,b.rate_type,b.rate,b.currency,b.color,b.tags,b.notes,b.start_date,b.due_date,b.pinned])).rows[0];
    res.json(p);
  } catch (e) { next(e); }
});
r.patch('/:id/pin', async (req, res, next) => {
  try { const p = (await query('UPDATE projects SET pinned=NOT pinned WHERE id=$1 RETURNING *', [req.params.id])).rows[0]; res.json(p); }
  catch (e) { next(e); }
});
r.delete('/:id', async (req, res, next) => {
  try { await query('DELETE FROM projects WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { next(e); }
});
export default r;
