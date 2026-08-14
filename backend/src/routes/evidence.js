import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';
const r = Router();
r.get('/', authRequired, async (req, res, next) => {
  try {
    const { project_id, etype, user } = req.query;
    const cond = [], vals = [];
    if (project_id) { vals.push(project_id); cond.push(`project_id=(SELECT id FROM projects WHERE project_code=$${vals.length} OR id::text=$${vals.length})`); }
    if (etype) { vals.push(etype); cond.push(`etype=$${vals.length}`); }
    if (user) { vals.push('%'+user+'%'); cond.push(`actor ILIKE $${vals.length}`); }
    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
    res.json((await query(`SELECT e.*, p.project_code FROM v_evidence e JOIN projects p ON p.id=e.project_id ${where} ORDER BY at DESC LIMIT 500`, vals)).rows);
  } catch (e) { next(e); }
});
export default r;
