import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Return DATE columns as plain 'YYYY-MM-DD' strings. By default node-pg turns them into JS
// Dates at server-local midnight, which JSON-serialize to the PREVIOUS day on any server
// running ahead of UTC (shows up as off-by-one dates and a "today" highlight that never matches).
pg.types.setTypeParser(1082, (v) => v);

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
