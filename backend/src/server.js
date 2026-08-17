import app from './app.js';

// Local dev only — Vercel imports app.js directly via api/index.js and never calls listen().
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 MUTAZ OS API running on http://localhost:${PORT}`));
