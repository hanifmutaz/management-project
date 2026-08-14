import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { Empty, Badge } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { WorkLogForm } from '../modals/Forms.jsx';
import { exportWorkLog } from '../lib/export.js';
import { hrs, fmtDateFull } from '../lib/format.js';

export default function WorkLog({ onMenu }) {
  const { projects, refresh } = useStore();
  const { open } = useModal();
  const [logs, setLogs] = useState([]);
  const [proj, setProj] = useState('');
  const [billable, setBillable] = useState(false);

  const load = useCallback(async () => {
    const qs = [];
    if (proj) qs.push('project_id=' + proj);
    if (billable) qs.push('billable=true');
    setLogs(await api.worklogs(qs.length ? '?' + qs.join('&') : ''));
  }, [proj, billable]);
  useEffect(() => { load(); }, [load]);
  const reload = async () => { await load(); await refresh(); };

  const groups = {};
  logs.forEach(l => { (groups[l.log_date] = groups[l.log_date] || []).push(l); });
  const dates = Object.keys(groups).sort().reverse();
  const totalHours = logs.reduce((a, l) => a + Number(l.hours), 0);

  return (
    <>
      <Topbar title={<h1>Work Log</h1>} sub={`Rekam jejak kerjaan — total ${hrs(totalHours)}`} onMenu={onMenu}>
        <button className="btn ghost sm" onClick={() => exportWorkLog(logs)}><Icon name="download" /> Export</button>
        <button className="btn sm" onClick={() => open(<WorkLogForm projects={projects} onDone={reload} />)}><Icon name="bolt" /> Catat</button>
      </Topbar>
      <div className="filters">
        <select value={proj} onChange={e => setProj(e.target.value)}><option value="">Semua Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <label className="chk" style={{ padding:'0 4px' }}><input type="checkbox" checked={billable} onChange={e => setBillable(e.target.checked)} /> Billable saja</label>
      </div>
      {dates.length ? dates.map(d => {
        const dayHours = groups[d].reduce((a, l) => a + Number(l.hours), 0);
        return (
          <div key={d}>
            <div className="daygroup"><span className="dh">{fmtDateFull(d)}</span> · {hrs(dayHours)}</div>
            <div className="panel" style={{ padding:'8px 16px' }}>
              <div className="tl" style={{ margin:'8px 0' }}>
                {groups[d].map(l => (
                  <div className="item" key={l.id}>
                    <span className="dotm" style={{ background:l.color }} />
                    <div className="wtop">
                      <div style={{ minWidth:0 }}>
                        <div className="wdesc">{l.description}</div>
                        <div className="wmeta"><span className="dot" style={{ background:l.color }} /> {l.project_name}{l.task_title && <span><Icon name="check-sq" size="sm" /> {l.task_title}</span>}{l.billable && <Badge cls="b-green">Billable</Badge>}</div>
                      </div>
                      <div className="row" style={{ gap:6 }}><span className="whours">{hrs(l.hours)}</span><span className="rowact"><button onClick={() => open(<WorkLogForm edit={l} projects={projects} onDone={reload} />)}><Icon name="edit" /></button></span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }) : <Empty icon="clock" action={<button className="btn" onClick={() => open(<WorkLogForm projects={projects} onDone={reload} />)}><Icon name="bolt" /> Catat Kerjaan</button>}>Belum ada catatan kerjaan</Empty>}
    </>
  );
}
