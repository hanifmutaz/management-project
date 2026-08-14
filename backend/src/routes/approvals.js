import { Router } from 'express';
import { query } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';
const r = Router();
r.get('/', authRequired, async (req, res, next) => {
  try {
    const { status } = req.query;
    const cond = status ? 'WHERE a.status=$1' : '';
    const vals = status ? [status] : [];
    res.json((await query(`SELECT a.*, p.project_code, p.name AS project_name,
      ru.full_name AS requester, au.full_name AS approver
      FROM approvals a JOIN projects p ON p.id=a.project_id
      LEFT JOIN users ru ON ru.id=a.requested_by LEFT JOIN users au ON au.id=a.approver_id
      ${cond} ORDER BY (a.status='pending') DESC, a.requested_at DESC`, vals)).rows);
  } catch (e) { next(e); }
});
r.post('/', authRequired, async (req, res, next) => {
  try {
    const b = req.body;
    const a = (await query(`INSERT INTO approvals (project_id,entity_type,entity_id,entity_label,title,requested_by,approver_id,request_note,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING *`,
      [b.project_id,b.entity_type,b.entity_id,b.entity_label,b.title,req.user.id,b.approver_id,b.request_note])).rows[0];
    res.status(201).json(a);
  } catch (e) { next(e); }
});
r.patch('/:id/decide', authRequired, requireRole('admin','owner','viewer'), async (req, res, next) => {
  try {
    const { decision, note } = req.body;
    if (!['approved','rejected'].includes(decision)) return res.status(400).json({ error: 'decision harus approved/rejected' });
    const a = (await query(`UPDATE approvals SET status=$2,decision_note=$3,decided_at=now() WHERE id=$1 AND status='pending' RETURNING *`,
      [req.params.id, decision, note])).rows[0];
    if (!a) return res.status(409).json({ error: 'Approval sudah diputuskan' });
    res.json(a);
  } catch (e) { next(e); }
});
export default r;
