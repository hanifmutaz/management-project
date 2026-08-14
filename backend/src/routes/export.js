// Export engine: CSV (inline), XLSX report-grade (via excel_report.py), JSON evidence.
import { Router } from 'express';
import { spawn } from 'node:child_process';
import { writeFile, readFile, unlink, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { buildReportData } from '../services/reportData.js';
const r = Router();
const __dir = dirname(fileURLToPath(import.meta.url));
const PY = process.env.PYTHON_BIN || 'python3';
const REPORT_PY = join(__dir, '..', 'services', 'excel_report.py');

const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
const stamp = () => new Date().toISOString().slice(0, 10);

// ---------- CSV portfolio ----------
r.get('/portfolio.csv', authRequired, async (_req, res, next) => {
  try {
    const rows = (await query(`SELECT project_code,name,category,owner,avg_progress,health,health_reason,status
      FROM v_project_stats ORDER BY project_code`)).rows;
    const head = ['Code','Project','Category','Owner','Progress %','Health','Health Reason','Status'];
    const csv = '\ufeff' + [head.join(','),
      ...rows.map(p => [p.project_code,p.name,p.category,p.owner,p.avg_progress,p.health,p.health_reason,p.status].map(esc).join(','))
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ProjectHub_Portfolio_${stamp()}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

// ---------- XLSX report-grade (7 sheet) via Python ----------
r.get('/projects/:id/report.xlsx', authRequired, async (req, res, next) => {
  try {
    const data = await buildReportData(req.params.id);
    const dir = await mkdtemp(join(tmpdir(), 'ph-'));
    const jsonPath = join(dir, 'data.json');
    const xlsxPath = join(dir, `report_${stamp()}.xlsx`);
    await writeFile(jsonPath, JSON.stringify(data));
    await new Promise((resolve, reject) => {
      const p = spawn(PY, [REPORT_PY, jsonPath, xlsxPath]);
      let err = '';
      p.stderr.on('data', d => err += d);
      p.on('close', code => code === 0 ? resolve() : reject(new Error('excel_report.py failed: ' + err)));
    });
    const buf = await readFile(xlsxPath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ProjectHub_${data.project.code}_Report_${stamp()}.xlsx"`);
    res.send(buf);
    unlink(jsonPath).catch(()=>{}); unlink(xlsxPath).catch(()=>{});
  } catch (e) { next(e); }
});

// ---------- JSON Evidence Pack ----------
r.get('/projects/:id/evidence.json', authRequired, async (req, res, next) => {
  try {
    const data = await buildReportData(req.params.id);
    const evidence = (await query('SELECT * FROM v_evidence WHERE project_id=$1 ORDER BY at', [req.params.id])).rows;
    res.setHeader('Content-Disposition', `attachment; filename="ProjectHub_Evidence_${data.project.code}_${stamp()}.json"`);
    res.json({ generated_at: new Date(), ...data, evidence });
  } catch (e) { next(e); }
});

export default r;
