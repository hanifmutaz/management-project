// Set / reset password semua user jadi 'password123' (hash bcrypt yang benar).
// Taruh file ini di:  backend/src/set-passwords.js
// Jalankan SETELAH `npm install` di backend & database sudah di-seed:
//   node src/set-passwords.js
// Atau set password custom untuk 1 user:
//   node src/set-passwords.js hanif.mutaz@hirose-gl.com passwordBaru
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const [, , email, pass] = process.argv;
  const password = pass || 'password123';
  const hash = await bcrypt.hash(password, 10);

  if (email && pass) {
    const r = await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2 RETURNING email', [hash, email]);
    if (!r.rowCount) { console.error('❌ User tidak ditemukan:', email); process.exit(1); }
    console.log(`✅ Password untuk ${email} di-set ke "${password}"`);
  } else {
    const r = await pool.query('UPDATE users SET password_hash=$1 RETURNING email', [hash]);
    console.log(`✅ Password SEMUA user (${r.rowCount}) di-set ke "${password}":`);
    r.rows.forEach(u => console.log('   -', u.email));
  }
  console.log('🔎 Verifikasi hash:', (await bcrypt.compare(password, hash)) ? 'OK' : 'GAGAL');
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
