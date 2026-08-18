import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { Empty } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { typeLabel, projStatusLabel, projStatusClass, monthYear, fmtDate } from '../lib/format.js';

const MS_DAY = 86400000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const toDate = (iso) => { const d = new Date(iso); return isNaN(d) ? null : startOfDay(d); };

// Setiap project pasti punya created_at (default now()), jadi bar-nya SELALU bisa digambar
// walau start_date/due_date belum diisi manual — biar Timeline langsung kepake tanpa isi data dulu.
// - start_date diisi user -> pake itu. Kalau kosong -> fallback ke created_at.
// - due_date diisi user -> pake itu (bar solid, deadline pasti).
// - due_date kosong: project active/on_hold -> bar "open" (gradient fade) sampai hari ini (masih jalan).
//                     project done/archived -> pake last_activity (kapan terakhir disentuh) sbg estimasi selesai.
function effectiveRange(p, today) {
  const start = toDate(p.start_date) || toDate(p.created_at) || today;
  let end, open = false;
  if (p.due_date) end = toDate(p.due_date);
  else if (p.status === 'active' || p.status === 'on_hold') { end = today; open = true; }
  else end = toDate(p.last_activity) || start;
  if (end < start) end = start;
  return { start, end, open };
}

export default function Timeline({ onMenu }) {
  const { projects } = useStore();
  const nav = useNavigate();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('active');
  const list = projects.filter(p => (!type || p.type === type) && (!status || p.status === status));

  const { rows, months, totalDays, minDate, todayPct } = useMemo(() => {
    const today = startOfDay(new Date());
    const rows = list.map(p => ({ ...p, ...effectiveRange(p, today) }))
      .sort((a, b) => a.start - b.start);
    if (!rows.length) return { rows: [], months: [], totalDays: 0, minDate: today, todayPct: 0 };
    let minDate = rows.reduce((m, r) => r.start < m ? r.start : m, rows[0].start);
    let maxDate = rows.reduce((m, r) => r.end > m ? r.end : m, rows[0].end);
    if (maxDate < today) maxDate = today; // biar garis "hari ini" selalu kelihatan
    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    const totalDays = Math.round((maxDate - minDate) / MS_DAY) + 1;
    const months = [];
    let cur = new Date(minDate);
    while (cur <= maxDate) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const daysInRange = Math.round((Math.min(next, new Date(maxDate.getTime() + MS_DAY)) - cur) / MS_DAY);
      months.push({ key: monthYear(cur), pct: daysInRange / totalDays * 100 });
      cur = next;
    }
    const withPos = rows.map(r => ({
      ...r,
      leftPct: (r.start - minDate) / MS_DAY / totalDays * 100,
      widthPct: Math.max((r.end - r.start) / MS_DAY + 1, 1) / totalDays * 100,
    }));
    const todayPct = (today - minDate) / MS_DAY / totalDays * 100;
    return { rows: withPos, months, totalDays, minDate, todayPct };
  }, [list]);

  return (
    <>
      <Topbar title={<h1>Timeline</h1>} sub={rows.length ? `${rows.length} project · ${monthYear(minDate)} – ${months.length ? months[months.length - 1].key : ''}` : 'Rentang waktu semua project'} onMenu={onMenu} />
      <div className="filters">
        <div className="seg">
          {[['', 'Semua'], ['office', 'Kantor'], ['freelance', 'Freelance'], ['parttime', 'Part-time'], ['kuliah', 'Kuliah'], ['personal', 'Personal']].map(([v, l]) =>
            <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{l}</button>)}
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="on_hold">On Hold</option><option value="done">Done</option><option value="archived">Archived</option><option value="">Semua Status</option></select>
      </div>

      {rows.length ? (
        <div className="gantt">
          <div className="gantt-side">
            <div className="gantt-side-head">Project</div>
            {rows.map(p => (
              <div className="gantt-row-label" key={p.id} onClick={() => nav('/projects/' + p.id)}>
                <span className="swatch" style={{ background:p.color }} />
                <span className="name">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="gantt-scroll">
            <div className="gantt-track" style={{ minWidth: (months.length * 96) + 'px' }}>
              <div className="gantt-months">
                {months.map(m => <div className="gantt-month" style={{ width:m.pct + '%' }} key={m.key}>{m.key}</div>)}
              </div>
              {todayPct >= 0 && todayPct <= 100 && <div className="gantt-today" style={{ left:todayPct + '%' }} title="Hari ini" />}
              {rows.map(p => (
                <div className="gantt-row" key={p.id}>
                  <div
                    className="gantt-bar"
                    style={{ left:p.leftPct + '%', width:p.widthPct + '%', background:p.open ? `linear-gradient(90deg, ${p.color} 75%, transparent 100%)` : p.color }}
                    onClick={() => nav('/projects/' + p.id)}
                    title={`${p.name} (${typeLabel[p.type]})\n${fmtDate(p.start)} – ${p.open ? 'berjalan' : fmtDate(p.end)}\n${projStatusLabel[p.status]}${!p.due_date ? '\n(belum ada target tanggal — estimasi)' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : <Empty icon="calendar">Belum ada project di filter ini</Empty>}

      {rows.length > 0 && (
        <p style={{ color:'var(--faint)', fontSize:11, marginTop:10 }}>
          Geser tabel ke samping buat liat bulan lain · bar transparan di ujung = project aktif tanpa tanggal target · klik bar buat buka project
        </p>
      )}
    </>
  );
}
