import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { KpiCard, Donut, Empty, Badge, WorkspaceTag } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { WorkLogForm } from '../modals/Forms.jsx';
import {
  hrs, delta, greeting, localISO, MON, dayDiff, dayHeading, dueInfo, fmtDate, timeAgo,
  typeColor, typeLabel, typeIcon, typeDesc, TYPE_ORDER, prioClass, prioLabel,
} from '../lib/format.js';

const dateOf = (v) => (v ? String(v).slice(0, 10) : null);
const PRIO = { high: 0, medium: 1, low: 2 };
const byDueThenPrio = (a, b) => (dateOf(a.due_date) || '9').localeCompare(dateOf(b.due_date) || '9') || PRIO[a.priority] - PRIO[b.priority];

// Round-checkbox that completes (or re-opens) a task.
function Check({ task, onToggle }) {
  const done = task.status === 'done';
  return (
    <button type="button" className={`cb ${done ? 'on' : ''}`} onClick={() => onToggle(task)} aria-label={done ? 'Mark as not done' : 'Mark as done'} title={done ? 'Mark as not done' : 'Mark as done'}>
      {done && <Icon name="check" size="sm" />}
    </button>
  );
}

function NeedsAttention({ items, onToggle, onOpen, total }) {
  const nav = useNavigate();
  return (
    <section className="panel" style={{ marginBottom:16 }}>
      <h3>
        <span className="tl"><span className="ph-ico warn"><Icon name="alert" /></span> Needs Attention</span>
        <span className="link" onClick={() => nav('/tasks')}>View all <Icon name="chev" size="sm" /></span>
      </h3>
      {items.length ? (
        <div className="attn">
          <div className="attn-head"><span /><span>Task / Project</span><span>Workspace</span><span>Due date</span><span>Priority</span></div>
          {items.map(t => {
            const due = dueInfo(dateOf(t.due_date));
            return (
              <div className="attn-row" key={t.id}>
                <Check task={t} onToggle={onToggle} />
                <div className="attn-main" onClick={() => onOpen(t.project_id)}>
                  <div className="t">{t.title}</div>
                  <div className="s">{t.project_name}</div>
                </div>
                <span className="attn-ws"><WorkspaceTag type={t.project_type} label={typeLabel[t.project_type]} /></span>
                <span className={`due ${due.tone}`}>{due.text}</span>
                <span><Badge cls={prioClass[t.priority]}>{prioLabel[t.priority]}</Badge></span>
              </div>
            );
          })}
          {total > items.length && <div className="attn-more" onClick={() => nav('/tasks')}>+{total - items.length} more due soon or overdue</div>}
        </div>
      ) : <Empty icon="check">Nothing is overdue or due in the next 3 days.</Empty>}
    </section>
  );
}

function TaskList({ tasks, onToggle, onStart, onOpen, emptyText }) {
  const [all, setAll] = useState(false);
  const shown = all ? tasks : tasks.slice(0, 4);
  if (!tasks.length) return <div className="lane-empty">{emptyText}</div>;
  return (
    <div className="lane-list">
      {shown.map(t => (
        <div className={`lane-row ${t.status === 'done' ? 'is-done' : ''}`} key={t.id}>
          <Check task={t} onToggle={onToggle} />
          <div className="lane-main" onClick={() => onOpen(t.project_id)}>
            <div className="t">{t.title}</div>
            <div className="s">{t.project_name}{t.client_name ? ` · ${t.client_name}` : ''}</div>
          </div>
          <span className="lane-act">
            {t.status === 'todo' && <button type="button" className="startbtn" onClick={() => onStart(t)} title="Start this task" aria-label="Start this task"><Icon name="play" size="sm" /></button>}
            <Badge cls={prioClass[t.priority]}>{prioLabel[t.priority]}</Badge>
          </span>
        </div>
      ))}
      {tasks.length > 4 && <button type="button" className="more-btn" onClick={() => setAll(!all)}>{all ? 'Show less' : `Show ${tasks.length - 4} more`}</button>}
    </div>
  );
}

