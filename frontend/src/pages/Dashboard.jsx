import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { KpiCard, Donut, Empty, Badge, DeltaChip, Sparkline } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { WorkLogForm } from '../modals/Forms.jsx';
import { hrs, fmtDate, dowShort, dayLabel, timeAgo, idleText, idleColor, typeColor, typeLabel, taskLabel, prioClass, prioLabel, num, greeting, delta, localISO, weekLabel } from '../lib/format.js';

// One row in the "Today's Tasks" / "In Progress" lists. Clicking the box cycles
// todo -> doing -> done -> todo.
function TaskRow({ t, today, onCycle, showDue }) {
  const due = t.due_date ? String(t.due_date).slice(0, 10) : null;
  let dueBadge = null;
  if (showDue && due) {
    if (due < today && t.status !== 'done') dueBadge = <Badge cls="b-red">Overdue · {fmtDate(due)}</Badge>;
    else if (due === today) dueBadge = <Badge cls="b-orange">Due today</Badge>;
    else dueBadge = <Badge cls="b-gray">Due {fmtDate(due)}</Badge>;
  }
  return (
    <div className="task-row">
      <div className={`tick ${t.status === 'done' ? 'on' : t.status === 'doing' ? 'doing' : ''}`} onClick={() => onCycle(t)} title="Click to change status">
        {t.status === 'done' ? <Icon name="check" /> : t.status === 'doing' ? <Icon name="play" /> : null}
      </div>
      <div className={`tt ${t.status === 'done' ? 'done' : ''}`}>
        <div className="ti">{t.title}</div>
        <div className="tm"><span className="dot" style={{ background:t.color }} /> {t.project_name}<Badge cls={prioClass[t.priority]}>{prioLabel[t.priority]}</Badge>{dueBadge}</div>
      </div>
    </div>
  );
}

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
  const today = localISO();

  // quick-log: Enter saves immediately
  const quickSave = async () => {
    if (!q.trim()) { toast('Type what you worked on first', 'err'); return; }
    setSaving(true);
    try {
      await api.createLog({ project_id: pid || projects[0]?.id, description: q, hours: +qh || 0, log_date: today });
      setQ(''); setQh(1); await refresh(); toast('Work logged');
    } catch (e) { toast(e.message, 'err'); }
    setSaving(false);
  };

  const tasksToday = dashboard.tasksToday || [];
  const tasksDoing = dashboard.tasksDoing || [];
  const doneToday = tasksToday.filter(t => t.status === 'done').length;
  const totalToday = tasksToday.length;
  const todayPct = totalToday ? Math.round(doneToday / totalToday * 100) : 0;
  const cycleTask = async (t) => {
    const next = t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo';
    try { await api.setTaskStatus(t.id, next); await refresh(); } catch (e) { toast(e.message, 'err'); }
  };

  const kpi = [
    { label:"Today's Tasks", value:totalToday ? `${doneToday}/${totalToday}` : '0',
      tag: totalToday === 0 ? 'nothing due today' : doneToday === totalToday ? 'all done' : `${totalToday - doneToday} left`,
      accent: totalToday === 0 ? 'acc-blue' : doneToday === totalToday ? 'acc-green' : 'acc-orange', icon:'check-sq' },
    { label:'Open Tasks', value:k.open_tasks, tag:'not done yet', accent:'acc-blue', icon:'layers' },
    { label:'Overdue', value:k.overdue_tasks, tag:k.overdue_tasks > 0 ? 'needs attention!' : 'all clear', accent:k.overdue_tasks > 0 ? 'acc-red' : 'acc-green', icon:'calendar' },
    { label:'Hours This Week', value:hrs(k.hours_this_week), delta:delta(k.hours_this_week, k.hours_last_week), tag:'vs last week', accent:'acc-purple', icon:'clock' },
  ];

  const days = dashboard.hoursByDay;
  const maxH = Math.max(...days.map(d => Number(d.hours)), 1);
  const totalDays = days.reduce((a, d) => a + Number(d.hours), 0);
  const avgDays = days.length ? totalDays / days.length : 0;
  const typeSegs = dashboard.hoursByType.filter(t => Number(t.hours) > 0).map(t => ({ v: Number(t.hours), c: typeColor[t.type], l: typeLabel[t.type] }));
  const totalType = typeSegs.reduce((a, s) => a + s.v, 0);

  // Weekly trend per context. The API returns rows ordered by week, then type, so each
  // type's values already come out in week order.
  const trendRows = dashboard.hoursTrend || [];
  const weeks = [...new Set(trendRows.map(r => r.week))];
  const byType = {};
  trendRows.forEach(r => { if (!byType[r.type]) byType[r.type] = []; byType[r.type].push(Number(r.hours)); });
  const trend = Object.entries(byType)
    .map(([type, vals]) => ({ type, vals, total: vals.reduce((a, v) => a + v, 0), cur: vals[vals.length - 1] || 0, prev: vals[vals.length - 2] || 0 }))
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total);

  // Upcoming grouped per day (Today / Tomorrow / weekday), already ordered by due_date from the backend
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
        title={<div className="hi">{greeting()}, <span className="accent">Mu&rsquo;taz</span></div>}
        sub="Here's what's on your plate today"
        onMenu={onMenu}
      >
        {k.streak > 0 && <span className="streak"><Icon name="fire" size="sm" /> {k.streak}-day streak</span>}
      </Topbar>

      {/* Quick log bar */}
      <div className="quicklog">
        <span className="qi"><Icon name="bolt" /></span>
        <input className="q" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && quickSave()} placeholder="What did you just work on? Type here, press Enter to log..." />
        <select value={pid} onChange={e => setPid(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input className="h" type="number" step="0.25" min="0" value={qh} onChange={e => setQh(e.target.value)} title="Hours" />
        <button className="btn sm" onClick={quickSave} disabled={saving}><Icon name="check" /> Log</button>
      </div>

      <div className="kpis">{kpi.map((x, i) => <KpiCard key={i} {...x} />)}</div>

      {/* Today's Tasks + In Progress */}
      <div className="grid2 even">
        <div className="panel">
          <h3><span className="tl"><Icon name="check-sq" /> Today&rsquo;s Tasks</span>{totalToday > 0 && <span className="mini">{doneToday}/{totalToday} done</span>}</h3>
          {totalToday > 0 && <div className="bar" style={{ margin:'-4px 0 14px' }} title={`${todayPct}% done`}><i style={{ width: todayPct + '%' }} /></div>}
          {totalToday ? tasksToday.map(t => <TaskRow key={t.id} t={t} today={today} onCycle={cycleTask} />) : (
            <Empty icon="check-sq">
              <div>You&rsquo;re all caught up</div>
              <div style={{ color:'var(--faint)', fontSize:11.5, marginTop:3 }}>No tasks are due today.</div>
            </Empty>
          )}
          <div className="panel-foot"><span>Logged today</span><b>{hrs(k.hours_today)}</b></div>
        </div>
        <div className="panel">
          <h3><span className="tl"><Icon name="play" /> In Progress</span>{tasksDoing.length > 0 && <span className="mini">{tasksDoing.length} running</span>}</h3>
          {tasksDoing.length ? tasksDoing.map(t => <TaskRow key={t.id} t={t} today={today} onCycle={cycleTask} showDue />) : (
            <Empty icon="play" action={<button className="btn ghost sm" onClick={() => nav('/tasks')}>Open Tasks</button>}>
              <div>Nothing in progress</div>
              <div style={{ color:'var(--faint)', fontSize:11.5, marginTop:3 }}>Start a task and it will show up here.</div>
            </Empty>
          )}
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3><span className="tl"><Icon name="trend" /> Hours · Last 14 Days</span><span className="mini">total {hrs(totalDays)} · avg {hrs(avgDays)}/day</span></h3>
          {days.length ? (
            <div className="weekbars">
              {days.map(d => (
                <div className={`wb ${String(d.log_date).slice(0, 10) === today ? 'today' : ''}`} key={d.log_date} title={`${fmtDate(d.log_date)}: ${hrs(d.hours)}`}>
                  <span className="val">{Number(d.hours) > 0 ? num(d.hours) : ''}</span>
                  <div className="fill" style={{ height: (Number(d.hours) / maxH * 100) + '%' }} />
                  <span className="lbl">{dowShort(d.log_date)}</span>
                </div>
              ))}
            </div>
          ) : <Empty icon="clock">No logs yet</Empty>}
        </div>
        <div className="panel">
          <h3>Hours by Context</h3>
          {typeSegs.length ? (
            <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              <Donut segs={typeSegs} center={num(totalType)} label="hours" />
              <div className="legend">{typeSegs.map(s => <div key={s.l}><span className="dot" style={{ background:s.c }} /> {s.l} · {hrs(s.v)} · {Math.round(s.v / totalType * 100)}%</div>)}</div>
            </div>
          ) : <Empty icon="chart">No data yet</Empty>}
        </div>
      </div>

      {/* Trend per context (weekly, last 8 weeks) */}
      <div className="panel" style={{ marginBottom:16 }}>
        <h3><span className="tl"><Icon name="trend" /> Weekly Trend by Context</span><span className="mini">last {weeks.length || 8} weeks · hours per week</span></h3>
        {trend.length ? (
          <div className="trend-grid">
            {trend.map(r => (
              <div className="trend-card" key={r.type} style={{ '--accent': typeColor[r.type] }}>
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

      <div className="panel" style={{ marginBottom:16 }}>
        <h3><span className="tl"><Icon name="clock" /> Recent Work</span><span className="mini link" onClick={() => nav('/worklog')}>View all →</span></h3>
        {dashboard.recentLogs.length ? dashboard.recentLogs.map(l => (
          <div className="recent-row" key={l.id} onClick={() => nav('/projects/' + l.project_id)}>
            <span className="swatch" style={{ background:l.color }} />
            <div className="rbody">
              <div className="rdesc" title={l.description}>{l.description}</div>
              <div className="rmeta">{l.project_name}{l.task_status && <> · {taskLabel[l.task_status]}</>}</div>
            </div>
            <div className="rside">
              <div className="rh">{hrs(l.hours)}</div>
              <div className="rago">{timeAgo(l.created_at)}</div>
            </div>
          </div>
        )) : <Empty icon="clock" action={<button className="btn sm" onClick={() => open(<WorkLogForm projects={projects} onDone={refresh} />)}><Icon name="plus" /> Log your first work</button>}>No work logged yet</Empty>}
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
          )) : <Empty icon="check">No upcoming deadlines</Empty>}
        </div>
        <div className="panel">
          <h3><span className="tl"><Icon name="fire" /> Gone Quiet</span><span className="mini">5+ days idle</span></h3>
          {dashboard.stale.length ? dashboard.stale.map(p => (
            <div className="mini-row clk" key={p.id} onClick={() => nav('/projects/' + p.id)}>
              <div className="l"><span className="swatch" style={{ background:p.color }} /><span>{p.name}</span></div>
              <span style={{ color:idleColor(p.days_idle), whiteSpace:'nowrap' }}>{idleText(p.days_idle)}</span>
            </div>
          )) : <Empty icon="check">All projects are fresh</Empty>}
        </div>
      </div>
    </>
  );
}
