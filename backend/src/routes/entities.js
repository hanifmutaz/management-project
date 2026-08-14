// CRUD generic untuk tasks, milestones, deliverables, issues, risks, actions, decisions.
// Health project di-refresh otomatis oleh trigger DB.
import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';
const r = Router();

/* ---------- TASKS ---------- */
r.post('/tasks', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    // auto task_code: P00X.N
    const proj = (await query('SELECT project_code FROM projects WHERE id=$1', [b.project_id])).rows[0];
    const cnt = (await query('SELECT COUNT(*)::int c FROM tasks WHERE project_id=$1', [b.project_id])).rows[0].c + 1;
    const code = b.task_code || `${proj.project_code}.${cnt}`;
    const t = (await query(`INSERT INTO tasks
      (project_id,milestone_id,deliverable_id,task_code,title,category,pic_id,start_date,due_date,status,priority,progress,constraint_note,next_action)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [b.project_id,b.milestone_id,b.deliverable_id,code,b.title,b.category,b.pic_id,b.start_date,b.due_date,
       b.status||'not_started',b.priority||'medium',b.progress||0,b.constraint_note,b.next_action])).rows[0];
    res.status(201).json(t);
  } catch (e) { next(e); }
});
r.put('/tasks/:id', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const t = (await query(`UPDATE tasks SET title=COALESCE($2,title),category=COALESCE($3,category),pic_id=COALESCE($4,pic_id),
      due_date=COALESCE($5,due_date),start_date=COALESCE($6,start_date),status=COALESCE($7,status),priority=COALESCE($8,priority),
      progress=COALESCE($9,progress),constraint_note=$10,next_action=$11 WHERE id=$1 RETURNING *`,
      [req.params.id,b.title,b.category,b.pic_id,b.due_date,b.start_date,b.status,b.priority,b.progress,b.constraint_note,b.next_action])).rows[0];
    res.json(t);
  } catch (e) { next(e); }
});
r.delete('/tasks/:id', authRequired, async (req, res, next) => {
  try { await query('DELETE FROM tasks WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});

/* ---------- MILESTONES ---------- */
r.post('/milestones', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const m = (await query(`INSERT INTO milestones (project_id,name,description,owner_id,target_date,status,progress,sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [b.project_id,b.name,b.description,b.owner_id,b.target_date,b.status||'not_started',b.progress||0,b.sort_order||0])).rows[0];
    res.status(201).json(m);
  } catch (e) { next(e); }
});
r.put('/milestones/:id', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const m = (await query(`UPDATE milestones SET name=COALESCE($2,name),owner_id=COALESCE($3,owner_id),
      target_date=COALESCE($4,target_date),status=COALESCE($5,status),progress=COALESCE($6,progress),updated_at=now()
      WHERE id=$1 RETURNING *`, [req.params.id,b.name,b.owner_id,b.target_date,b.status,b.progress])).rows[0];
    res.json(m);
  } catch (e) { next(e); }
});
r.delete('/milestones/:id', authRequired, async (req, res, next) => {
  try { await query('DELETE FROM milestones WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});

/* ---------- DELIVERABLES ---------- */
r.post('/deliverables', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const d = (await query(`INSERT INTO deliverables (project_id,milestone_id,name,description,owner_id,target_date,status,progress)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [b.project_id,b.milestone_id,b.name,b.description,b.owner_id,b.target_date,b.status||'not_started',b.progress||0])).rows[0];
    res.status(201).json(d);
  } catch (e) { next(e); }
});
r.put('/deliverables/:id', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const d = (await query(`UPDATE deliverables SET name=COALESCE($2,name),owner_id=COALESCE($3,owner_id),
      target_date=COALESCE($4,target_date),status=COALESCE($5,status),progress=COALESCE($6,progress),updated_at=now()
      WHERE id=$1 RETURNING *`, [req.params.id,b.name,b.owner_id,b.target_date,b.status,b.progress])).rows[0];
    res.json(d);
  } catch (e) { next(e); }
});
r.delete('/deliverables/:id', authRequired, async (req, res, next) => {
  try { await query('DELETE FROM deliverables WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});

/* ---------- ISSUES ---------- */
r.post('/issues', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const i = (await query(`INSERT INTO issues (project_id,task_id,title,description,severity,impact,status,owner_id,target_date,next_action)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [b.project_id,b.task_id,b.title,b.description,b.severity||'medium',b.impact,b.status||'open',b.owner_id,b.target_date,b.next_action])).rows[0];
    await query(`INSERT INTO audit_log (project_id,user_id,action,entity_type,entity_ref,detail) VALUES ($1,$2,'created','issue',$3,$4)`,
      [b.project_id, req.user.id, 'ISS-'+i.id, b.title]);
    res.status(201).json(i);
  } catch (e) { next(e); }
});
r.put('/issues/:id', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const i = (await query(`UPDATE issues SET title=COALESCE($2,title),severity=COALESCE($3,severity),impact=$4,
      status=COALESCE($5,status),owner_id=COALESCE($6,owner_id),target_date=COALESCE($7,target_date),next_action=$8
      WHERE id=$1 RETURNING *`, [req.params.id,b.title,b.severity,b.impact,b.status,b.owner_id,b.target_date,b.next_action])).rows[0];
    res.json(i);
  } catch (e) { next(e); }
});
r.delete('/issues/:id', authRequired, async (req, res, next) => {
  try { await query('DELETE FROM issues WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});

/* ---------- RISKS ---------- */
r.post('/risks', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const x = (await query(`INSERT INTO risks (project_id,title,description,probability,impact,owner_id,mitigation,status,target_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [b.project_id,b.title,b.description,b.probability||'medium',b.impact||'medium',b.owner_id,b.mitigation,b.status||'identified',b.target_date])).rows[0];
    res.status(201).json(x);
  } catch (e) { next(e); }
});
r.put('/risks/:id', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const x = (await query(`UPDATE risks SET title=COALESCE($2,title),probability=COALESCE($3,probability),impact=COALESCE($4,impact),
      owner_id=COALESCE($5,owner_id),mitigation=$6,status=COALESCE($7,status) WHERE id=$1 RETURNING *`,
      [req.params.id,b.title,b.probability,b.impact,b.owner_id,b.mitigation,b.status])).rows[0];
    res.json(x);
  } catch (e) { next(e); }
});
r.delete('/risks/:id', authRequired, async (req, res, next) => {
  try { await query('DELETE FROM risks WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});

/* ---------- ACTIONS ---------- */
r.post('/actions', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const a = (await query(`INSERT INTO actions (project_id,title,owner_id,due_date,priority,status,related_issue,related_risk,related_decision)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [b.project_id,b.title,b.owner_id,b.due_date,b.priority||'medium',b.status||'open',b.related_issue,b.related_risk,b.related_decision])).rows[0];
    res.status(201).json(a);
  } catch (e) { next(e); }
});
r.put('/actions/:id', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const a = (await query(`UPDATE actions SET title=COALESCE($2,title),owner_id=COALESCE($3,owner_id),due_date=COALESCE($4,due_date),
      status=COALESCE($5,status),result=$6 WHERE id=$1 RETURNING *`, [req.params.id,b.title,b.owner_id,b.due_date,b.status,b.result])).rows[0];
    res.json(a);
  } catch (e) { next(e); }
});
r.delete('/actions/:id', authRequired, async (req, res, next) => {
  try { await query('DELETE FROM actions WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});

/* ---------- DECISIONS ---------- */
r.post('/decisions', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const d = (await query(`INSERT INTO decisions (project_id,title,description,made_by,reason,impact,related_issue,related_risk)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [b.project_id,b.title,b.description,b.made_by||req.user.id,b.reason,b.impact,b.related_issue,b.related_risk])).rows[0];
    res.status(201).json(d);
  } catch (e) { next(e); }
});
r.put('/decisions/:id', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const d = (await query(`UPDATE decisions SET title=COALESCE($2,title),reason=$3,impact=$4 WHERE id=$1 RETURNING *`,
      [req.params.id,b.title,b.reason,b.impact])).rows[0];
    res.json(d);
  } catch (e) { next(e); }
});
r.delete('/decisions/:id', authRequired, async (req, res, next) => {
  try { await query('DELETE FROM decisions WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});

export default r;
