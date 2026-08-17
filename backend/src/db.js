import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// On Vercel/serverless, each invocation can spin up its own instance, so keep the
// pool small (Neon's pooled connection string, the one with "-pooler" in the host,
// handles the real fan-out on their side). Locally this just means max 5 idle conns.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.VERCEL ? 1 : 5,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.VERCEL
    ? { rejectUnauthorized: false }
    : false,
});
export const query = (t, p) => pool.query(t, p);
