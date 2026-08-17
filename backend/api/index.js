// Vercel treats this file as the serverless function entry point.
// It just re-exports the Express app — no app.listen() here, Vercel handles that.
import app from '../src/app.js';
export default app;