function Lane({ type, tasks, projects, onToggle, onStart }) {
  const nav = useNavigate();
  const dueToday = tasks.filter(t => dateOf(t.due_date) === localISO()).sort((a, b) => (a.status === 'done') - (b.status === 'done') || PRIO[a.priority] - PRIO[b.priority]);
  const doing = tasks.filter(t => t.status === 'doing').sort(byDueThenPrio);
  const dueOpen = dueToday.filter(t => t.status !== 'done').length;
  const [tab, setTab] = useState(dueOpen === 0 && doing.length > 0 ? 'doing' : 'due');
  const weekHours = projects.reduce((a, p) => a + Number(p.hours), 0);

  // Top projects, or top clients for the freelance lane (projects without a client fall back to the project name)
  const byClient = type === 'freelance';
  const groups = {};
  projects.forEach(p => {
    const key = byClient ? (p.client_name || p.name) : p.name;
    groups[key] = (groups[key] || 0) + Number(p.hours);
  });
  const ranked = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, 3);
  const others = ranked.slice(3).reduce((a, [, h]) => a + h, 0);
  if (others > 0) top.push(['Others', others]);
  const maxTop = Math.max(...top.map(([, h]) => h), 1);

  return (
    <section className="panel lane" style={{ '--c': typeColor[type] }}>
      <div className="lane-head">
        <span className="lane-ico"><Icon name={typeIcon[type]} /></span>
        <div className="lane-id"><h3>{typeLabel[type]}</h3><p>{typeDesc[type]}</p></div>
        <div className="lane-hours"><b>{hrs(weekHours)}</b><span>this week</span></div>
      </div>

      <div className="lane-tabs">
        <div className="tabset" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'due'} className={tab === 'due' ? 'on' : ''} onClick={() => setTab('due')}>Due Today <span>({dueOpen})</span></button>
          <button type="button" role="tab" aria-selected={tab === 'doing'} className={tab === 'doing' ? 'on' : ''} onClick={() => setTab('doing')}>In Progress <span>({doing.length})</span></button>
        </div>
        <span className="link" onClick={() => nav('/tasks')}>View all <Icon name="chev" size="sm" /></span>
      </div>

      <TaskList
        tasks={tab === 'due' ? dueToday : doing}
        onToggle={onToggle} onStart={onStart} onOpen={(id) => nav('/projects/' + id)}
        emptyText={tab === 'due' ? 'Nothing due today.' : 'No task in progress.'}
      />

      <div className="lane-top">
        <div className="lane-top-head"><h4>{byClient ? 'Top Clients This Week' : 'Top Projects This Week'}</h4><span className="link" onClick={() => nav('/projects')}>View all</span></div>
        {top.length ? top.map(([label, h]) => (
          <div className="hrow" key={label}>
            <span className="hl" title={label}>{label}</span>
            <span className="htrack"><i style={{ width: (h / maxTop * 100) + '%' }} /></span>
            <span className="hv">{hrs(h)}</span>
          </div>
        )) : <div className="lane-empty">No hours logged this week.</div>}
      </div>
    </section>
  );
}

