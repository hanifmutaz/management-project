import { useEffect, useState } from 'react';
import { api, downloadExport } from '../lib/api.js';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

const COLORS = { done:'#22c55e', in_progress:'#4f7cff', not_started:'#64748b', at_risk:'#f97316', review:'#9b6bff' };

export default function Dashboard() {
  const [d, setD] = useState(null);

  useEffect(() => {
    // fallback dummy kalau API belum jalan
    api.dashboard().then(setD).catch(() => setD(FALLBACK));
  }, []);

  if (!d) return <div className="loading">Loading…</div>;

  return (
    <>
      <div className="topbar">
        <div><h1>Dashboard</h1><div className="sub">Real-time overview</div></div>
        <div className="row">
          <button className="btn ghost" onClick={() => downloadExport('projects', { format: 'csv' })}>⬇ Export CSV</button>
          <button className="btn ghost" onClick={() => downloadExport('projects', { format: 'xls' })}>⬇ Excel</button>
          <button className="btn" onClick={() => window.print()}>🖨 PDF</button>
        </div>
      </div>

      <div className="kpis">
        <Kpi label="🗂 Total Project" val={d.kpi.total_projects} />
        <Kpi label="📋 Total Task"    val={d.kpi.total_tasks} />
        <Kpi label="✅ Done"          val={d.kpi.done} />
        <Kpi label="🔄 In Progress"   val={d.kpi.in_progress} />
        <Kpi label="🟠 At Risk"       val={d.kpi.at_risk} color="#f97316" />
        <Kpi label="🔴 Overdue"       val={d.kpi.overdue} color="#22c55e" />
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Progress per Project</h3>
          {d.perProject.map(p => (
            <div className="pline" key={p.project_code}>
              <div className="top"><span>{p.project_code} · {p.name}</span><b>{p.avg_progress}%</b></div>
              <div className="bar"><i style={{ width: Math.max(3, p.avg_progress) + '%' }} /></div>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={d.statusDist} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {d.statusDist.map((s, i) => <Cell key={i} fill={COLORS[s.status] || '#64748b'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <h3>🚨 Task yang perlu perhatian
          <button className="btn ghost sm" onClick={() => downloadExport('tasks', { format: 'csv' })}>⬇ CSV</button>
        </h3>
        <table>
          <thead><tr><th>Task</th><th>Project</th><th>Due</th><th>Progress</th><th>Health</th><th>Next Action</th></tr></thead>
          <tbody>
            {d.attention.map(t => (
              <tr key={t.task_code}>
                <td>{t.name}</td><td>{t.project_code}</td><td>{t.due_date?.slice(0,10)}</td>
                <td>{t.progress}%</td>
                <td><span className={'badge ' + (t.health === 'at_risk' ? 'b-orange' : 'b-yellow')}>{t.health}</span></td>
                <td>{t.next_action || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Kpi({ label, val, color }) {
  return (
    <div className="kpi">
      <div className="lbl">{label}</div>
      <div className="val" style={color ? { color } : {}}>{val}</div>
    </div>
  );
}

// Fallback data supaya UI tetap tampil tanpa backend
const FALLBACK = {
  kpi: { total_projects: 6, total_tasks: 35, done: 4, in_progress: 4, at_risk: 4, overdue: 0 },
  perProject: [
    { project_code:'P001', name:'Monitoring PM Excel', avg_progress:72 },
    { project_code:'P002', name:'Monitoring PM Web', avg_progress:20 },
    { project_code:'P003', name:'Otomatisasi Measuring', avg_progress:8 },
    { project_code:'P005', name:'Dashboard PCB ConMas', avg_progress:4 },
  ],
  statusDist: [
    { status:'done', count:4 }, { status:'in_progress', count:4 }, { status:'not_started', count:27 },
  ],
  attention: [
    { task_code:'P001.6', name:'Meeting request feature', project_code:'P001', due_date:'2026-05-06', progress:40, health:'at_risk', next_action:'Siapkan deck' },
    { task_code:'P001.7', name:'Trial validasi data real', project_code:'P001', due_date:'2026-05-06', progress:30, health:'at_risk', next_action:'Cek vs manual' },
  ],
};
