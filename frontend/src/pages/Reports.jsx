import { useStore } from '../lib/store.jsx';
import { healthLabel, healthClass, statusLabel, statusClass, num } from '../lib/format.js';
import { DataTable, Badge, ProgCell } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { exportPortfolio } from '../lib/export.js';

const REPORTS = [
  { t:'Weekly Report', d:'Progress & delta minggu ini', ic:'clock' },
  { t:'Monthly Report', d:'Rekap bulanan per project', ic:'doc' },
  { t:'Executive Report', d:'Ringkasan management (health & KPI)', ic:'chart' },
  { t:'Project Status Report', d:'Status lengkap 1 project', ic:'folder' },
  { t:'Issue & Risk Report', d:'Daftar issue/risk + action', ic:'alert' },
  { t:'Evidence Report', d:'Audit trail & bukti', ic:'archive' },
];
export default function Reports({ onMenu }) {
  const { projects } = useStore();
  const cols = [
    { h:'Code', title:1, cell:p => p.project_code },
    { h:'Project', cell:p => p.name },
    { h:'Owner', cell:p => p.owner },
    { h:'Progress', cell:p => <ProgCell value={num(p.avg_progress)} /> },
    { h:'Health', cell:p => <Badge cls={healthClass[p.health]}>{healthLabel[p.health]}</Badge> },
    { h:'Status', cell:p => <Badge cls={statusClass(p.status)}>{statusLabel(p.status)}</Badge> },
  ];
  return (
    <>
      <Topbar title="Reports" sub="One update -> report instantly" onMenu={onMenu} />
      <div className="grid3">
        {REPORTS.map(r => (
          <div className="pcard" key={r.t} onClick={() => exportPortfolio(projects, 'xls', r.t)}>
            <div style={{ color:'var(--brand)' }}><Icon name={r.ic} size="lg" /></div>
            <div className="name" style={{ margin:'10px 0 4px' }}>{r.t}</div>
            <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>{r.d}</div>
            <div className="row" style={{ marginTop:12 }}>
              <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); exportPortfolio(projects, 'xls', r.t); }}>Excel</button>
              <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); window.print(); }}>PDF</button>
            </div>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>Portfolio Summary <span className="row">
          <button className="btn ghost sm" onClick={() => exportPortfolio(projects, 'csv')}><Icon name="download" /> CSV</button>
          <button className="btn ghost sm" onClick={() => exportPortfolio(projects, 'xls')}><Icon name="download" /> Excel</button>
        </span></h3>
        <DataTable cols={cols} rows={projects} cardTitle={p => `${p.project_code} · ${p.name}`} />
      </div>
    </>
  );
}
