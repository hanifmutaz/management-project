import { useStore } from '../lib/store.jsx';
import { num } from '../lib/format.js';
import { KpiCard, Donut } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { exportPortfolio } from '../lib/export.js';

export default function Analytics({ onMenu }) {
  const { dashboard, projects } = useStore();
  if (!dashboard) return null;
  const k = dashboard.kpi;
  const totalTasks = dashboard.statusDist.reduce((a, s) => a + s.count, 0);
  const done = dashboard.statusDist.find(s => s.status === 'done')?.count || 0;
  const kpi = [
    { label:'Completion', value:num(done / (totalTasks || 1) * 100) + '%', tag:`${done}/${totalTasks} tasks`, accent:'acc-blue', icon:'trend' },
    { label:'On-Time', value:(100 - num(k.overdue_tasks / (totalTasks || 1) * 100)) + '%', tag:'no major delay', accent:'acc-green', icon:'clock' },
    { label:'Open Issues', value:k.open_issues, tag:'aktif', accent:'acc-orange', icon:'alert' },
    { label:'Overall', value:num(k.overall_progress) + '%', tag:'weighted', accent:'acc-red', icon:'target' },
  ];
  const distColor = { done:'#34d399', in_progress:'#5b8cff', not_started:'#64748b', review:'#9b6bff', on_hold:'#fbbf24', cancelled:'#f87171' };
  const segs = dashboard.statusDist.filter(s => s.count > 0).map(s => ({ v:s.count, c:distColor[s.status] || '#64748b', l:s.status }));
  const hc = [
    { c:'#34d399', l:'On Track', v:k.healthy }, { c:'#fb923c', l:'At Risk', v:k.at_risk }, { c:'#f87171', l:'Critical', v:k.critical },
  ].filter(x => x.v > 0);
  return (
    <>
      <Topbar title="Analytics" sub="Portfolio insight" onMenu={onMenu}>
        <button className="btn ghost sm" onClick={() => exportPortfolio(projects, 'xls')}><Icon name="download" /> Excel</button>
        <button className="btn sm" onClick={() => window.print()}><Icon name="doc" /> PDF</button>
      </Topbar>
      <div className="kpis">{kpi.map((x, i) => <KpiCard key={i} {...x} />)}</div>
      <div className="grid2">
        <div className="panel"><h3>Task Status Distribution</h3>
          <div className="donut-wrap"><Donut segs={segs.map(x => ({ v:x.v, c:x.c }))} center={totalTasks} />
            <div className="legend">{segs.map((x, i) => <div key={i}><span className="dot" style={{ background:x.c }} /> {x.l} · {x.v}</div>)}</div></div>
        </div>
        <div className="panel"><h3>Portfolio Health</h3>
          <div className="donut-wrap"><Donut segs={hc.map(x => ({ v:x.v, c:x.c }))} />
            <div className="legend">{hc.map((x, i) => <div key={i}><span className="dot" style={{ background:x.c }} /> {x.l} · {x.v}</div>)}</div></div>
        </div>
      </div>
    </>
  );
}
