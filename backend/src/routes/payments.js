import { Router } from 'express';
import { query } from '../db.js';
import { ah, requireFields, checkNumber, checkEnum, ApiError } from '../lib/validate.js';

const r = Router();
const STATUSES = ['unpaid', 'invoiced', 'paid'];

r.get('/', ah(async (req, res) => {
  const { status } = req.query;
  const cond = status ? 'WHERE pm.status=$1' : '';
  const vals = status ? [status] : [];
  res.json((await query(`SELECT pm.*, p.name AS project_name, p.client_name, p.type AS project_type, p.color
    FROM payments pm JOIN projects p ON p.id=pm.project_id ${cond} ORDER BY (pm.status<>'paid') DESC, pm.created_at DESC`, vals)).rows);
}));

r.post('/', ah(async (req, res) => {
  const b = req.body;
  requireFields(b, ['project_id']);
  checkNumber(b.amount, 'Jumlah', { notNegative: true });
  checkEnum(b.status, 'Status', STATUSES);
  const pay = (await query(`INSERT INTO payments (project_id,label,amount,currency,status,invoice_date,paid_date,note)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [b.project_id,b.label,b.amount||0,b.currency||'IDR',b.status||'unpaid',b.invoice_date,b.paid_date,b.note])).rows[0];
  res.status(201).json(pay);
}));

r.patch('/:id/paid', ah(async (req, res) => {
  const pay = (await query(`UPDATE payments SET status='paid', paid_date=COALESCE(paid_date,CURRENT_DATE) WHERE id=$1 RETURNING *`, [req.params.id])).rows[0];
  if (!pay) throw new ApiError(404, 'Payment not found');
  res.json(pay);
}));

r.put('/:id', ah(async (req, res) => {
  const b = req.body;
  checkNumber(b.amount, 'Jumlah', { notNegative: true });
  checkEnum(b.status, 'Status', STATUSES);
  const pay = (await query(`UPDATE payments SET label=$2,amount=COALESCE($3,amount),currency=COALESCE($4,currency),status=COALESCE($5,status),invoice_date=$6,paid_date=$7,note=$8 WHERE id=$1 RETURNING *`,
    [req.params.id,b.label,b.amount,b.currency,b.status,b.invoice_date,b.paid_date,b.note])).rows[0];
  if (!pay) throw new ApiError(404, 'Payment not found');
  res.json(pay);
}));

r.delete('/:id', ah(async (req, res) => {
  await query('DELETE FROM payments WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}));

export default r;
