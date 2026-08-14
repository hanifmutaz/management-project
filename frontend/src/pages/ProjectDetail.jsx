import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { healthLabel, healthClass, healthDot, statusLabel, statusClass, sevLabel, sevClass, fmtDate, fmtDateTime, num } from '../lib/format.js';
import { DataTable, Badge, ProgCell, RowActions, Empty } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { TaskForm, MilestoneForm, DeliverableForm, IssueForm, RiskForm, ActionForm, DecisionForm, ApprovalForm, ConfirmDialog } from '../modals/Forms.jsx';
import { exportPortfolio } from '../lib/export.js';

const TABS = [
  { id:'overview', icon:'grid', label:'Overview' },
  { id:'tasks', icon:'check-sq', label:'Tasks', add:'task' },
  { id:'milestones', icon:'flag', label:'Milestones', add:'milestone' },
  { id:'deliverables', icon:'layers', label:'Deliverables', add:'deliverable' },
  { id:'issues', icon:'alert', label:'Issues', add:'issue' },
  { id:'risks', icon:'shield', label:'Risks', add:'risk' },
  { id:'actions', icon:'flow', label:'Actions', add:'action' },
  { id:'decisions', icon:'gavel', label:'Decisions', add:'decision' },
  { id:'evidence', icon:'archive', label:'Evidence' },
];
const evColor = { progress:'var(--brand)', issue:'var(--orange)', risk:'var(--yellow)', decision:'var(--brand2)', approval:'var(--green)' };
const evIcon = { progress:'trend', issue:'alert', risk:'shield', decision:'gavel', approval:'gavel' };

