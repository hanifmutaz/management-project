import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';
const r = Router();
r.get('/', authRequired, async (req, res, next) => {
  try {
    res.json((await query(`SELECT n.*, p.project_code FROM notifications n LEFT JOIN projects p ON p.id=n.project_id
      WHERE n.user_id=$1 ORDER BY n.created_at DESC LIMIT 50`, [req.user.id])).rows);
  } catch (e) { next(e); }
});
r.patch('/:id/read', authRequired, async (req, res, next) => {
  try { await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]); res.json({ ok: true }); }
  catch (e) { next(e); }
});
r.patch('/read-all', authRequired, async (req, res, next) => {
  try { await query('UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false', [req.user.id]); res.json({ ok: true }); }
  catch (e) { next(e); }
});
export default r;
