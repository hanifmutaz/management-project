import { useId } from 'react';
import Icon from './Icon.jsx';

export function Badge({ cls, dot, children }) {
  return <span className={`badge ${cls || 'b-gray'}`}>{dot && <span className="dot" style={{ background: dot }} />}{children}</span>;
}
export function RowActions({ onEdit, onDelete }) {
  return (
    <span className="rowact">
      {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit" aria-label="Edit"><Icon name="edit" /></button>}
      {onDelete && <button className="del" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete" aria-label="Delete"><Icon name="trash" /></button>}
    </span>
  );
}
export function Empty({ icon = 'inbox', children, action }) {
  return (
    <div className="empty">
      <Icon name={icon} size="lg" />
      <div className="et">{children}</div>
      {action}
    </div>
  );
}
export function DataTable({ cols, rows, cardTitle, empty = 'No data yet.' }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <>
      <div className="tablewrap">
        <table>
          <thead><tr>{cols.map((c, i) => <th key={i}>{c.h}</th>)}</tr></thead>
          <tbody>{rows.map((r, ri) => <tr key={r.id ?? ri}>{cols.map((c, i) => <td key={i}>{c.cell(r)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="cardlist">
        {rows.map((r, ri) => (
          <div className="rcard" key={r.id ?? ri}>
            <div className="rt">{cardTitle ? cardTitle(r) : (r.title || r.name || r.id)}</div>
            {cols.filter(c => !c.title && c.h).map((c, i) => <div className="rr" key={i}><span>{c.h}</span><b>{c.cell(r)}</b></div>)}
          </div>
        ))}
      </div>
    </>
  );
}
export function Donut({ segs, center, label, size = 130 }) {
  const total = segs.reduce((a, s) => a + s.v, 0) || 1;
  const gap = segs.length > 1 ? 0.8 : 0;
  let off = 25;
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" role="img" aria-label={`${center} ${label || ''}`}>
      <circle cx="21" cy="21" r="15.9155" fill="none" style={{ stroke:'var(--panel3)' }} strokeWidth="5.2" />
      {segs.map((s, i) => {
        const len = s.v / total * 100;
        const el = <circle key={i} cx="21" cy="21" r="15.9155" fill="none" style={{ stroke:s.c }} strokeWidth="5.2" strokeDasharray={`${Math.max(len - gap, 0)} ${100 - Math.max(len - gap, 0)}`} strokeDashoffset={off} />;
        off -= len;
        return el;
      })}
      <text x="21" y={label ? 21.5 : 23} textAnchor="middle" style={{ fill:'var(--txt)' }} fontSize="6.4" fontWeight="600">{center}</text>
      {label && <text x="21" y="26.5" textAnchor="middle" style={{ fill:'var(--muted)' }} fontSize="2.9">{label}</text>}
    </svg>
  );
}
export function DeltaChip({ delta }) {
  if (!delta) return null;
  return <span className={`dl ${delta.up ? 'up' : delta.flat ? 'flat' : 'down'}`}>{!delta.flat && <Icon name={delta.up ? 'arrowUp' : 'arrowDown'} size="sm" />}{delta.text}</span>;
}
// tone: dot color before the caption (danger | ok | warn). progress: 0-100 bar under the value.
export function KpiCard({ label, value, tag, delta, tone, progress }) {
  return (
    <div className="kpi">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {progress != null && <div className="bar slim"><i style={{ width: progress + '%' }} /></div>}
      <div className="tag">{tone && <span className={`sdot ${tone}`} />}<DeltaChip delta={delta} />{tag}</div>
    </div>
  );
}
// Small colored label naming a workspace (Office, Freelance...).
export function WorkspaceTag({ type, label }) {
  return <span className="badge" style={{ '--c': `var(--c-${type})` }}>{label}</span>;
}
// Tiny line+area chart. `labels` (same length as `values`) feed the hover tooltips.
export function Sparkline({ values, labels = [], color = 'var(--brand)', unit = 'h' }) {
  const gid = useId();
  const w = 160, h = 44, pad = 4, n = values.length;
  if (!n) return null;
  const max = Math.max(...values, 1);
  const step = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const x = (i) => (n > 1 ? pad + i * step : w / 2);
  const y = (v) => h - pad - (v / max) * (h - pad * 2);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)} ${h - pad} L${x(0).toFixed(1)} ${h - pad} Z`;
  const colW = n > 1 ? step : w;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Trend over ${n} weeks`}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style={{ stopColor:color }} stopOpacity=".18" />
          <stop offset="100%" style={{ stopColor:color }} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" style={{ stroke:color }} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(n - 1)} cy={y(values[n - 1])} r="2.6" style={{ fill:color }} />
      {values.map((v, i) => (
        <rect key={i} x={x(i) - colW / 2} y="0" width={colW} height={h} fill="transparent">
          <title>{`${labels[i] ? 'Week of ' + labels[i] + ': ' : ''}${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`}</title>
        </rect>
      ))}
    </svg>
  );
}
export function SkeletonDash() {
  return (
    <>
      <div className="kpis">{[0,1,2,3].map(i => <div className="sk sk-kpi" key={i} />)}</div>
      <div className="grid2">
        <div className="panel">{[0,1,2,3,4].map(i => <div className="sk sk-line" key={i} style={{ width: (90 - i * 8) + '%' }} />)}</div>
        <div className="panel">{[0,1,2].map(i => <div className="sk sk-line" key={i} />)}</div>
      </div>
    </>
  );
}
