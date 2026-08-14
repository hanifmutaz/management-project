import { Router } from 'express';
import { query } from '../db.js';
const r = Router();
r.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const cond = status ? 'WHERE pm.status=$1' : '';
    const vals = status ? [status] : [];
    res.json((await query(`SELECT pm.*, p.name AS project_name, p.client_name, p.type AS project_type, p.color
      FROM payments pm JOIN projects p ON p.id=pm.project_id ${cond} ORDER BY (pm.status<>'paid') DESC, pm.created_at DESC`, vals)).rows);
  } catch (e) { next(e); }
});
r.post('/', async (req, res, next) => {
  try {
    const b = req.body;
    const pay = (await query(`INSERT INTO payments (project_id,label,amount,currency,status,invoice_date,paid_date,note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [b.project_id,b.label,b.amount||0,b.currency||'IDR',b.status||'unpaid',b.invoice_date,b.paid_date,b.note])).rows[0];
    res.status(201).json(pay);
  } catch (e) { next(e); }
});
r.patch('/:id/paid', async (req, res, next) => {
  try { res.json((await query(`UPDATE payments SET status='paid', paid_date=COALESCE(paid_date,CURRENT_DATE) WHERE id=$1 RETURNING *`, [req.params.id])).rows[0]); }
  catch (e) { next(e); }
});
r.put('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const pay = (await query(`UPDATE payments SET label=$2,amount=COALESCE($3,amount),currency=COALESCE($4,currency),status=COALESCE($5,status),invoice_date=$6,paid_date=$7,note=$8 WHERE id=$1 RETURNING *`,
      [req.params.id,b.label,b.amount,b.currency,b.status,b.invoice_date,b.paid_date,b.note])).rows[0];
    res.json(pay);
  } catch (e) { next(e); }
});
r.delete('/:id', async (req, res, next) => {
  try { await query('DELETE FROM payments WHERE id=$1', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});
export default r;
