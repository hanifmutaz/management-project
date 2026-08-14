import { Router } from 'express';
import { query, tx } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';
const r = Router();

// list + stats (health & reason sudah dihitung DB)
r.get('/', authRequired, async (_req, res, next) => {
  try { res.json((await query('SELECT * FROM v_project_stats ORDER BY project_code')).rows); }
  catch (e) { next(e); }
});

// detail lengkap: pusat informasi project
r.get('/:id', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const p = (await query('SELECT * FROM projects WHERE id=$1', [id])).rows[0];
    if (!p) return res.status(404).json({ error: 'Project not found' });
    const [ms, del, tasks, issues, risks, actions, decisions, evidence] = await Promise.all([
      query('SELECT m.*, u.full_name AS owner FROM milestones m LEFT JOIN users u ON u.id=m.owner_id WHERE m.project_id=$1 ORDER BY sort_order', [id]),
      query('SELECT d.*, u.full_name AS owner, mm.name AS ms FROM deliverables d LEFT JOIN users u ON u.id=d.owner_id LEFT JOIN milestones mm ON mm.id=d.milestone_id WHERE d.project_id=$1', [id]),
      query('SELECT t.*, u.full_name AS pic FROM tasks t LEFT JOIN users u ON u.id=t.pic_id WHERE t.project_id=$1 ORDER BY task_code', [id]),
      query('SELECT i.*, u.full_name AS owner FROM issues i LEFT JOIN users u ON u.id=i.owner_id WHERE i.project_id=$1 ORDER BY created_at DESC', [id]),
      query('SELECT r.*, u.full_name AS owner FROM risks r LEFT JOIN users u ON u.id=r.owner_id WHERE r.project_id=$1 ORDER BY rating DESC', [id]),
      query('SELECT a.*, u.full_name AS owner FROM actions a LEFT JOIN users u ON u.id=a.owner_id WHERE a.project_id=$1 ORDER BY due_date', [id]),
      query('SELECT d.*, u.full_name AS by FROM decisions d LEFT JOIN users u ON u.id=d.made_by WHERE d.project_id=$1 ORDER BY decided_at DESC', [id]),
      query('SELECT * FROM v_evidence WHERE project_id=$1 ORDER BY at DESC LIMIT 100', [id]),
    ]);
    res.json({ ...p, milestones: ms.rows, deliverables: del.rows, tasks: tasks.rows,
      issues: issues.rows, risks: risks.rows, actions: actions.rows, decisions: decisions.rows, evidence: evidence.rows });
  } catch (e) { next(e); }
});

// next project code (untuk form)
r.get('/meta/next-code', authRequired, async (_req, res, next) => {
  try {
    const m = (await query(`SELECT project_code FROM projects ORDER BY id DESC LIMIT 1`)).rows[0];
    const n = m ? parseInt(m.project_code.replace(/\D/g, '')) + 1 : 1;
    res.json({ code: 'P' + String(n).padStart(3, '0') });
  } catch (e) { next(e); }
});

r.post('/', authRequired, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const b = req.body;
    const row = await tx(async (c) => {
      const p = (await c.query(`INSERT INTO projects
        (project_code,name,description,category,owner_id,sponsor,objectives,start_date,target_date,priority,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'planning') RETURNING *`,
        [b.project_code,b.name,b.description,b.category,b.owner_id,b.sponsor,b.objectives,b.start_date,b.target_date,b.priority||'medium'])).rows[0];
      await c.query(`INSERT INTO project_members (project_id,user_id,role_in_proj) VALUES ($1,$2,'owner')`, [p.id, b.owner_id || req.user.id]);
      await c.query(`INSERT INTO audit_log (project_id,user_id,action,entity_type,entity_ref,detail) VALUES ($1,$2,'created','project',$3,'Project dibuat')`, [p.id, req.user.id, p.project_code]);
      return p;
    });
    await query('SELECT fn_refresh_health($1)', [row.id]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

r.put('/:id', authRequired, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const b = req.body;
    const p = (await query(`UPDATE projects SET name=COALESCE($2,name),description=COALESCE($3,description),
      category=COALESCE($4,category),status=COALESCE($5,status),priority=COALESCE($6,priority),
      target_date=COALESCE($7,target_date),start_date=COALESCE($8,start_date),objectives=COALESCE($9,objectives),updated_at=now()
      WHERE id=$1 RETURNING *`, [req.params.id,b.name,b.description,b.category,b.status,b.priority,b.target_date,b.start_date,b.objectives])).rows[0];
    await query('SELECT fn_refresh_health($1)', [req.params.id]);
    res.json(p);
  } catch (e) { next(e); }
});

r.delete('/:id', authRequired, requireRole('admin', 'owner'), async (req, res, next) => {
  try { await query('DELETE FROM projects WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { next(e); }
});

export default r;
