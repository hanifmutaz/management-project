import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Donut, Empty, DeltaChip, Sparkline } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { typeLabel, typeColor, hrs, money, num, MON, delta, weekLabel } from '../lib/format.js';

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api.analytics().then(setData).catch(() => setData({ byTypeHours: [], incomeByMonth: [], topProjects: [], hoursTrend: [] })); }, []);
  if (!data) return null;

  const typeSegs = data.byTypeHours.filter(t => Number(t.hours) > 0).map(t => ({ v: Number(t.hours), c: typeColor[t.type], l: typeLabel[t.type] }));
  const totalHours = typeSegs.reduce((a, s) => a + s.v, 0);
  const maxTop = Math.max(...data.topProjects.map(p => Number(p.total_hours)), 1);
  const maxIncome = Math.max(...data.incomeByMonth.map(m => Number(m.income)), 1);
  const monthLabel = (m) => { const [, mm] = m.split('-'); return MON[+mm - 1]; };

  // Weekly trend per workspace. Rows arrive ordered by week, then type, so each
  // type's values already come out in week order.
  const trendRows = data.hoursTrend || [];
  const weeks = [...new Set(trendRows.map(r => r.week))];
  const byType = {};
  trendRows.forEach(r => { (byType[r.type] = byType[r.type] || []).push(Number(r.hours)); });
  const trend = Object.entries(byType)
    .map(([type, vals]) => ({ type, vals, total: vals.reduce((a, v) => a + v, 0), cur: vals[vals.length - 1] || 0, prev: vals[vals.length - 2] || 0 }))
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <Topbar title={<h1>Analytics</h1>} sub="Work & income insights" />

      <div className="panel" style={{ marginBottom:16 }}>
        <h3><span className="tl"><Icon name="trend" /> Weekly Trend by Workspace</span><span className="mini">last {weeks.length || 8} weeks · hours per week</span></h3>
        {trend.length ? (
          <div className="trend-grid">
            {trend.map(r => (
              <div className="trend-card" key={r.type}>
                <div className="trend-head"><span className="dot" style={{ background:typeColor[r.type] }} /> {typeLabel[r.type]}</div>
                <div className="trend-val">{hrs(r.cur)}<span>this week</span></div>
                <div className="trend-delta"><DeltaChip delta={delta(r.cur, r.prev)} /><span>vs last week</span></div>
                <Sparkline values={r.vals} labels={weeks.map(weekLabel)} color={typeColor[r.type]} />
                <div className="trend-foot"><span>{hrs(r.total)} total</span><span>avg {hrs(r.total / r.vals.length)}/wk</span></div>
              </div>
            ))}
          </div>
        ) : <Empty icon="chart">Not enough data yet. Log some work to see trends.</Empty>}
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Hours by Workspace</h3>
          {typeSegs.length ? (
            <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
              <Donut segs={typeSegs} center={num(totalHours)} label="hours" size={150} />
              <div className="legend">{typeSegs.map(s => <div key={s.l}><span className="dot" style={{ background:s.c }} /> {s.l} · {hrs(s.v)}</div>)}</div>
            </div>
          ) : <Empty icon="chart">No hours logged yet</Empty>}
        </div>
        <div className="panel">
          <h3>Income per Month <span className="mini">paid only</span></h3>
          {data.incomeByMonth.length ? (
            <div className="weekbars">
              {data.incomeByMonth.map(m => (
                <div className="wb" key={m.month} title={money(m.income)}>
                  <span className="val">{num(Number(m.income) / 1000) + 'k'}</span>
                  <div className="fill" style={{ height: (Number(m.income) / maxIncome * 100) + '%', background:'var(--green)' }} />
                  <span className="lbl">{monthLabel(m.month)}</span>
                </div>
              ))}
            </div>
          ) : <Empty icon="wallet">No income recorded yet</Empty>}
        </div>
      </div>
      <div className="panel">
        <h3><span className="tl"><Icon name="trend" /> Top Projects by Hours</span></h3>
        {data.topProjects.length ? data.topProjects.map(p => (
          <div className="pline" key={p.name}>
            <div className="top"><span><span className="dot" style={{ background:p.color, marginRight:6 }} /> {p.name}</span><b>{hrs(p.total_hours)}</b></div>
            <div className="bar"><i style={{ width: (Number(p.total_hours) / maxTop * 100) + '%', background:p.color }} /></div>
          </div>
        )) : <Empty icon="folder">No data yet</Empty>}
      </div>
    </>
  );
}