export default function ProjectDetail({ onMenu }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { deleteEntity, projects } = useStore();
  const { open } = useModal();
  const [tab, setTab] = useState('overview');
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { setP(await api.project(id)); } catch (e) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  // reload detail tiap kali store.projects berubah (proxy dari refreshAll setelah CRUD)
  useEffect(() => { if (p) load(); /* eslint-disable-next-line */ }, [projects]);

  if (err) return <div style={{ padding:40 }}><Empty icon="folder">{err}</Empty></div>;
  if (!p) return null;

  const del = (kind, item, label) => open(<ConfirmDialog message={`Hapus ${label} "${item.title || item.name}"?`} onYes={() => deleteEntity(kind, item.id, `${label} dihapus`)} />);
  const addForms = {
    task: () => <TaskForm project={p} />, milestone: () => <MilestoneForm project={p} />,
    deliverable: () => <DeliverableForm project={p} />, issue: () => <IssueForm project={p} />,
    risk: () => <RiskForm project={p} />, action: () => <ActionForm project={p} />, decision: () => <DecisionForm project={p} />,
  };
  const curTab = TABS.find(t => t.id === tab);

  return (
    <>
      <Topbar title={<><span style={{ color:'var(--muted)', fontWeight:400, cursor:'pointer' }} onClick={() => nav('/projects')}>Projects / </span>{p.name}</>} sub={`${p.project_code} · ${statusLabel(p.status)} · ${p.category || ''}`} onMenu={onMenu}>
        <button className="btn ghost sm" onClick={() => open(<ApprovalForm project={p} detail={p} />)}><Icon name="gavel" /> Request Approval</button>
        <button className="btn ghost sm" onClick={() => exportPortfolio([p2row(p)], 'xls', p.project_code)}><Icon name="archive" /> Evidence Pack</button>
        {curTab.add && <button className="btn sm" onClick={() => open(addForms[curTab.add]())}><Icon name="plus" /> {curTab.label.replace(/s$/, '')}</button>}
      </Topbar>

      <div className="dhead">
        <div>
          <Badge cls={statusClass(p.status)}>{statusLabel(p.status)}</Badge> <Badge cls={healthClass[p.health]} dot={healthDot[p.health]}>{healthLabel[p.health]}</Badge>
          <h2>{p.name}</h2>
          <div className="dmeta">
            <div><span>OWNER</span><b>{ownerName(p)}</b></div>
            <div><span>START</span><b>{fmtDate(p.start_date)}</b></div>
            <div><span>TARGET</span><b>{fmtDate(p.target_date)}</b></div>
            <div><span>PROGRESS</span><b>{avg(p)}%</b></div>
          </div>
        </div>
        <div className="ring" style={{ background:`conic-gradient(${healthDot[p.health]} ${avg(p)}%, var(--panel2) 0)` }}>
          <div style={{ width:76, height:76, borderRadius:'50%', background:'var(--panel)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:19 }}>{avg(p)}%</div>
        </div>
      </div>

      <div className={`health-banner ${p.health === 'critical' ? 'crit' : p.health === 'on_track' ? 'ok' : ''}`}>
        <span style={{ color:healthDot[p.health] }}><Icon name={p.health === 'on_track' ? 'shield' : 'alert'} /></span>
        <div><b>{healthLabel[p.health].toUpperCase()}</b> — {p.health_reason}</div>
      </div>

      <div className="tabs">
        {TABS.map(t => <a key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}><Icon name={t.icon} /> {t.label}</a>)}
      </div>

      {tab === 'overview' && <OverviewTab p={p} />}
      {tab === 'tasks' && <Panel><DataTable cols={taskCols(open, del)} rows={p.tasks} cardTitle={t => `${t.task_code} · ${t.title}`} /></Panel>}
      {tab === 'milestones' && <Panel><DataTable cols={msCols(open, del)} rows={p.milestones} cardTitle={m => m.name} /></Panel>}
      {tab === 'deliverables' && <Panel><DataTable cols={delCols(open, del)} rows={p.deliverables} cardTitle={d => d.name} /></Panel>}
      {tab === 'issues' && <Panel><DataTable cols={issCols(open, del)} rows={p.issues} cardTitle={i => i.title} /></Panel>}
      {tab === 'risks' && <RisksTab p={p} open={open} del={del} />}
      {tab === 'actions' && <Panel><DataTable cols={actCols(open, del)} rows={p.actions} cardTitle={a => a.title} /></Panel>}
      {tab === 'decisions' && <Panel><DataTable cols={decCols(open, del)} rows={p.decisions} cardTitle={d => d.title} /></Panel>}
      {tab === 'evidence' && (
        <div className="panel"><h3>Evidence Timeline <span className="mini">traceable</span></h3>
          <div className="tl">
            {p.evidence.length ? p.evidence.map((e, i) => (
              <div className="item" key={i}>
                <span className="dotm" style={{ color: evColor[e.etype] || 'var(--gray)' }}><Icon name={evIcon[e.etype] || 'archive'} /></span>
                <b>{e.actor || 'System'}</b> — {e.summary}<span className="ev-type">{e.etype}</span><div className="ts">{fmtDateTime(e.at)}</div>
              </div>
            )) : <Empty icon="archive">Belum ada evidence</Empty>}
          </div>
        </div>
      )}
    </>
  );
}
const Panel = ({ children }) => <div className="panel" style={{ padding:0 }}>{children}</div>;
const avg = (p) => p.tasks.length ? Math.round(p.tasks.reduce((a, t) => a + Number(t.progress), 0) / p.tasks.length) : 0;
const ownerName = (p) => p.tasks[0]?.pic || '—';
const p2row = (p) => ({ project_code:p.project_code, name:p.name, owner:ownerName(p), avg_progress:avg(p), health:p.health, status:p.status });

const taskCols = (open, del) => [
  { h:'ID', title:1, cell:t => t.task_code },
  { h:'Task', cell:t => t.title },
  { h:'Status', cell:t => <Badge cls={statusClass(t.status)}>{statusLabel(t.status)}</Badge> },
  { h:'Progress', cell:t => <ProgCell value={num(t.progress)} /> },
  { h:'Due', cell:t => fmtDate(t.due_date) },
  { h:'Constraint', cell:t => t.constraint_note || '—' },
  { h:'Next Action', cell:t => t.next_action || '—' },
  { h:'', cell:t => <RowActions onEdit={() => open(<TaskForm edit={t} />)} onDelete={() => del('tasks', t, 'Task')} /> },
];
const msCols = (open, del) => [
  { h:'Milestone', title:1, cell:m => m.name }, { h:'Owner', cell:m => m.owner }, { h:'Target', cell:m => fmtDate(m.target_date) },
  { h:'Progress', cell:m => <ProgCell value={num(m.progress)} /> },
  { h:'Status', cell:m => <Badge cls={statusClass(m.status)}>{statusLabel(m.status)}</Badge> },
  { h:'', cell:m => <RowActions onEdit={() => open(<MilestoneForm edit={m} />)} onDelete={() => del('milestones', m, 'Milestone')} /> },
];
const delCols = (open, del) => [
  { h:'Deliverable', title:1, cell:d => d.name }, { h:'Milestone', cell:d => d.ms || '—' }, { h:'Owner', cell:d => d.owner }, { h:'Target', cell:d => fmtDate(d.target_date) },
  { h:'Progress', cell:d => <ProgCell value={num(d.progress)} /> },
  { h:'Status', cell:d => <Badge cls={statusClass(d.status)}>{statusLabel(d.status)}</Badge> },
  { h:'', cell:d => <RowActions onEdit={() => open(<DeliverableForm edit={d} />)} onDelete={() => del('deliverables', d, 'Deliverable')} /> },
];
const issCols = (open, del) => [
  { h:'Title', title:1, cell:i => i.title }, { h:'Severity', cell:i => <Badge cls={sevClass(i.severity)}>{sevLabel(i.severity)}</Badge> },
  { h:'Impact', cell:i => i.impact || '—' }, { h:'Status', cell:i => <Badge cls={statusClass(i.status)}>{statusLabel(i.status)}</Badge> }, { h:'Next', cell:i => i.next_action || '—' },
  { h:'', cell:i => <RowActions onEdit={() => open(<IssueForm edit={i} />)} onDelete={() => del('issues', i, 'Issue')} /> },
];
const actCols = (open, del) => [
  { h:'Action', title:1, cell:a => a.title }, { h:'Owner', cell:a => a.owner }, { h:'Due', cell:a => fmtDate(a.due_date) },
  { h:'Status', cell:a => <Badge cls={statusClass(a.status)}>{statusLabel(a.status)}</Badge> },
  { h:'', cell:a => <RowActions onEdit={() => open(<ActionForm edit={a} />)} onDelete={() => del('actions', a, 'Action')} /> },
];
const decCols = (open, del) => [
  { h:'Decision', title:1, cell:d => d.title }, { h:'By', cell:d => d.by }, { h:'Date', cell:d => fmtDate(d.decided_at) },
  { h:'Reason', cell:d => d.reason || '—' }, { h:'Impact', cell:d => d.impact || '—' },
  { h:'', cell:d => <RowActions onEdit={() => open(<DecisionForm edit={d} />)} onDelete={() => del('decisions', d, 'Decision')} /> },
];

function OverviewTab({ p }) {
  const trend = [{ d:'01', v:10 }, { d:'02', v:20 }, { d:'03', v:30 }, { d:'04', v:45 }, { d:'05', v:avg(p) }];
  const w = 600, hh = 150, pad = 20;
  const P = trend.map((pt, i) => [pad + i * (w - 2 * pad) / (trend.length - 1), hh - pad - (pt.v / 100) * (hh - 2 * pad)]);
  const path = P.map((pt, i) => (i ? 'L' : 'M') + pt[0].toFixed(0) + ' ' + pt[1].toFixed(0)).join(' ');
  const area = `M${P[0][0]} ${hh - pad} ` + P.map(pt => `L${pt[0].toFixed(0)} ${pt[1].toFixed(0)}`).join(' ') + ` L${P[P.length - 1][0]} ${hh - pad} Z`;
  return (
    <>
      <div className="grid3">
        <div className="panel"><h3>Milestones</h3>{p.milestones.length ? p.milestones.map(m => (
          <div className="pline" key={m.id}><div className="top"><span>{m.name}</span><b>{num(m.progress)}%</b></div><div className="bar"><i style={{ width:num(m.progress) + '%' }} /></div></div>
        )) : <Empty>—</Empty>}</div>
        <div className="panel"><h3>Open Issues</h3>{p.issues.length ? p.issues.map(i => (
          <div key={i.id} style={{ marginBottom:11 }}><div style={{ fontWeight:600, fontSize:12.5 }}>{i.title} <Badge cls={sevClass(i.severity)}>{sevLabel(i.severity)}</Badge></div><div style={{ fontSize:11.5, color:'var(--muted)', marginTop:3 }}>{i.impact}</div></div>
        )) : <Empty>Tidak ada issue</Empty>}</div>
        <div className="panel"><h3>Next Actions</h3>{p.actions.length ? p.actions.slice(0, 4).map(a => (
          <div key={a.id} style={{ marginBottom:11 }}><div style={{ fontWeight:600, fontSize:12.5 }}>{a.title}</div><div style={{ fontSize:11.5, color:'var(--muted)', marginTop:3 }}><Icon name="user" /> {a.owner} · {fmtDate(a.due_date)} · <Badge cls={statusClass(a.status)}>{statusLabel(a.status)}</Badge></div></div>
        )) : <Empty>Tidak ada action</Empty>}</div>
      </div>
      <div className="panel">
        <h3><span className="tl"><Icon name="trend" /> Progress Trend</span><span className="mini">burnup</span></h3>
        <svg width="100%" height="150" viewBox="0 0 600 150" preserveAspectRatio="none">
          <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5b8cff" stopOpacity=".35" /><stop offset="1" stopColor="#5b8cff" stopOpacity="0" /></linearGradient></defs>
          <path d={area} fill="url(#g)" /><path d={path} fill="none" stroke="#5b8cff" strokeWidth="2.5" />
          {P.map((pt, i) => <g key={i}><circle cx={pt[0]} cy={pt[1]} r="3.5" fill="#5b8cff" /><text x={pt[0]} y={hh - 6} fill="var(--faint)" fontSize="10" textAnchor="middle">{trend[i].d}</text></g>)}
        </svg>
      </div>
    </>
  );
}
function RisksTab({ p, open, del }) {
  const risks = p.risks;
  const lv = ['Low', 'Med', 'High', 'Crit'];
  const im = { low:0, medium:1, high:2, critical:3 };
  const at = (pr, i) => risks.filter(r => im[r.probability] === pr && im[r.impact] === i).length;
  const cells = [];
  for (let pr = 3; pr >= 0; pr--) {
    cells.push(<div className="axis" key={'a' + pr}>{lv[pr]}</div>);
    for (let i = 0; i < 4; i++) {
      const rating = (pr + 1) * (i + 1);
      const c = rating >= 12 ? 'm-crit' : rating >= 6 ? 'm-high' : rating >= 3 ? 'm-med' : 'm-low';
      cells.push(<div className={`cell ${c}`} key={pr + '-' + i}>{at(pr, i) || rating}</div>);
    }
  }
  return (
    <div className="grid2">
      <div className="panel" style={{ padding:0 }}>
        <DataTable cols={[
          { h:'Title', title:1, cell:r => r.title }, { h:'P×I', cell:r => `${sevLabel(r.probability)}×${sevLabel(r.impact)}` },
          { h:'Rating', cell:r => <Badge cls={sevClass(r.severity)}>{sevLabel(r.severity)}</Badge> },
          { h:'Status', cell:r => <Badge cls={statusClass(r.status)}>{statusLabel(r.status)}</Badge> },
          { h:'', cell:r => <RowActions onEdit={() => open(<RiskForm edit={r} />)} onDelete={() => del('risks', r, 'Risk')} /> },
        ]} rows={risks} cardTitle={r => r.title} />
      </div>
      <div className="panel">
        <h3>Risk Matrix <span className="mini">probability × impact</span></h3>
        <div className="matrix"><div className="axis" />{lv.map(l => <div className="axis" key={l}>{l}</div>)}{cells}</div>
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:8 }}>↑ Probability · Impact → · angka = jumlah risk di sel</div>
      </div>
    </div>
  );
}
