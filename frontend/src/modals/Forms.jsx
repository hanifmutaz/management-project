import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useStore } from '../lib/store.jsx';
import { useModal } from '../components/Modal.jsx';
import { statusLabel, dateInput } from '../lib/format.js';

function Field({ label, req, children }) {
  return <div className="field"><label>{label} {req && <span className="req">*</span>}</label>{children}</div>;
}
function Foot({ onDelete, onSave, busy }) {
  const { close } = useModal();
  return (
    <div className="modal-foot">
      <div>{onDelete && <button className="btn danger sm" onClick={onDelete}><Icon name="trash" /> Hapus</button>}</div>
      <div className="row">
        <button className="btn ghost" onClick={close}>Batal</button>
        <button className="btn" onClick={onSave} disabled={busy}><Icon name="check" /> {busy ? '...' : 'Simpan'}</button>
      </div>
    </div>
  );
}
// select enum
function EnumSel({ value, onChange, options }) {
  return <select value={value} onChange={onChange}>{options.map(o => <option key={o} value={o}>{statusLabel(o)}</option>)}</select>;
}
// select user -> owner_id / pic_id
function UserSel({ value, onChange, users }) {
  return <select value={value ?? ''} onChange={onChange}><option value="">—</option>{users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select>;
}

/* -------- PROJECT -------- */
export function ProjectForm({ edit }) {
  const { users, createProject, updateProject, deleteProject } = useStore();
  const { open, close } = useModal();
  const [f, setF] = useState(edit ? {
    name:edit.name, category:edit.category || '', owner_id:edit.owner_id ?? '', priority:edit.priority,
    start_date:dateInput(edit.start_date), target_date:dateInput(edit.target_date), status:edit.status,
    description:edit.description || '', objectives:edit.objectives || '',
  } : { name:'', category:'Trial', owner_id:users[0]?.id ?? '', priority:'high', start_date:'', target_date:'', status:'planning', description:'', objectives:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setT(true); if (!f.name.trim()) return;
    setBusy(true);
    try { edit ? await updateProject(edit.id, f) : await createProject(f); close(); }
    catch { setBusy(false); }
  };
  return (
    <>
      <h3><Icon name="folder" /> {edit ? 'Edit' : 'New'} Project</h3>
      {!edit && <div className="note"><Icon name="shield" /> Health, Progress & Overdue dihitung otomatis oleh health engine (DB).</div>}
      <Field label="Project Name" req><input className={t && !f.name.trim() ? 'err' : ''} value={f.name} onChange={set('name')} placeholder="cth: Dashboard PCB ConMas" /></Field>
      <div className="f2">
        <Field label="Category"><select value={f.category} onChange={set('category')}>{['Trial','Dev','BI'].map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Priority"><EnumSel value={f.priority} onChange={set('priority')} options={['low','medium','high','critical']} /></Field>
      </div>
      <div className="f2">
        <Field label="Owner" req><UserSel value={f.owner_id} onChange={set('owner_id')} users={users} /></Field>
        <Field label="Status"><EnumSel value={f.status} onChange={set('status')} options={['planning','execution','monitoring','on_hold','closed']} /></Field>
      </div>
      <div className="f2">
        <Field label="Start"><input type="date" value={f.start_date} onChange={set('start_date')} /></Field>
        <Field label="Target"><input type="date" value={f.target_date} onChange={set('target_date')} /></Field>
      </div>
      <Field label="Objectives / Scope"><textarea rows="2" value={f.objectives} onChange={set('objectives')} placeholder="Tujuan project..." /></Field>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<ConfirmDialog message={`Hapus project "${edit.name}"?`} onYes={() => deleteProject(edit.id)} />) : null} />
    </>
  );
}

/* -------- TASK -------- */
export function TaskForm({ edit, project }) {
  const { users, projects, createEntity, updateEntity, deleteEntity } = useStore();
  const { open, close } = useModal();
  const pid0 = edit ? edit.project_id : (project?.id ?? projects[0]?.id);
  const [f, setF] = useState(edit ? {
    project_id:edit.project_id, title:edit.title, pic_id:edit.pic_id ?? '', status:edit.status, priority:edit.priority,
    progress:Number(edit.progress), due_date:dateInput(edit.due_date), constraint_note:edit.constraint_note || '', next_action:edit.next_action || '',
  } : { project_id:pid0, title:'', pic_id:users[0]?.id ?? '', status:'not_started', priority:'medium', progress:0, due_date:'', constraint_note:'', next_action:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setStatus = (e) => { const s = e.target.value; setF({ ...f, status:s, progress: s === 'done' ? 100 : s === 'not_started' ? 0 : f.progress }); };
  const save = async () => {
    setT(true); if (!f.title.trim()) return;
    setBusy(true);
    const data = { ...f, progress: Math.max(0, Math.min(100, +f.progress || 0)) };
    try { edit ? await updateEntity('tasks', edit.id, data, 'Task diperbarui ✓') : await createEntity('tasks', data, 'Task dibuat ✓'); close(); }
    catch { setBusy(false); }
  };
  return (
    <>
      <h3><Icon name="check-sq" /> {edit ? 'Edit' : 'New'} Task</h3>
      <Field label="Title" req><input className={t && !f.title.trim() ? 'err' : ''} value={f.title} onChange={set('title')} placeholder="cth: Develop VBA laporan" /></Field>
      <div className="f2">
        <Field label="Project" req><select value={f.project_id} onChange={set('project_id')} disabled={!!edit}>{projects.map(p => <option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}</select></Field>
        <Field label="PIC"><UserSel value={f.pic_id} onChange={set('pic_id')} users={users} /></Field>
      </div>
      <div className="f2">
        <Field label="Status"><select value={f.status} onChange={setStatus}>{['not_started','in_progress','review','done','on_hold'].map(o => <option key={o} value={o}>{statusLabel(o)}</option>)}</select></Field>
        <Field label="Progress (%)"><input type="number" min="0" max="100" value={f.progress} onChange={set('progress')} /></Field>
      </div>
      <Field label="Due Date"><input type="date" value={f.due_date} onChange={set('due_date')} /></Field>
      <Field label="Constraint / Blocker"><input value={f.constraint_note} onChange={set('constraint_note')} placeholder="Kendala (opsional)" /></Field>
      <Field label="Next Action"><input value={f.next_action} onChange={set('next_action')} placeholder="Tindakan berikutnya" /></Field>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<ConfirmDialog message={`Hapus task "${edit.title}"?`} onYes={() => deleteEntity('tasks', edit.id, 'Task dihapus')} />) : null} />
    </>
  );
}

/* -------- MILESTONE -------- */
export function MilestoneForm({ edit, project }) {
  const { users, createEntity, updateEntity, deleteEntity } = useStore();
  const { open, close } = useModal();
  const [f, setF] = useState(edit ? { project_id:edit.project_id, name:edit.name, owner_id:edit.owner_id ?? '', target_date:dateInput(edit.target_date), status:edit.status, progress:Number(edit.progress) }
    : { project_id:project?.id, name:'', owner_id:users[0]?.id ?? '', target_date:'', status:'not_started', progress:0 });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { setT(true); if (!f.name.trim()) return; setBusy(true);
    try { edit ? await updateEntity('milestones', edit.id, f, 'Milestone diperbarui ✓') : await createEntity('milestones', f, 'Milestone dibuat ✓'); close(); } catch { setBusy(false); } };
  return (<>
    <h3><Icon name="flag" /> {edit ? 'Edit' : 'New'} Milestone</h3>
    <Field label="Name" req><input className={t && !f.name.trim() ? 'err' : ''} value={f.name} onChange={set('name')} placeholder="cth: M4 - Deployment" /></Field>
    <div className="f2"><Field label="Owner"><UserSel value={f.owner_id} onChange={set('owner_id')} users={users} /></Field><Field label="Target"><input type="date" value={f.target_date} onChange={set('target_date')} /></Field></div>
    <div className="f2"><Field label="Status"><EnumSel value={f.status} onChange={set('status')} options={['not_started','in_progress','done','delayed']} /></Field><Field label="Progress (%)"><input type="number" min="0" max="100" value={f.progress} onChange={set('progress')} /></Field></div>
    <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<ConfirmDialog message={`Hapus milestone "${edit.name}"?`} onYes={() => deleteEntity('milestones', edit.id)} />) : null} />
  </>);
}

