import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { Badge, Empty, DataTable } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { ProjectForm, TaskForm, WorkLogForm, PaymentForm } from '../modals/Forms.jsx';
import { typeLabel, typeClass, projStatusLabel, projStatusClass, taskLabel, taskClass, prioClass, prioLabel, payLabel, payClass, hrs, money, fmtDate } from '../lib/format.js';

export default function ProjectDetail({ onMenu }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { projects, refresh } = useStore();
  const { open } = useModal();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('tasks');

  const load = useCallback(async () => {
    try { setP(await api.project(id)); } catch (e) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  const reload = async () => { await load(); await refresh(); };

  if (err) return <div style={{ padding:40 }}><Empty icon="folder">{err}</Empty></div>;
  if (!p) return null;
  const paid = p.type === 'freelance' || p.type === 'parttime';
  const cycleTask = async (t) => {
    const next = t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo';
    await api.setTaskStatus(t.id, next); reload();
  };
  const TABS = [
    { id:'tasks', icon:'check-sq', label:'Tasks', cnt:p.tasks.length },
    { id:'worklog', icon:'clock', label:'Work Log', cnt:p.work_logs.length },
    ...(paid ? [{ id:'payments', icon:'wallet', label:'Payments', cnt:p.payments.length }] : []),
    { id:'notes', icon:'note', label:'Notes' },
  ];

  return (
    <>
      <Topbar title={<h1><span style={{ color:'var(--muted)', fontWeight:400, cursor:'pointer' }} onClick={() => nav('/projects')}>Projects / </span>{p.name}</h1>} sub={`${typeLabel[p.type]} · ${projStatusLabel[p.status]}`} onMenu={onMenu}>
        <button className="btn ghost sm" onClick={() => open(<WorkLogForm projects={projects} defaultProject={p.id} tasks={p.tasks} onDone={reload} />)}><Icon name="bolt" /> Catat</button>
        <button className="btn sm" onClick={() => open(<ProjectForm edit={p} onDone={reload} />)}><Icon name="edit" /> Edit</button>
      </Topbar>

      <div className="dhead">
        <div className="hbar" style={{ background:p.color }} />
        <div style={{ flex:1 }}>
          <div className="row" style={{ gap:6 }}><Badge cls={typeClass[p.type]}>{typeLabel[p.type]}</Badge><Badge cls={projStatusClass[p.status]}>{projStatusLabel[p.status]}</Badge>{p.pinned && <Badge cls="b-blue"><Icon name="pin" size="sm" /> Pinned</Badge>}</div>
          <h2>{p.name}</h2>
          {p.description && <p style={{ color:'var(--muted)', marginTop:5, maxWidth:560, lineHeight:1.5 }}>{p.description}</p>}
          <div className="dmeta">
            <div><span>TOTAL JAM</span><b>{hrs(p.total_hours)}</b></div>
            <div><span>BILLABLE</span><b>{hrs(p.billable_hours)}</b></div>
            <div><span>TASK</span><b>{p.done_tasks}/{p.total_tasks}</b></div>
            {paid && <div><span>{p.rate_type === 'hourly' ? 'RATE/JAM' : 'NILAI'}</span><b>{money(p.rate, p.currency)}</b></div>}
          </div>
        </div>
      </div>

      {paid && (
        <div className="grid3" style={{ marginBottom:16 }}>
          <div className="panel" style={{ borderLeft:'3px solid var(--green)' }}><div style={{ fontSize:11.5, color:'var(--muted)' }}>Est. Nilai Proyek</div><div style={{ fontSize:20, fontWeight:800, marginTop:4 }}>{money(p.est_value, p.currency)}</div></div>
          <div className="panel" style={{ borderLeft:'3px solid var(--brand)' }}><div style={{ fontSize:11.5, color:'var(--muted)' }}>Sudah Dibayar</div><div style={{ fontSize:20, fontWeight:800, marginTop:4, color:'var(--green)' }}>{money(p.paid_amount, p.currency)}</div></div>
          <div className="panel" style={{ borderLeft:'3px solid var(--orange)' }}><div style={{ fontSize:11.5, color:'var(--muted)' }}>Belum Dibayar</div><div style={{ fontSize:20, fontWeight:800, marginTop:4, color:'var(--orange)' }}>{money(p.unpaid_amount, p.currency)}</div></div>
        </div>
      )}

      <div className="tabs">{TABS.map(t => <a key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}><Icon name={t.icon} /> {t.label}{t.cnt != null && <span className="cnt">{t.cnt}</span>}</a>)}</div>

      {tab === 'tasks' && (
        <>
          <div style={{ marginBottom:12 }}><button className="btn ghost sm" onClick={() => open(<TaskForm projects={projects} defaultProject={p.id} onDone={reload} />)}><Icon name="plus" /> Task</button></div>
          {p.tasks.length ? p.tasks.map(t => (
            <div className="task-row" key={t.id}>
              <div className={`tick ${t.status === 'done' ? 'on' : t.status === 'doing' ? 'doing' : ''}`} onClick={() => cycleTask(t)} title="Klik untuk ubah status">
                {t.status === 'done' ? <Icon name="check" /> : t.status === 'doing' ? <Icon name="play" /> : null}
              </div>
              <div className={`tt ${t.status === 'done' ? 'done' : ''}`}>
                <div className="ti">{t.title}</div>
                <div className="tm"><Badge cls={taskClass[t.status]}>{taskLabel[t.status]}</Badge><Badge cls={prioClass[t.priority]}>{prioLabel[t.priority]}</Badge>{t.due_date && <span><Icon name="calendar" size="sm" /> {fmtDate(t.due_date)}</span>}</div>
              </div>
              <span className="rowact"><button onClick={() => open(<TaskForm edit={t} projects={projects} onDone={reload} />)} title="Edit task" aria-label="Edit task"><Icon name="edit" /></button></span>
            </div>
          )) : <Empty icon="check-sq" action={<button className="btn sm" onClick={() => open(<TaskForm projects={projects} defaultProject={p.id} onDone={reload} />)}><Icon name="plus" /> Task Pertama</button>}>Belum ada task</Empty>}
        </>
      )}

      {tab === 'worklog' && (
        <div className="panel">
          <h3><span className="tl"><Icon name="clock" /> Work Log</span><button className="btn ghost sm" onClick={() => open(<WorkLogForm projects={projects} defaultProject={p.id} tasks={p.tasks} onDone={reload} />)}><Icon name="plus" /> Catat</button></h3>
          {p.work_logs.length ? (
            <div className="tl">
              {p.work_logs.map(l => (
                <div className="item" key={l.id}>
                  <span className="dotm" style={{ background:p.color }} />
                  <div className="wtop">
                    <div style={{ minWidth:0 }}>
                      <div className="wdesc">{l.description}</div>
                      <div className="wmeta"><span><Icon name="calendar" size="sm" /> {fmtDate(l.log_date)}</span>{l.task_title && <span><Icon name="check-sq" size="sm" /> {l.task_title}</span>}{l.billable && <Badge cls="b-green">Billable</Badge>}</div>
                    </div>
                    <div className="row" style={{ gap:6 }}><span className="whours">{hrs(l.hours)}</span><span className="rowact"><button onClick={() => open(<WorkLogForm edit={l} projects={projects} tasks={p.tasks} onDone={reload} />)} title="Edit log" aria-label="Edit log"><Icon name="edit" /></button></span></div>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty icon="clock" action={<button className="btn sm" onClick={() => open(<WorkLogForm projects={projects} defaultProject={p.id} tasks={p.tasks} onDone={reload} />)}><Icon name="bolt" /> Catat Kerjaan</button>}>Belum ada log</Empty>}
        </div>
      )}

      {tab === 'payments' && paid && (
        <div className="panel" style={{ padding:0 }}>
          <h3 style={{ padding:'14px 16px 0' }}><span className="tl"><Icon name="wallet" /> Payments</span><button className="btn ghost sm" style={{ marginRight:16 }} onClick={() => open(<PaymentForm projects={projects} defaultProject={p.id} onDone={reload} />)}><Icon name="plus" /> Payment</button></h3>
          <DataTable rows={p.payments} cols={[
            { h:'Label', title:1, cell:x => x.label || '—' },
            { h:'Jumlah', cell:x => money(x.amount, x.currency) },
            { h:'Status', cell:x => <Badge cls={payClass[x.status]}>{payLabel[x.status]}</Badge> },
            { h:'Invoice', cell:x => fmtDate(x.invoice_date) },
            { h:'Dibayar', cell:x => fmtDate(x.paid_date) },
            { h:'', cell:x => (
              <span className="rowact">
                {x.status !== 'paid' && <button onClick={async () => { await api.markPaid(x.id); reload(); }} title="Tandai lunas" aria-label="Tandai lunas"><Icon name="check" /></button>}
                <button onClick={() => open(<PaymentForm edit={x} projects={projects} onDone={reload} />)} title="Edit payment" aria-label="Edit payment"><Icon name="edit" /></button>
              </span>
            ) },
          ]} cardTitle={x => x.label || money(x.amount, x.currency)} empty="Belum ada payment" />
        </div>
      )}

      {tab === 'notes' && (
        <div className="panel">
          <h3><span className="tl"><Icon name="note" /> Notes</span><button className="btn ghost sm" onClick={() => open(<ProjectForm edit={p} onDone={reload} />)}><Icon name="edit" /> Edit</button></h3>
          {p.notes ? <div style={{ whiteSpace:'pre-wrap', lineHeight:1.6, fontSize:13 }}>{p.notes}</div> : <Empty icon="note">Belum ada catatan. Klik Edit untuk nambah.</Empty>}
        </div>
      )}
    </>
  );
}
