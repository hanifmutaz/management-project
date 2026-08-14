import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
const r = Router();

r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const u = (await query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email])).rows[0];
    if (!u) return res.status(401).json({ error: 'Email atau password salah' });
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email atau password salah' });
    const token = jwt.sign({ id: u.id, name: u.full_name, role: u.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: u.id, name: u.full_name, role: u.role, init: u.avatar_init } });
  } catch (e) { next(e); }
});

// list users (untuk dropdown PIC/owner)
r.get('/users', async (_req, res, next) => {
  try { res.json((await query('SELECT id, full_name, role, avatar_init FROM users WHERE is_active=true ORDER BY full_name')).rows); }
  catch (e) { next(e); }
});

export default r;
