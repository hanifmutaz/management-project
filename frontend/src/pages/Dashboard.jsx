import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { KpiCard, Donut, Empty } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { WorkLogForm } from '../modals/Forms.jsx';
import { hrs, money, moneyShort, fmtDate, dowShort, idleText, idleColor, typeColor, typeLabel, num, greeting, delta } from '../lib/format.js';

export default function Dashboard({ onMenu }) {
  const { dashboard, projects, refresh, toast } = useStore();
  const { open } = useModal();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [pid, setPid] = useState('');
  const [qh, setQh] = useState(1);
  const [saving, setSaving] = useState(false);
  if (!dashboard) return null;
  const k = dashboard.kpi;

  // quick-log: enter langsung simpan
  const quickSave = async () => {
    if (!q.trim()) { toast('Isi dulu apa yang dikerjain', 'err'); return; }
    setSaving(true);
    try {
      await api.createLog({ project_id: pid || projects[0]?.id, description: q, hours: +qh || 0, log_date: new Date().toISOString().slice(0,10) });
      setQ(''); setQh(1); await refresh(); toast('Kerjaan dicatat 🔥');
    } catch (e) { toast(e.message, 'err'); }
    setSaving(false);
  };

  const kpi = [
    { label:'Jam Hari Ini', value:hrs(k.hours_today), tag:'tercatat', accent:'acc-green', icon:'bolt' },
    { label:'Jam Minggu Ini', value:hrs(k.hours_this_week), delta:delta(k.hours_this_week, k.hours_last_week), tag:'vs mgg lalu', accent:'acc-blue', icon:'clock' },
    { label:'Task Aktif', value:k.open_tasks, tag:k.overdue_tasks > 0 ? `${k.overdue_tasks} overdue` : 'on track', accent:k.overdue_tasks > 0 ? 'acc-orange' : 'acc-green', icon:'check-sq' },
    { label:'Income Bulan Ini', value:moneyShort(k.income_this_month), tag:'sudah dibayar', accent:'acc-purple', icon:'wallet' },
  ];
  const days = dashboard.hoursByDay;
  const maxH = Math.max(...days.map(d => Number(d.hours)), 1);
  const today = new Date().toISOString().slice(0, 10);
  const typeSegs = dashboard.hoursByType.filter(t => Number(t.hours) > 0).map(t => ({ v: Number(t.hours), c: typeColor[t.type], l: typeLabel[t.type] }));
  const totalType = typeSegs.reduce((a, s) => a + s.v, 0);

  return (
    <>
      <Topbar
        title={<div className="hi">{greeting()}, <span className="accent">Mu&rsquo;taz</span> 👋</div>}
        sub="Ini ringkasan kerjaan lu hari ini"
        onMenu={onMenu}
      >
        {k.streak > 0 && <span className="streak"><Icon name="fire" size="sm" /> {k.streak} hari beruntun</span>}
      </Topbar>

      {/* Quick log bar */}
      <div className="quicklog">
        <span className="qi"><Icon name="bolt" /></span>
        <input className="q" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && quickSave()} placeholder="Baru ngerjain apa? Ketik di sini, Enter buat catat..." />
        <select value={pid} onChange={e => setPid(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input className="h" type="number" step="0.25" min="0" value={qh} onChange={e => setQh(e.target.value)} title="Jam" />
        <button className="btn sm" onClick={quickSave} disabled={saving}><Icon name="check" /> Catat</button>
      </div>

      <div className="kpis">{kpi.map((x, i) => <KpiCard key={i} {...x} />)}</div>

      <div className="grid2">
        <div className="panel">
          <h3><span className="tl"><Icon name="trend" /> Jam Kerja 14 Hari</span><span className="mini">semua project</span></h3>
          {days.length ? (
            <div className="weekbars">
              {days.map(d => (
                <div className={`wb ${d.log_date === today ? 'today' : ''}`} key={d.log_date} title={`${fmtDate(d.log_date)}: ${hrs(d.hours)}`}>
                  <span className="val">{Number(d.hours) > 0 ? num(d.hours) : ''}</span>
                  <div className="fill" style={{ height: (Number(d.hours) / maxH * 100) + '%' }} />
                  <span className="lbl">{dowShort(d.log_date)}</span>
                </div>
              ))}
            </div>
          ) : <Empty icon="clock">Belum ada log minggu ini</Empty>}
        </div>
        <div className="panel">
          <h3>Jam per Konteks</h3>
          {typeSegs.length ? (
            <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              <Donut segs={typeSegs} center={num(totalType)} label="jam" />
              <div className="legend">{typeSegs.map(s => <div key={s.l}><span className="dot" style={{ background:s.c }} /> {s.l} · {hrs(s.v)}</div>)}</div>
            </div>
          ) : <Empty icon="chart">Belum ada data</Empty>}
        </div>
      </div>

      <div className="grid3">
        <div className="panel">
          <h3><span className="tl"><Icon name="clock" /> Kerjaan Terakhir</span></h3>
          {dashboard.recentLogs.length ? dashboard.recentLogs.map(l => (
            <div className="mini-row clk" key={l.id} onClick={() => nav('/projects/' + l.project_id)}>
              <div className="l"><span className="swatch" style={{ background:l.color }} /><span>{l.description}</span></div>
              <b style={{ whiteSpace:'nowrap', color:'var(--brand)' }}>{hrs(l.hours)}</b>
            </div>
          )) : <Empty icon="clock" action={<button className="btn sm" onClick={() => open(<WorkLogForm projects={projects} onDone={refresh} />)}><Icon name="plus" /> Catat Pertama</button>}>Belum ada kerjaan tercatat</Empty>}
        </div>
        <div className="panel">
          <h3><span className="tl"><Icon name="calendar" /> Due Minggu Ini</span></h3>
          {dashboard.dueSoon.length ? dashboard.dueSoon.map(t => (
            <div className="mini-row clk" key={t.id} onClick={() => nav('/projects/' + t.project_id)}>
              <div className="l"><span className="swatch" style={{ background:t.color }} /><span>{t.title}</span></div>
              <span style={{ color:'var(--orange)', whiteSpace:'nowrap' }}>{fmtDate(t.due_date)}</span>
            </div>
          )) : <Empty icon="check">Ga ada deadline dekat 🎉</Empty>}
        </div>
        <div className="panel">
          <h3><span className="tl"><Icon name="fire" /> Lama Ga Disentuh</span><span className="mini">≥5 hari</span></h3>
          {dashboard.stale.length ? dashboard.stale.map(p => (
            <div className="mini-row clk" key={p.id} onClick={() => nav('/projects/' + p.id)}>
              <div className="l"><span className="swatch" style={{ background:p.color }} /><span>{p.name}</span></div>
              <span style={{ color:idleColor(p.days_idle), whiteSpace:'nowrap' }}>{idleText(p.days_idle)}</span>
            </div>
          )) : <Empty icon="check">Semua project fresh 🎉</Empty>}
        </div>
      </div>

      {Number(k.unpaid_total) > 0 && (
        <div className="panel" style={{ borderLeft:'3px solid var(--orange)' }}>
          <h3><span className="tl"><Icon name="wallet" /> Belum Dibayar</span>
            <span className="row"><b style={{ color:'var(--orange)', fontSize:16 }}>{money(k.unpaid_total)}</b>
            <button className="btn ghost sm" onClick={() => nav('/finance')}>Lihat Finance</button></span></h3>
        </div>
      )}
    </>
  );
}
