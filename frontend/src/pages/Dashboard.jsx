import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { KpiCard, Donut, Empty, Badge } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { WorkLogForm } from '../modals/Forms.jsx';
import { hrs, fmtDate, dowShort, dayLabel, timeAgo, idleText, idleColor, typeColor, typeLabel, taskLabel, prioClass, prioLabel, num, greeting, delta } from '../lib/format.js';

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

  const tasksToday = dashboard.tasksToday || [];
  const doneToday = tasksToday.filter(t => t.status === 'done').length;
  const totalToday = tasksToday.length;
  const cycleTask = async (t) => {
    const next = t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo';
    try { await api.setTaskStatus(t.id, next); await refresh(); } catch (e) { toast(e.message, 'err'); }
  };

  const kpi = [
    { label:'Task Hari Ini', value:totalToday ? `${doneToday}/${totalToday}` : '0',
      tag: totalToday === 0 ? 'ga ada due hari ini' : doneToday === totalToday ? 'semua kelar 🎉' : `${totalToday - doneToday} belum kelar`,
      accent: totalToday === 0 ? 'acc-blue' : doneToday === totalToday ? 'acc-green' : 'acc-orange', icon:'check-sq' },
    { label:'Task Aktif', value:k.open_tasks, tag:'total belum selesai', accent:'acc-blue', icon:'layers' },
    { label:'Overdue', value:k.overdue_tasks, tag:k.overdue_tasks > 0 ? 'perlu perhatian!' : 'aman, ga ada telat', accent:k.overdue_tasks > 0 ? 'acc-red' : 'acc-green', icon:'calendar' },
    { label:'Jam Minggu Ini', value:hrs(k.hours_this_week), delta:delta(k.hours_this_week, k.hours_last_week), tag:'vs mgg lalu', accent:'acc-purple', icon:'clock' },
  ];

  const days = dashboard.hoursByDay;
  const maxH = Math.max(...days.map(d => Number(d.hours)), 1);
  const totalDays = days.reduce((a, d) => a + Number(d.hours), 0);
  const avgDays = days.length ? totalDays / days.length : 0;
  const today = new Date().toISOString().slice(0, 10);
  const typeSegs = dashboard.hoursByType.filter(t => Number(t.hours) > 0).map(t => ({ v: Number(t.hours), c: typeColor[t.type], l: typeLabel[t.type] }));
  const totalType = typeSegs.reduce((a, s) => a + s.v, 0);

  // Upcoming grouped per hari (Hari ini / Besok / nama hari), urutan udah dari backend by due_date
  const upcomingGroups = [];
  dashboard.dueSoon.forEach(t => {
    const label = dayLabel(t.due_date);
    let g = upcomingGroups.find(g => g.label === label);
    if (!g) { g = { label, items: [] }; upcomingGroups.push(g); }
    g.items.push(t);
  });

  return (
    <>
      <Topbar
        title={<div className="hi">{greeting()}, <span className="accent">Mu&rsquo;taz</span> 👋</div>}
        sub="Ini yang perlu lu kerjain hari ini"
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

      {/* Today's Tasks + Today's Progress */}
      <div className="grid2">
        <div className="panel">
          <h3><span className="tl"><Icon name="check-sq" /> Hari Ini</span>{totalToday > 0 && <span className="mini">{doneToday}/{totalToday} selesai</span>}</h3>
          {totalToday ? tasksToday.map(t => (
            <div className="task-row" key={t.id}>
              <div className={`tick ${t.status === 'done' ? 'on' : t.status === 'doing' ? 'doing' : ''}`} onClick={() => cycleTask(t)} title="Klik ubah status">
                {t.status === 'done' ? <Icon name="check" /> : t.status === 'doing' ? <Icon name="play" /> : null}
              </div>
              <div className={`tt ${t.status === 'done' ? 'done' : ''}`}>
                <div className="ti">{t.title}</div>
                <div className="tm"><span className="dot" style={{ background:t.color }} /> {t.project_name}<Badge cls={prioClass[t.priority]}>{prioLabel[t.priority]}</Badge></div>
              </div>
            </div>
          )) : (
            <Empty icon="check-sq">
              <div>You&rsquo;re all caught up 🎉</div>
              <div style={{ color:'var(--faint)', fontSize:11.5, marginTop:3 }}>Tidak ada task yang harus diselesaikan hari ini.</div>
            </Empty>
          )}
        </div>
        <div className="panel">
          <h3><span className="tl"><Icon name="target" /> Progress Hari Ini</span></h3>
          {totalToday ? (
            <>
              <div style={{ fontSize:34, fontWeight:800, letterSpacing:-1 }}>{Math.round(doneToday / totalToday * 100)}%</div>
              <div className="bar" style={{ margin:'12px 0 16px' }}><i style={{ width: (doneToday / totalToday * 100) + '%' }} /></div>
            </>
          ) : (
            <div style={{ color:'var(--faint)', fontSize:12.5, marginBottom:16 }}>Belum ada task yang due hari ini.</div>
          )}
          <div className="row" style={{ justifyContent:'space-between', fontSize:12.5, color:'var(--muted)' }}>
            <span>{totalToday ? `${doneToday}/${totalToday} task selesai` : 'Jam tercatat hari ini'}</span>
            <b style={{ color:'var(--txt)' }}>{hrs(k.hours_today)}</b>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3><span className="tl"><Icon name="trend" /> Jam Kerja 14 Hari</span><span className="mini">total {hrs(totalDays)} · avg {hrs(avgDays)}/hari</span></h3>
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
              <div className="legend">{typeSegs.map(s => <div key={s.l}><span className="dot" style={{ background:s.c }} /> {s.l} · {hrs(s.v)} · {Math.round(s.v / totalType * 100)}%</div>)}</div>
            </div>
          ) : <Empty icon="chart">Belum ada data</Empty>}
        </div>
      </div>

      <div className="panel" style={{ marginBottom:16 }}>
        <h3><span className="tl"><Icon name="clock" /> Kerjaan Terakhir</span></h3>
        {dashboard.recentLogs.length ? dashboard.recentLogs.map(l => (
          <div className="mini-row clk" key={l.id} onClick={() => nav('/projects/' + l.project_id)}>
            <div className="l" style={{ flexDirection:'column', alignItems:'flex-start', gap:3 }}>
              <span style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
                <span className="swatch" style={{ background:l.color }} />
                <span style={{ fontWeight:600 }}>{l.description}</span>
              </span>
              <span style={{ fontSize:10.5, color:'var(--faint)', paddingLeft:17 }}>
                {l.project_name}{l.task_status && <> · {taskLabel[l.task_status]}</>}
              </span>
            </div>
            <span style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ color:'var(--brand)', fontWeight:700, fontSize:12.5 }}>{hrs(l.hours)}</div>
              <div style={{ fontSize:10, color:'var(--faint)' }}>{timeAgo(l.created_at)}</div>
            </span>
          </div>
        )) : <Empty icon="clock" action={<button className="btn sm" onClick={() => open(<WorkLogForm projects={projects} onDone={refresh} />)}><Icon name="plus" /> Catat Pertama</button>}>Belum ada kerjaan tercatat</Empty>}
      </div>

      <div className="grid2">
        <div className="panel">
          <h3><span className="tl"><Icon name="calendar" /> Upcoming</span></h3>
          {upcomingGroups.length ? upcomingGroups.map(g => (
            <div key={g.label} style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:.6, color:'var(--faint)', marginBottom:6 }}>{g.label}</div>
              {g.items.map(t => (
                <div className="mini-row clk" key={t.id} onClick={() => nav('/projects/' + t.project_id)}>
                  <div className="l"><span className="swatch" style={{ background:t.color }} /><span>{t.title}</span></div>
                  <span style={{ color:'var(--faint)', whiteSpace:'nowrap', fontSize:11 }}>{t.project_name}</span>
                </div>
              ))}
            </div>
          )) : <Empty icon="check">No upcoming deadlines 🎉</Empty>}
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
    </>
  );
}
