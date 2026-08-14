import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { statusLabel, statusClass, sevLabel, sevClass } from '../lib/format.js';
import { DataTable, Badge, RowActions } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { IssueForm, RiskForm, ConfirmDialog } from '../modals/Forms.jsx';
import { exportPortfolio } from '../lib/export.js';

export default function IssuesRisks({ onMenu }) {
  const { projects, deleteEntity } = useStore();
  const { open } = useModal();
  const [issues, setIssues] = useState([]);
  const [risks, setRisks] = useState([]);

  useEffect(() => {
    if (!projects.length) return;
    (async () => {
      const all = await Promise.all(projects.map(p => api.project(p.id)));
      setIssues(all.flatMap(pd => (pd.issues || []).map(i => ({ ...i, project_code: pd.project_code }))));
      setRisks(all.flatMap(pd => (pd.risks || []).map(r => ({ ...r, project_code: pd.project_code }))));
    })();
  }, [projects]);

  const issCols = [
    { h:'Title', title:1, cell:i => i.title },
    { h:'Project', cell:i => i.project_code },
    { h:'Severity', cell:i => <Badge cls={sevClass(i.severity)}>{sevLabel(i.severity)}</Badge> },
    { h:'Owner', cell:i => i.owner },
    { h:'Status', cell:i => <Badge cls={statusClass(i.status)}>{statusLabel(i.status)}</Badge> },
    { h:'', cell:i => <RowActions onEdit={() => open(<IssueForm edit={i} />)} onDelete={() => open(<ConfirmDialog message={`Hapus issue "${i.title}"?`} onYes={() => deleteEntity('issues', i.id)} />)} /> },
  ];
  const riskCols = [
    { h:'Title', title:1, cell:r => r.title },
    { h:'Project', cell:r => r.project_code },
    { h:'P×I', cell:r => `${sevLabel(r.probability)}×${sevLabel(r.impact)}` },
    { h:'Rating', cell:r => <Badge cls={sevClass(r.severity)}>{sevLabel(r.severity)}</Badge> },
    { h:'Status', cell:r => <Badge cls={statusClass(r.status)}>{statusLabel(r.status)}</Badge> },
    { h:'', cell:r => <RowActions onEdit={() => open(<RiskForm edit={r} />)} onDelete={() => open(<ConfirmDialog message={`Hapus risk "${r.title}"?`} onYes={() => deleteEntity('risks', r.id)} />)} /> },
  ];
  return (
    <>
      <Topbar title="Issues & Risks" sub="Cross-project" onMenu={onMenu}>
        <button className="btn ghost sm" onClick={() => exportPortfolio(projects, 'xls', 'risks')}><Icon name="download" /> Export</button>
        <button className="btn sm" onClick={() => open(<IssueForm />)}><Icon name="plus" /> Issue</button>
      </Topbar>
      <div className="grid2">
        <div className="panel" style={{ padding:0 }}>
          <h3 style={{ padding:'14px 16px 0' }}>Issues</h3>
          <DataTable cols={issCols} rows={issues} cardTitle={i => i.title} />
        </div>
        <div className="panel" style={{ padding:0 }}>
          <h3 style={{ padding:'14px 16px 0', display:'flex', justifyContent:'space-between' }}>Risks <button className="btn ghost sm" style={{ marginRight:16 }} onClick={() => open(<RiskForm />)}><Icon name="plus" /> Risk</button></h3>
          <DataTable cols={riskCols} rows={risks} cardTitle={r => r.title} />
        </div>
      </div>
    </>
  );
}
