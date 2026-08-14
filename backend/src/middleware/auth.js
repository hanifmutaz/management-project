import jwt from 'jsonwebtoken';
export function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'Token required' });
  try { req.user = jwt.verify(t, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}
export const requireRole = (...roles) => (req, res, next) =>
  (req.user && roles.includes(req.user.role)) ? next() : res.status(403).json({ error: 'Forbidden' });
