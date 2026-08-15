import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { Empty } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { ProjectForm } from '../modals/Forms.jsx';
import { typeLabel, typeClass, typeIcon, projStatusLabel, projStatusClass, projStatusColor, hrs, money, idleText, idleColor } from '../lib/format.js';

export default function Projects({ onMenu }) {
  const { projects, pinProject } = useStore();
  const { open } = useModal();
  const nav = useNavigate();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('active');
  const list = projects.filter(p => (!type || p.type === type) && (!status || p.status === status));

  return (
    <>
      <Topbar title={<h1>Projects</h1>} sub={`${list.length} project`} onMenu={onMenu}>
        <button className="btn sm" onClick={() => open(<ProjectForm />)}><Icon name="plus" /> Project</button>
      </Topbar>
      <div className="filters">
        <div className="seg">
          {[['', 'Semua'], ['office', 'Kantor'], ['freelance', 'Freelance'], ['parttime', 'Part-time'], ['kuliah', 'Kuliah'], ['personal', 'Personal']].map(([v, l]) =>
            <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{l}</button>)}
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="on_hold">On Hold</option><option value="done">Done</option><option value="archived">Archived</option><option value="">Semua Status</option></select>
      </div>
      {list.length ? (
        <div className="pgrid">
          {list.map(p => {
            const paid = p.type === 'freelance' || p.type === 'parttime';
            const pct = p.total_tasks > 0 ? Math.round(p.done_tasks / p.total_tasks * 100) : 0;
            return (
              <div className="pcard" key={p.id} style={{ '--accent':p.color }} onClick={() => nav('/projects/' + p.id)}>
                <div className="cbar" style={{ background:p.color }} />
                <div className="cardact">
                  <span className="rowact">
                    <button onClick={(e) => { e.stopPropagation(); pinProject(p.id); }} title={p.pinned ? 'Unpin' : 'Pin'} aria-label={p.pinned ? 'Unpin project' : 'Pin project'} className={p.pinned ? 'on' : ''}><Icon name="pin" /></button>
                    <button onClick={(e) => { e.stopPropagation(); open(<ProjectForm edit={p} />); }} title="Edit" aria-label="Edit project"><Icon name="edit" /></button>
                  </span>
                </div>
                <div className="code">
                  <span className={`badge ${typeClass[p.type]}`}><Icon name={typeIcon[p.type]} size="sm" />{typeLabel[p.type]}</span>
                  {p.status !== 'active' && <span className={`badge ${projStatusClass[p.status]}`}>{projStatusLabel[p.status]}</span>}
                </div>
                <div className="name">
                  {p.pinned && <span className="pinico"><Icon name="pin" size="sm" /></span>}
                  <span className="ntext">{p.name}</span>
                  {p.status === 'active' && <span className="statusdot" style={{ background:projStatusColor[p.status], color:projStatusColor[p.status] }} title="Active" />}
                </div>
                {p.client_name && <div className="cli"><Icon name="user" size="sm" /> {p.client_name}</div>}
                <div className="pbar" title={`${pct}% task selesai`}><i style={{ width: pct + '%', background: p.color }} /></div>
                <div className="stats">
                  <span><Icon name="clock" size="sm" /> <b>{hrs(p.total_hours)}</b></span>
                  <span><Icon name="check-sq" size="sm" /> <b>{p.done_tasks}/{p.total_tasks}</b></span>
                  {paid && Number(p.est_value) > 0 && <span><Icon name="wallet" size="sm" /> <b>{money(p.est_value, p.currency)}</b></span>}
                </div>
                {(p.tags || []).length > 0 && <div className="tags">{p.tags.slice(0, 4).map(t => <span className="tag-chip" key={t}>{t}</span>)}</div>}
                <div className="idle" style={{ color:idleColor(p.days_idle) }}><Icon name="clock2" size="sm" /> Terakhir: {idleText(p.days_idle)}</div>
              </div>
            );
          })}
        </div>
      ) : <Empty icon="folder" action={<button className="btn" onClick={() => open(<ProjectForm />)}><Icon name="plus" /> Project Baru</button>}>Belum ada project di filter ini</Empty>}
    </>
  );
}
