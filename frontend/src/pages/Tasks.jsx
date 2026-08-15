import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { Empty, Badge } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { TaskForm } from '../modals/Forms.jsx';
import { prioClass, prioLabel, fmtDate } from '../lib/format.js';

export default function Tasks({ onMenu }) {
  const { projects, refresh } = useStore();
  const { open } = useModal();
  const [tasks, setTasks] = useState([]);
  const [proj, setProj] = useState('');

  const load = useCallback(async () => {
    setTasks(await api.tasks(proj ? '?project_id=' + proj : ''));
  }, [proj]);
  useEffect(() => { load(); }, [load]);
  const reload = async () => { await load(); await refresh(); };
  const cycle = async (t) => {
    const next = t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo';
    await api.setTaskStatus(t.id, next); reload();
  };
  const groups = { doing: [], todo: [], done: [] };
  tasks.forEach(t => groups[t.status]?.push(t));
  const order = [['doing', 'Sedang Dikerjakan'], ['todo', 'To Do'], ['done', 'Selesai']];

  return (
    <>
      <Topbar title={<h1>Tasks</h1>} sub={`${tasks.filter(t => t.status !== 'done').length} aktif`} onMenu={onMenu}>
        <button className="btn sm" onClick={() => open(<TaskForm projects={projects} onDone={reload} />)}><Icon name="plus" /> Task</button>
      </Topbar>
      <div className="filters">
        <select value={proj} onChange={e => setProj(e.target.value)}><option value="">Semua Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      {tasks.length ? order.map(([st, label]) => groups[st].length > 0 && (
        <div key={st} style={{ marginBottom:18 }}>
          <div className="daygroup"><span className="dh">{label}</span> {groups[st].length}</div>
          {groups[st].map(t => (
            <div className="task-row" key={t.id}>
              <div className={`tick ${t.status === 'done' ? 'on' : t.status === 'doing' ? 'doing' : ''}`} onClick={() => cycle(t)} title="Klik ubah status">
                {t.status === 'done' ? <Icon name="check" /> : t.status === 'doing' ? <Icon name="play" /> : null}
              </div>
              <div className={`tt ${t.status === 'done' ? 'done' : ''}`}>
                <div className="ti">{t.title}</div>
                <div className="tm"><span className="dot" style={{ background:t.color }} /> {t.project_name}<Badge cls={prioClass[t.priority]}>{prioLabel[t.priority]}</Badge>{t.due_date && <span><Icon name="calendar" size="sm" /> {fmtDate(t.due_date)}</span>}</div>
              </div>
              <span className="rowact"><button onClick={() => open(<TaskForm edit={t} projects={projects} onDone={reload} />)} title="Edit task" aria-label="Edit task"><Icon name="edit" /></button></span>
            </div>
          ))}
        </div>
      )) : <Empty icon="check-sq" action={<button className="btn" onClick={() => open(<TaskForm projects={projects} onDone={reload} />)}><Icon name="plus" /> Task Baru</button>}>Belum ada task</Empty>}
    </>
  );
}