/* -------- DELIVERABLE -------- */
export function DeliverableForm({ edit, project }) {
  const { users, createEntity, updateEntity, deleteEntity } = useStore();
  const { open, close } = useModal();
  const [f, setF] = useState(edit ? { project_id:edit.project_id, name:edit.name, owner_id:edit.owner_id ?? '', target_date:dateInput(edit.target_date), status:edit.status, progress:Number(edit.progress) }
    : { project_id:project?.id, name:'', owner_id:users[0]?.id ?? '', target_date:'', status:'not_started', progress:0 });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { setT(true); if (!f.name.trim()) return; setBusy(true);
    try { edit ? await updateEntity('deliverables', edit.id, f, 'Deliverable diperbarui ✓') : await createEntity('deliverables', f, 'Deliverable dibuat ✓'); close(); } catch { setBusy(false); } };
  return (<>
    <h3><Icon name="layers" /> {edit ? 'Edit' : 'New'} Deliverable</h3>
    <Field label="Name" req><input className={t && !f.name.trim() ? 'err' : ''} value={f.name} onChange={set('name')} placeholder="cth: PM Monitoring V1" /></Field>
    <div className="f2"><Field label="Owner"><UserSel value={f.owner_id} onChange={set('owner_id')} users={users} /></Field><Field label="Target"><input type="date" value={f.target_date} onChange={set('target_date')} /></Field></div>
    <div className="f2"><Field label="Status"><EnumSel value={f.status} onChange={set('status')} options={['not_started','in_progress','review','done']} /></Field><Field label="Progress (%)"><input type="number" min="0" max="100" value={f.progress} onChange={set('progress')} /></Field></div>
    <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<ConfirmDialog message={`Hapus deliverable "${edit.name}"?`} onYes={() => deleteEntity('deliverables', edit.id)} />) : null} />
  </>);
}

