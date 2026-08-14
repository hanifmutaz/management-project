import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { healthLabel, healthClass, healthDot, statusLabel, statusClass, num } from '../lib/format.js';
import { Badge, ProgressBar, Empty } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { ProjectForm } from '../modals/Forms.jsx';
import { exportPortfolio } from '../lib/export.js';

export default function Projects({ onMenu }) {
  const { projects } = useStore();
  const { open } = useModal();
  const nav = useNavigate();
  return (
    <>
      <Topbar title="Projects" sub={`${projects.length} project`} onMenu={onMenu}>
        <button className="btn ghost sm" onClick={() => exportPortfolio(projects, 'xls')}><Icon name="download" /> Export</button>
        <button className="btn sm" onClick={() => open(<ProjectForm />)}><Icon name="plus" /> Project</button>
      </Topbar>
      {projects.length ? (
        <div className="pgrid">
          {projects.map(p => (
            <div className="pcard" key={p.id} onClick={() => nav('/projects/' + p.id)}>
              <div className="cardact">
                <span className="rowact">
                  <button onClick={(e) => { e.stopPropagation(); open(<ProjectForm edit={p} />); }} title="Edit"><Icon name="edit" /></button>
                </span>
              </div>
              <div className="code">{p.project_code} · {(p.category || '').toUpperCase()}</div>
              <div className="name">{p.name}</div>
              <ProgressBar value={num(p.avg_progress)} health={p.health} />
              <div className="meta"><span><Icon name="user" /> {p.owner}</span><Badge cls={healthClass[p.health]} dot={healthDot[p.health]}>{healthLabel[p.health]}</Badge></div>
              <div className="meta"><span><Icon name="target" /> {num(p.avg_progress)}% · {p.done_tasks}/{p.total_tasks}</span><Badge cls={statusClass(p.status)}>{statusLabel(p.status)}</Badge></div>
              <div className="why">{p.health_reason}</div>
            </div>
          ))}
        </div>
      ) : <Empty icon="folder">Belum ada project</Empty>}
    </>
  );
}
