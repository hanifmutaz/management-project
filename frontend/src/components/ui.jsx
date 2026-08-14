import Icon from './Icon.jsx';
import { barHealth } from '../lib/format.js';

export function Badge({ cls, dot, children }) {
  return <span className={`badge ${cls || 'b-gray'}`}>{dot && <span className="dot" style={{ background: dot }} />}{children}</span>;
}
export function ProgressBar({ value, health }) {
  return <div className={`bar ${barHealth(health)}`}><i style={{ width: Math.max(3, value) + '%' }} /></div>;
}
export function ProgCell({ value }) {
  return <><span className="mini-bar"><i style={{ width: value + '%' }} /></span>{value}%</>;
}
export function RowActions({ onEdit, onDelete }) {
  return (
    <span className="rowact">
      <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit"><Icon name="edit" /></button>
      <button className="del" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Hapus"><Icon name="trash" /></button>
    </span>
  );
}
export function Empty({ icon = 'inbox', children }) {
  return <div className="empty"><Icon name={icon} size="lg" /><span>{children}</span></div>;
}
export function DataTable({ cols, rows, cardTitle, empty = 'Belum ada data.' }) {
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
export function Donut({ segs, center }) {
  const total = segs.reduce((a, s) => a + s.v, 0) || 1;
  let off = 25;
  return (
    <svg width="140" height="140" viewBox="0 0 42 42">
      <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--panel2)" strokeWidth="5" />
      {segs.map((s, i) => { const len = s.v / total * 100; const el = <circle key={i} cx="21" cy="21" r="15.9" fill="transparent" stroke={s.c} strokeWidth="5" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={off} />; off -= len; return el; })}
      <text x="21" y="23" textAnchor="middle" fill="var(--txt)" fontSize="6" fontWeight="bold">{center ?? total}</text>
    </svg>
  );
}
export function KpiCard({ label, value, tag, accent = 'acc-blue', icon }) {
  return (
    <div className={`kpi ${accent}`}>
      {icon && <span className="ico"><Icon name={icon} size="" /></span>}
      <div className="lbl">{label}</div><div className="val">{value}</div>{tag && <div className="tag">{tag}</div>}
    </div>
  );
}