/* -------- ISSUE -------- */
export function IssueForm({ edit, project }) {
  const { users, projects, createEntity, updateEntity, deleteEntity } = useStore();
  const { open, close } = useModal();
  const pid0 = edit ? edit.project_id : (project?.id ?? projects[0]?.id);
  const [f, setF] = useState(edit ? { project_id:edit.project_id, title:edit.title, severity:edit.severity, impact:edit.impact || '', owner_id:edit.owner_id ?? '', status:edit.status, target_date:dateInput(edit.target_date), next_action:edit.next_action || '' }
    : { project_id:pid0, title:'', severity:'medium', impact:'', owner_id:users[0]?.id ?? '', status:'open', target_date:'', next_action:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { setT(true); if (!f.title.trim()) return; setBusy(true);
    try { edit ? await updateEntity('issues', edit.id, f, 'Issue diperbarui ✓') : await createEntity('issues', f, 'Issue tercatat ✓'); close(); } catch { setBusy(false); } };
  return (<>
    <h3><Icon name="alert" /> {edit ? 'Edit' : 'New'} Issue</h3>
    <Field label="Title" req><input className={t && !f.title.trim() ? 'err' : ''} value={f.title} onChange={set('title')} placeholder="cth: Server unavailable" /></Field>
    <div className="f2"><Field label="Project"><select value={f.project_id} onChange={set('project_id')} disabled={!!edit}>{projects.map(p => <option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}</select></Field>
      <Field label="Severity"><EnumSel value={f.severity} onChange={set('severity')} options={['critical','high','medium','low']} /></Field></div>
    <Field label="Impact"><input value={f.impact} onChange={set('impact')} placeholder="Dampak ke project..." /></Field>
    <div className="f2"><Field label="Owner"><UserSel value={f.owner_id} onChange={set('owner_id')} users={users} /></Field>
      <Field label="Status"><EnumSel value={f.status} onChange={set('status')} options={['open','in_progress','monitoring','resolved','closed']} /></Field></div>
    <div className="f2"><Field label="Target Resolution"><input type="date" value={f.target_date} onChange={set('target_date')} /></Field><Field label="Next Action"><input value={f.next_action} onChange={set('next_action')} /></Field></div>
    <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<ConfirmDialog message={`Hapus issue "${edit.title}"?`} onYes={() => deleteEntity('issues', edit.id)} />) : null} />
  </>);
}

/* -------- RISK -------- */
export function RiskForm({ edit, project }) {
  const { users, projects, createEntity, updateEntity, deleteEntity } = useStore();
  const { open, close } = useModal();
  const pid0 = edit ? edit.project_id : (project?.id ?? projects[0]?.id);
  const [f, setF] = useState(edit ? { project_id:edit.project_id, title:edit.title, probability:edit.probability, impact:edit.impact, owner_id:edit.owner_id ?? '', mitigation:edit.mitigation || '', status:edit.status }
    : { project_id:pid0, title:'', probability:'medium', impact:'medium', owner_id:users[0]?.id ?? '', mitigation:'', status:'identified' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { setT(true); if (!f.title.trim()) return; setBusy(true);
    try { edit ? await updateEntity('risks', edit.id, f, 'Risk diperbarui ✓') : await createEntity('risks', f, 'Risk dibuat ✓'); close(); } catch { setBusy(false); } };
  return (<>
    <h3><Icon name="shield" /> {edit ? 'Edit' : 'New'} Risk</h3>
    <Field label="Title" req><input className={t && !f.title.trim() ? 'err' : ''} value={f.title} onChange={set('title')} placeholder="cth: Scope creep" /></Field>
    <div className="f2"><Field label="Project"><select value={f.project_id} onChange={set('project_id')} disabled={!!edit}>{projects.map(p => <option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}</select></Field>
      <Field label="Status"><EnumSel value={f.status} onChange={set('status')} options={['identified','analyzing','mitigating','monitoring','closed']} /></Field></div>
    <div className="f2"><Field label="Probability"><EnumSel value={f.probability} onChange={set('probability')} options={['low','medium','high','critical']} /></Field>
      <Field label="Impact"><EnumSel value={f.impact} onChange={set('impact')} options={['low','medium','high','critical']} /></Field></div>
    <Field label="Mitigation Plan"><input value={f.mitigation} onChange={set('mitigation')} placeholder="Rencana mitigasi..." /></Field>
    <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<ConfirmDialog message={`Hapus risk "${edit.title}"?`} onYes={() => deleteEntity('risks', edit.id)} />) : null} />
  </>);
}

/* -------- ACTION -------- */
export function ActionForm({ edit, project }) {
  const { users, createEntity, updateEntity, deleteEntity } = useStore();
  const { open, close } = useModal();
  const [f, setF] = useState(edit ? { project_id:edit.project_id, title:edit.title, owner_id:edit.owner_id ?? '', due_date:dateInput(edit.due_date), status:edit.status, result:edit.result || '' }
    : { project_id:project?.id, title:'', owner_id:users[0]?.id ?? '', due_date:'', status:'open', result:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { setT(true); if (!f.title.trim()) return; setBusy(true);
    try { edit ? await updateEntity('actions', edit.id, f, 'Action diperbarui ✓') : await createEntity('actions', f, 'Action dibuat ✓'); close(); } catch { setBusy(false); } };
  return (<>
    <h3><Icon name="flow" /> {edit ? 'Edit' : 'New'} Action</h3>
    <Field label="Action" req><input className={t && !f.title.trim() ? 'err' : ''} value={f.title} onChange={set('title')} placeholder="cth: Eskalasi ke IT" /></Field>
    <div className="f2"><Field label="Owner"><UserSel value={f.owner_id} onChange={set('owner_id')} users={users} /></Field><Field label="Due"><input type="date" value={f.due_date} onChange={set('due_date')} /></Field></div>
    <Field label="Status"><EnumSel value={f.status} onChange={set('status')} options={['open','in_progress','done','cancelled']} /></Field>
    <Field label="Result / Resolution"><input value={f.result} onChange={set('result')} placeholder="Hasil (opsional)" /></Field>
    <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<ConfirmDialog message={`Hapus action "${edit.title}"?`} onYes={() => deleteEntity('actions', edit.id)} />) : null} />
  </>);
}

/* -------- DECISION -------- */
export function DecisionForm({ edit, project }) {
  const { createEntity, updateEntity, deleteEntity } = useStore();
  const { open, close } = useModal();
  const [f, setF] = useState(edit ? { project_id:edit.project_id, title:edit.title, reason:edit.reason || '', impact:edit.impact || '' }
    : { project_id:project?.id, title:'', reason:'', impact:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { setT(true); if (!f.title.trim()) return; setBusy(true);
    try { edit ? await updateEntity('decisions', edit.id, f, 'Decision diperbarui ✓') : await createEntity('decisions', f, 'Decision tercatat ✓'); close(); } catch { setBusy(false); } };
  return (<>
    <h3><Icon name="gavel" /> {edit ? 'Edit' : 'New'} Decision</h3>
    <Field label="Decision" req><input className={t && !f.title.trim() ? 'err' : ''} value={f.title} onChange={set('title')} placeholder="cth: Gunakan React" /></Field>
    <Field label="Reason"><input value={f.reason} onChange={set('reason')} placeholder="Alasan keputusan..." /></Field>
    <Field label="Impact"><input value={f.impact} onChange={set('impact')} placeholder="Dampak..." /></Field>
    <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<ConfirmDialog message={`Hapus decision "${edit.title}"?`} onYes={() => deleteEntity('decisions', edit.id)} />) : null} />
  </>);
}

/* -------- APPROVAL REQUEST -------- */
export function ApprovalForm({ project, detail }) {
  // detail: hasil api.project(id) berisi milestones & deliverables (untuk pilih entity)
  const { users, projects, requestApproval } = useStore();
  const { close } = useModal();
  const [pid, setPid] = useState(project?.id ?? projects[0]?.id);
  const [type, setType] = useState('milestone');
  const [approverId, setApproverId] = useState(users.find(u => u.role === 'viewer')?.id ?? users[0]?.id ?? '');
  const [note, setNote] = useState('');
  const ms = detail?.milestones || [];
  const del = detail?.deliverables || [];
  const entityList = type === 'milestone' ? ms.map(m => ({ id:m.id, label:m.name }))
    : type === 'deliverable' ? del.map(d => ({ id:d.id, label:d.name }))
    : type === 'report' ? [{ id:null, label:'Weekly Report' }, { id:null, label:'Monthly Report' }, { id:null, label:'Executive Report' }]
    : [{ id:null, label:(projects.find(p => p.id === pid)?.name || '') + ' — Closure' }];
  const [entityIdx, setEntityIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const onType = (e) => { setType(e.target.value); setEntityIdx(0); };
  const submit = async () => {
    const ent = entityList[entityIdx]; if (!ent) return;
    setBusy(true);
    const prefix = { report:'Approval', 'project closure':'Closure', milestone:'Sign-off', deliverable:'Acceptance' }[type] || 'Approval';
    try {
      await requestApproval({ project_id:pid, entity_type:type, entity_id:ent.id, entity_label:ent.label, title:`${prefix} ${ent.label}`, approver_id:approverId, request_note:note });
      close();
    } catch { setBusy(false); }
  };
  return (<>
    <h3><Icon name="gavel" /> Request Approval</h3>
    <div className="note"><Icon name="shield" /> Approval jadi bukti formal yang traceable di Evidence Center.</div>
    <Field label="Project"><select value={pid} onChange={(e) => setPid(+e.target.value)} disabled={!!project}>{projects.map(p => <option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}</select></Field>
    <div className="f2">
      <Field label="Type"><select value={type} onChange={onType}>{['milestone','deliverable','report','project closure'].map(o => <option key={o} value={o}>{statusLabel(o)}</option>)}</select></Field>
      <Field label="Approver"><UserSel value={approverId} onChange={(e) => setApproverId(e.target.value)} users={users} /></Field>
    </div>
    <Field label="Entity" req><select value={entityIdx} onChange={(e) => setEntityIdx(+e.target.value)}>{entityList.length ? entityList.map((o, i) => <option key={i} value={i}>{o.label}</option>) : <option>— (buka dari detail project)</option>}</select></Field>
    <Field label="Catatan permintaan"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth: mohon review hasil validasi" /></Field>
    <div className="modal-foot"><div /><div className="row"><button className="btn ghost" onClick={close}>Batal</button><button className="btn" onClick={submit} disabled={busy || !entityList.length}><Icon name="send" /> Kirim</button></div></div>
  </>);
}

/* -------- CONFIRM -------- */
export function ConfirmDialog({ message, onYes }) {
  const { close } = useModal();
  const [busy, setBusy] = useState(false);
  const yes = async () => { setBusy(true); try { await onYes(); close(); } catch { setBusy(false); } };
  return (<>
    <h3><Icon name="trash" /> Konfirmasi</h3>
    <p style={{ color:'var(--muted)', lineHeight:1.6, marginBottom:18 }}>{message}</p>
    <div className="modal-foot"><div /><div className="row"><button className="btn ghost" onClick={close}>Batal</button><button className="btn danger" onClick={yes} disabled={busy}><Icon name="trash" /> {busy ? '...' : 'Hapus'}</button></div></div>
  </>);
}
