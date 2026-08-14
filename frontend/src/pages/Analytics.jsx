import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Donut, Empty } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { typeLabel, typeColor, hrs, money, num } from '../lib/format.js';

export default function Analytics({ onMenu }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.analytics().then(setData).catch(() => setData({ byTypeHours: [], incomeByMonth: [], topProjects: [] })); }, []);
  if (!data) return null;

  const typeSegs = data.byTypeHours.filter(t => Number(t.hours) > 0).map(t => ({ v: Number(t.hours), c: typeColor[t.type], l: typeLabel[t.type] }));
  const totalHours = typeSegs.reduce((a, s) => a + s.v, 0);
  const maxTop = Math.max(...data.topProjects.map(p => Number(p.total_hours)), 1);
  const maxIncome = Math.max(...data.incomeByMonth.map(m => Number(m.income)), 1);
  const MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const monthLabel = (m) => { const [, mm] = m.split('-'); return MON[+mm - 1]; };

  return (
    <>
      <Topbar title={<h1>Analytics</h1>} sub="Insight kerjaan & income" onMenu={onMenu} />
      <div className="grid2">
        <div className="panel">
          <h3>Jam per Konteks</h3>
          {typeSegs.length ? (
            <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              <Donut segs={typeSegs} center={num(totalHours)} label="jam" />
              <div className="legend">{typeSegs.map(s => <div key={s.l}><span className="dot" style={{ background:s.c }} /> {s.l} · {hrs(s.v)}</div>)}</div>
            </div>
          ) : <Empty icon="chart">Belum ada data jam</Empty>}
        </div>
        <div className="panel">
          <h3>Income per Bulan <span className="mini">yang sudah dibayar</span></h3>
          {data.incomeByMonth.length ? (
            <div className="weekbars" style={{ height:150 }}>
              {data.incomeByMonth.map(m => (
                <div className="wb" key={m.month} title={money(m.income)}>
                  <span className="val">{num(Number(m.income) / 1000) + 'k'}</span>
                  <div className="fill" style={{ height: (Number(m.income) / maxIncome * 100) + '%', background:'linear-gradient(180deg,var(--green),#2bb37a)' }} />
                  <span className="lbl">{monthLabel(m.month)}</span>
                </div>
              ))}
            </div>
          ) : <Empty icon="wallet">Belum ada income tercatat</Empty>}
        </div>
      </div>
      <div className="panel">
        <h3><span className="tl"><Icon name="trend" /> Project Paling Banyak Jam</span></h3>
        {data.topProjects.length ? data.topProjects.map(p => (
          <div className="pline" key={p.name}>
            <div className="top"><span><span className="dot" style={{ background:p.color, marginRight:6 }} /> {p.name}</span><b>{hrs(p.total_hours)}</b></div>
            <div className="bar"><i style={{ width: (Number(p.total_hours) / maxTop * 100) + '%', background:p.color }} /></div>
          </div>
        )) : <Empty icon="folder">Belum ada data</Empty>}
      </div>
    </>
  );
}
