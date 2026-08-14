import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { healthLabel, healthClass, healthDot, num } from '../lib/format.js';
import { KpiCard, Donut, Badge, ProgressBar, Empty } from '../components/ui.jsx';
import { NotifBell, Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { ProjectForm } from '../modals/Forms.jsx';
import { exportPortfolio } from '../lib/export.js';

export default function Overview({ onMenu }) {
  const { dashboard, projects } = useStore();
  const { open } = useModal();
  const nav = useNavigate();
  if (!dashboard) return null;
  const k = dashboard.kpi;

  const kpi = [
    { label:'Projects', value:k.total_projects, tag:'aktif', accent:'acc-blue', icon:'folder' },
    { label:'Healthy', value:k.healthy, tag:'on track', accent:'acc-green', icon:'shield' },
    { label:'At Risk', value:k.at_risk, tag:'perlu perhatian', accent:'acc-orange', icon:'alert' },
    { label:'Critical', value:k.critical, tag:'butuh eskalasi', accent:'acc-red', icon:'alert' },
    { label:'Overall', value:num(k.overall_progress) + '%', tag:'weighted', accent:'acc-blue', icon:'trend' },
    { label:'Overdue Tasks', value:k.overdue_tasks, tag:'lewat deadline', accent:'acc-orange', icon:'clock' },
    { label:'Open Issues', value:k.open_issues, tag:'aktif', accent:'acc-orange', icon:'alert' },
    { label:'Pending Approvals', value:k.pending_approvals, tag:'menunggu', accent:'acc-red', icon:'gavel' },
  ];
  const segs = [
    { k:'on_track', c:'#34d399', l:'On Track', v:k.healthy },
    { k:'at_risk', c:'#fb923c', l:'At Risk', v:k.at_risk },
    { k:'critical', c:'#f87171', l:'Critical', v:k.critical },
  ].filter(x => x.v > 0);

  return (
    <>
      <Topbar title="Overview" sub="What needs attention" onMenu={onMenu}>
        <input className="search" placeholder="Cari project / task..." />
        <NotifBell />
        <button className="btn ghost sm" onClick={() => exportPortfolio(projects, 'xls')}><Icon name="download" /> Export</button>
        <button className="btn sm" onClick={() => open(<ProjectForm />)}><Icon name="plus" /> Project</button>
      </Topbar>

      <div className="kpis">{kpi.map((x, i) => <KpiCard key={i} {...x} />)}</div>

      <div className="grid2">
        <div className="panel">
          <h3><span className="tl"><span style={{ color:'var(--orange)' }}><Icon name="alert" /></span> Projects Needing Attention</span><span className="mini">health engine + reason</span></h3>
          <div className="att">
            {dashboard.attention.length ? dashboard.attention.map(p => (
              <div key={p.project_code} className={`att-card ${p.health === 'critical' ? 'crit' : ''}`} onClick={() => nav('/projects/' + projById(projects, p.project_code))}>
                <div className="t">{p.project_code} · {p.name} <Badge cls={healthClass[p.health]} dot={healthDot[p.health]}>{healthLabel[p.health]}</Badge></div>
                <div className="why">{p.health_reason}</div>
                <div className="foot"><span><Icon name="user" /> {p.owner}</span><span><Icon name="target" /> {num(p.avg_progress)}%</span></div>
              </div>
            )) : <Empty icon="shield">Semua project on track 🎉</Empty>}
          </div>
        </div>
        <div className="panel">
          <h3>Project Health Distribution</h3>
          <div className="donut-wrap">
            <Donut segs={segs.map(x => ({ v:x.v, c:x.c }))} />
            <div className="legend">{segs.map(x => <div key={x.k}><span className="dot" style={{ background:x.c }} /> {x.l} · {x.v}</div>)}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Progress by Project <span className="mini">weighted</span></h3>
        {dashboard.perProject.map(p => (
          <div className="pline" key={p.project_code}>
            <div className="top"><span>{p.project_code} · {p.name} <Badge cls={healthClass[p.health]} dot={healthDot[p.health]}>{healthLabel[p.health]}</Badge></span><b>{num(p.avg_progress)}%</b></div>
            <ProgressBar value={num(p.avg_progress)} health={p.health} />
          </div>
        ))}
      </div>
    </>
  );
}
const projById = (projects, code) => projects.find(p => p.project_code === code)?.id || '';
