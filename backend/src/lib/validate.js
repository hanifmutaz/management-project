// Wrap async route handlers so we don't repeat try/catch { next(e) } everywhere.
export const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Custom error carrying an HTTP status, so the global error handler can
// return a clean 4xx instead of leaking a raw Postgres/500 error.
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Throws a 400 if any of `fields` is missing/empty on req.body.
export function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) throw new ApiError(400, `Field wajib kosong: ${missing.join(', ')}`);
}

// Throws a 400 if `value` is present but not a finite number, or negative when notNegative=true.
export function checkNumber(value, label, { notNegative = false, optional = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return;
    throw new ApiError(400, `${label} wajib diisi angka`);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new ApiError(400, `${label} harus berupa angka`);
  if (notNegative && n < 0) throw new ApiError(400, `${label} tidak boleh negatif`);
}

// Throws a 400 if `value` is present but not one of `allowed`.
export function checkEnum(value, label, allowed) {
  if (value === undefined || value === null || value === '') return;
  if (!allowed.includes(value)) throw new ApiError(400, `${label} tidak valid. Pilihan: ${allowed.join(', ')}`);
}
