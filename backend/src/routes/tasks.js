import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();

// GET /api/tasks?project_id=&status=&pic_id=  — filterable
r.get('/', authRequired, async (req, res, next) => {
  try {
    const { project_id, status, pic_id } = req.query;
    const cond = [], vals = [];
    if (project_id) { vals.push(project_id); cond.push(`project_id=$${vals.length}`); }
    if (status)     { vals.push(status);     cond.push(`status=$${vals.length}`); }
    if (pic_id)     { vals.push(pic_id);      cond.push(`pic_id=$${vals.length}`); }
    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
    const { rows } = await query(`SELECT * FROM tasks ${where} ORDER BY task_code`, vals);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/tasks/:id/history — evidence trail
r.get('/:id/history', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM task_updates WHERE task_id=$1 ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/tasks
r.post('/', authRequired, async (req, res, next) => {
  try {
    const { project_id, task_code, name, category, pic_id, start_date, due_date,
            status, priority, progress, constraint_note, next_action } = req.body;
    const { rows } = await query(`
      INSERT INTO tasks (project_id,task_code,name,category,pic_id,start_date,due_date,status,priority,progress,constraint_note,next_action)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [project_id, task_code, name, category, pic_id, start_date, due_date,
       status || 'not_started', priority || 'medium', progress || 0, constraint_note, next_action]);
    res.status(201).json(rows[0]);   // health dihitung otomatis oleh trigger
  } catch (e) { next(e); }
});

// PATCH /api/tasks/:id/status  — quick update (trigger auto-log ke task_updates)
r.patch('/:id/status', authRequired, async (req, res, next) => {
  try {
    const { status, progress } = req.body;
    const { rows } = await query(`
      UPDATE tasks SET status=COALESCE($2,status), progress=COALESCE($3,progress)
      WHERE id=$1 RETURNING *`, [req.params.id, status, progress]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// PUT /api/tasks/:id
r.put('/:id', authRequired, async (req, res, next) => {
  try {
    const f = req.body;
    const { rows } = await query(`
      UPDATE tasks SET name=COALESCE($2,name), category=COALESCE($3,category),
        pic_id=COALESCE($4,pic_id), due_date=COALESCE($5,due_date),
        status=COALESCE($6,status), priority=COALESCE($7,priority),
        progress=COALESCE($8,progress), constraint_note=COALESCE($9,constraint_note),
        next_action=COALESCE($10,next_action)
      WHERE id=$1 RETURNING *`,
      [req.params.id, f.name, f.category, f.pic_id, f.due_date, f.status,
       f.priority, f.progress, f.constraint_note, f.next_action]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// DELETE /api/tasks/:id
r.delete('/:id', authRequired, async (req, res, next) => {
  try { await query('DELETE FROM tasks WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { next(e); }
});

export default r;