// Stacked bars: one column per day, stacked by workspace, with y-axis gridlines and a hover tooltip.
function WorkloadChart({ days, types }) {
  const max = Math.max(...days.map(d => d.total), 1);
  const step = [1, 2, 4, 5, 10, 20, 50].find(s => max / s <= 4) || 50;
  const yMax = Math.ceil(max / step) * step;
  const ticks = []; for (let v = 0; v <= yMax; v += step) ticks.push(v);
  const n = days.length;
  return (
    <div className="wl">
      <div className="wl-y">{ticks.map(v => <span key={v} style={{ bottom: (v / yMax * 100) + '%' }}>{v}h</span>)}</div>
      <div className="wl-plot">
        {ticks.map(v => <i className="wl-grid" key={v} style={{ bottom: (v / yMax * 100) + '%' }} />)}
        <div className="wl-cols">
          {days.map((d, i) => (
            <div className="wl-col" key={d.key}>
              {d.total > 0 && (
                <div className="wl-bar" style={{ height: (d.total / yMax * 100) + '%' }}>
                  {types.map(t => d.by[t] > 0 && <span className="wl-seg" key={t} style={{ flexGrow: d.by[t], background: typeColor[t] }} />)}
                </div>
              )}
              <div className={`wl-tip ${i < 2 ? 'l' : i > n - 3 ? 'r' : ''}`}>
                <b>{d.long}</b>
                {types.filter(t => d.by[t] > 0).map(t => <div key={t}><i style={{ background: typeColor[t] }} />{typeLabel[t]}<em>{hrs(d.by[t])}</em></div>)}
                {d.total === 0 ? <div className="none">No hours logged</div> : <div className="tot">Total<em>{hrs(d.total)}</em></div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="wl-xs" />
      <div className="wl-x">{days.map((d, i) => <span key={d.key} className={(n - 1 - i) % 4 === 0 ? 'q' : ''}>{(n - 1 - i) % 2 === 0 ? d.label : ''}</span>)}</div>
    </div>
  );
}

export default function Dashboard() {
  const { dashboard, projects, refresh, toast } = useStore();
  const { open } = useModal();
  const nav = useNavigate();
  if (!dashboard) return null;

  const today = localISO();
  const { tasks, hoursByDayType, weekProjects, hours, recentLogs, streak } = dashboard;
  const openTasks = tasks.filter(t => t.status !== 'done');
  const dueToday = tasks.filter(t => dateOf(t.due_date) === today);
  const doneToday = dueToday.filter(t => t.status === 'done').length;
  const overdue = openTasks.filter(t => dateOf(t.due_date) && dateOf(t.due_date) < today);
  const activeProjects = new Set(openTasks.map(t => t.project_id)).size;

  const setStatus = async (t, status) => {
    try { await api.setTaskStatus(t.id, status); await refresh(); if (status === 'done') toast('Task completed'); }
    catch (e) { toast(e.message, 'err'); }
  };
  const toggleDone = (t) => setStatus(t, t.status === 'done' ? 'todo' : 'done');
  const startTask = (t) => setStatus(t, 'doing');

  // Needs Attention = overdue + due within 3 days, soonest first
  const attentionAll = openTasks.filter(t => dateOf(t.due_date) && dayDiff(dateOf(t.due_date)) <= 3).sort(byDueThenPrio);
  const attention = attentionAll.slice(0, 6);

  // Lanes: Office and Freelance always, other workspaces only when they have open tasks or hours this week
  const laneTypes = TYPE_ORDER.filter(ty => ty === 'office' || ty === 'freelance' || openTasks.some(t => t.project_type === ty) || weekProjects.some(p => p.type === ty));

  // Last 14 days, zero-filled, stacked by workspace
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = localISO(d);
    days.push({ key, label: `${d.getDate()} ${MON[d.getMonth()]}`, long: `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`, by: {}, total: 0 });
  }
  hoursByDayType.forEach(r => {
    const d = days.find(x => x.key === r.day);
    if (d) { d.by[r.type] = (d.by[r.type] || 0) + Number(r.hours); d.total += Number(r.hours); }
  });
  const chartTypes = TYPE_ORDER.filter(ty => days.some(d => d.by[ty] > 0));
  const total14 = days.reduce((a, d) => a + d.total, 0);

  const weekByType = TYPE_ORDER.map(ty => ({ type: ty, v: weekProjects.filter(p => p.type === ty).reduce((a, p) => a + Number(p.hours), 0) })).filter(x => x.v > 0);
  const weekTotal = weekByType.reduce((a, x) => a + x.v, 0);

  // Upcoming: open tasks due from today to 14 days out
  const upcoming = openTasks.filter(t => { const d = dateOf(t.due_date); return d && dayDiff(d) >= 0 && dayDiff(d) <= 14; }).sort(byDueThenPrio).slice(0, 8);
  const upGroups = [];
  upcoming.forEach(t => {
    const label = dayHeading(dateOf(t.due_date));
    let g = upGroups.find(x => x.label === label);
    if (!g) { g = { label, items: [] }; upGroups.push(g); }
    g.items.push(t);
  });

  return (
    <>
      <Topbar
        title={<h1>{greeting()}, <span className="accent">Mu&rsquo;taz</span></h1>}
        sub="Here's what needs your attention today."
      >
        {streak > 0 && <span className="streak"><Icon name="fire" size="sm" /> {streak}-day streak</span>}
      </Topbar>

      <div className="kpis">
        <KpiCard label="Today's Tasks" value={dueToday.length ? `${doneToday} / ${dueToday.length}` : '0'}
          progress={dueToday.length ? Math.round(doneToday / dueToday.length * 100) : 0}
          tag={dueToday.length === 0 ? 'nothing due today' : doneToday === dueToday.length ? 'all done' : `${dueToday.length - doneToday} remaining`} />
        <KpiCard label="Active Tasks" value={openTasks.length} tag={`across ${activeProjects} project${activeProjects === 1 ? '' : 's'}`} />
        <KpiCard label="Overdue" value={overdue.length} tone={overdue.length ? 'danger' : 'ok'} tag={overdue.length ? 'needs attention' : 'all clear'} />
        <KpiCard label="Hours This Week" value={hrs(hours.this_week)} delta={delta(hours.this_week, hours.last_week)} tag="vs last week" />
      </div>

      <NeedsAttention items={attention} total={attentionAll.length} onToggle={toggleDone} onOpen={(id) => nav('/projects/' + id)} />

      <div className="lanes">
        {laneTypes.map(ty => (
          <Lane key={ty} type={ty} tasks={tasks.filter(t => t.project_type === ty)}
            projects={weekProjects.filter(p => p.type === ty)} onToggle={toggleDone} onStart={startTask} />
        ))}
      </div>

      <div className="split wl-split">
        <section className="panel">
          <h3>
            <span>Workload <span className="sep">·</span> Last 14 Days</span>
            <span className="mini">Total <b>{hrs(total14)}</b> <span className="gap" /> Avg <b>{hrs(total14 / 14)}</b>/day</span>
          </h3>
          {total14 > 0 ? (
            <>
              <WorkloadChart days={days} types={chartTypes} />
              <div className="wl-legend">
                {chartTypes.map(ty => (
                  <span key={ty}><i style={{ background: typeColor[ty] }} />{typeLabel[ty]} <b>{hrs(days.reduce((a, d) => a + (d.by[ty] || 0), 0))}</b></span>
                ))}
              </div>
            </>
          ) : <Empty icon="chart">No hours logged in the last 14 days</Empty>}
        </section>
        <section className="panel">
          <h3>This Week</h3>
          {weekTotal > 0 ? (
            <div className="week-split">
              <Donut segs={weekByType.map(x => ({ v: x.v, c: typeColor[x.type] }))} center={hrs(weekTotal)} label="total" size={150} />
              <div className="week-legend">
                {weekByType.map(x => (
                  <div key={x.type}><i style={{ background: typeColor[x.type] }} /><span>{typeLabel[x.type]}</span><b>{hrs(x.v)}</b><em>{Math.round(x.v / weekTotal * 100)}%</em></div>
                ))}
              </div>
            </div>
          ) : <Empty icon="chart">No hours logged this week</Empty>}
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h3>Recent Activity <span className="link" onClick={() => nav('/worklog')}>View all <Icon name="chev" size="sm" /></span></h3>
          {recentLogs.length ? recentLogs.map(l => (
            <div className="act-row" key={l.id} onClick={() => nav('/projects/' + l.project_id)}>
              <i className="act-dot" style={{ background: typeColor[l.project_type] }} />
              <div className="act-main">
                <div className="t" title={l.description}>{l.description}</div>
                <div className="s">{l.project_name} · {hrs(l.hours)}</div>
              </div>
              <span className="act-time">{timeAgo(l.created_at)}</span>
            </div>
          )) : <Empty icon="clock" action={<button className="btn sm" onClick={() => open(<WorkLogForm projects={projects} onDone={refresh} />)}><Icon name="plus" /> Log your first work</button>}>No work logged yet</Empty>}
        </section>
        <section className="panel">
          <h3>Upcoming <span className="link" onClick={() => nav('/tasks')}>View all <Icon name="chev" size="sm" /></span></h3>
          {upGroups.length ? upGroups.map(g => (
            <div className="up-group" key={g.label}>
              <h4>{g.label}</h4>
              {g.items.map(t => (
                <div className="up-row" key={t.id} onClick={() => nav('/projects/' + t.project_id)}>
                  <i className="act-dot" style={{ background: typeColor[t.project_type] }} />
                  <span className="up-t" title={t.title}>{t.title}</span>
                  <WorkspaceTag type={t.project_type} label={typeLabel[t.project_type]} />
                  <span className="up-d">{dayDiff(dateOf(t.due_date)) === 0 ? 'Today' : fmtDate(t.due_date)}</span>
                </div>
              ))}
            </div>
          )) : <Empty icon="calendar">No upcoming deadlines in the next 2 weeks</Empty>}
        </section>
      </div>
    </>
  );
}
