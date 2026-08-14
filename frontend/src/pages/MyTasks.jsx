import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { api, getUser } from '../lib/api.js';
import { statusLabel, statusClass, fmtDate, num } from '../lib/format.js';
import { DataTable, Badge, ProgCell, RowActions } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { TaskForm, ConfirmDialog } from '../modals/Forms.jsx';

export default function MyTasks({ onMenu }) {
  const { projects, deleteEntity } = useStore();
  const { open } = useModal();
  const [tasks, setTasks] = useState([]);
  const user = getUser();

  // ambil task dari semua project (detail), filter yang bukan done
  const load = async () => {
    const all = await Promise.all(projects.map(p => api.project(p.id)));
    const rows = all.flatMap(pd => (pd.tasks || []).map(t => ({ ...t, project_code: pd.project_code })))
      .filter(t => t.status !== 'done');
    setTasks(rows);
  };
  useEffect(() => { if (projects.length) load(); /* eslint-disable-next-line */ }, [projects]);

  const cols = [
    { h:'Task', title:1, cell:t => `${t.task_code} · ${t.title}` },
    { h:'Project', cell:t => t.project_code },
    { h:'Status', cell:t => <Badge cls={statusClass(t.status)}>{statusLabel(t.status)}</Badge> },
    { h:'Progress', cell:t => <ProgCell value={num(t.progress)} /> },
    { h:'Due', cell:t => fmtDate(t.due_date) },
    { h:'Next', cell:t => t.next_action || '—' },
    { h:'', cell:t => <RowActions onEdit={() => open(<TaskForm edit={t} />)} onDelete={() => open(<ConfirmDialog message={`Hapus task "${t.title}"?`} onYes={() => deleteEntity('tasks', t.id, 'Task dihapus')} />)} /> },
  ];
  return (
    <>
      <Topbar title="My Tasks" sub={`${tasks.length} task aktif`} onMenu={onMenu}>
        <button className="btn sm" onClick={() => open(<TaskForm />)}><Icon name="plus" /> Task</button>
      </Topbar>
      <div className="panel" style={{ padding:0 }}>
        <DataTable cols={cols} rows={tasks} cardTitle={t => `${t.task_code} · ${t.title}`} empty="Tidak ada task aktif" />
      </div>
    </>
  );
}
