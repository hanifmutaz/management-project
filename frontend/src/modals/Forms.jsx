import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useStore } from '../lib/store.jsx';
import { useModal } from '../components/Modal.jsx';
import { api } from '../lib/api.js';
import { dateInput, todayInput, typeShades, typeLabel } from '../lib/format.js';

const COLORS = ['#6b9bff', '#3ddc97', '#fb923c', '#a586ff', '#fbbf24', '#f87171', '#22d3ee', '#f472b6'];
const shadesFor = (type) => typeShades[type] || COLORS;

// "react, React, web" -> ['react', 'web'] — trims, drops empties, dedupes case-insensitively
// while keeping the first-seen casing.
function parseTags(str) {
  const seen = new Set();
  const out = [];
  for (const raw of str.split(',')) {
    const t = raw.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function Field({ label, req, children }) {
  return <div className="field"><label>{label} {req && <span className="req">*</span>}</label>{children}</div>;
}
function Foot({ onDelete, onSave, busy }) {
  const { close } = useModal();
  return (
    <div className="modal-foot">
      <div>{onDelete && <button className="btn danger sm" onClick={onDelete}><Icon name="trash" /> Delete</button>}</div>
      <div className="row"><button className="btn ghost" onClick={close}>Cancel</button>
        <button className="btn" onClick={onSave} disabled={busy}><Icon name="check" /> {busy ? '...' : 'Save'}</button></div>
    </div>
  );
}

/* ---------- PROJECT ---------- */
export function ProjectForm({ edit, onDone }) {
  const { createProject, updateProject, deleteProject } = useStore();
  const { open, close } = useModal();
  const [f, setF] = useState(edit ? {
    name:edit.name, type:edit.type, status:edit.status, description:edit.description || '',
    client_name:edit.client_name || '', rate_type:edit.rate_type, rate:Number(edit.rate) || 0, currency:edit.currency || 'IDR',
    color:edit.color || shadesFor(edit.type)[0], tags:(edit.tags || []).join(', '), notes:edit.notes || '',
    start_date:dateInput(edit.start_date), due_date:dateInput(edit.due_date),
  } : { name:'', type:'personal', status:'active', description:'', client_name:'', rate_type:'none', rate:0, currency:'IDR', color:shadesFor('personal')[0], tags:'', notes:'', start_date:'', due_date:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  // Ganti kategori -> warna ikut nyesuaiin ke shade kategori baru itu (kecuali warna yang
  // lagi kepilih emang udah salah satu shade kategori baru, biarin aja).
  const setType = (e) => {
    const type = e.target.value;
    const shades = shadesFor(type);
    setF({ ...f, type, color: shades.includes(f.color) ? f.color : shades[0] });
  };
  const isPaid = f.type === 'freelance' || f.type === 'parttime';
  const save = async () => {
    setT(true); if (!f.name.trim()) return; setBusy(true);
    const data = { ...f, rate: +f.rate || 0, tags: parseTags(f.tags),
      rate_type: isPaid ? f.rate_type : 'none', start_date: f.start_date || null, due_date: f.due_date || null };
    try { edit ? await updateProject(edit.id, data) : await createProject(data); onDone && await onDone(); close(); }
    catch { setBusy(false); }
  };
  const del = async () => { await deleteProject(edit.id); onDone && await onDone(); close(); };
  return (
    <>
      <h3><Icon name="folder" /> {edit ? 'Edit Project' : 'New Project'}</h3>
      <Field label="Project Name" req><input className={t && !f.name.trim() ? 'err' : ''} value={f.name} onChange={set('name')} placeholder="e.g. SME Landing Page" autoFocus /></Field>
      <div className="f2">
        <Field label="Type"><select value={f.type} onChange={setType}><option value="office">Office</option><option value="freelance">Freelance</option><option value="parttime">Part-time</option><option value="kuliah">Study</option><option value="personal">Personal</option></select></Field>
        <Field label="Status"><select value={f.status} onChange={set('status')}><option value="active">Active</option><option value="on_hold">On Hold</option><option value="done">Done</option><option value="archived">Archived</option></select></Field>
      </div>
      {isPaid && (
        <>
          <div className="note"><Icon name="wallet" /> Payment info for income tracking.</div>
          <Field label="Client"><input value={f.client_name} onChange={set('client_name')} placeholder="e.g. Acme Store" /></Field>
          <div className="f3">
            <Field label="Rate Type"><select value={f.rate_type} onChange={set('rate_type')}><option value="none">—</option><option value="hourly">Per Hour</option><option value="fixed">Fixed</option></select></Field>
            <Field label={f.rate_type === 'hourly' ? 'Rate / Hour' : 'Total Value'}><input type="number" value={f.rate} onChange={set('rate')} placeholder="0" /></Field>
            <Field label="Currency"><select value={f.currency} onChange={set('currency')}><option>IDR</option><option>USD</option><option>SGD</option></select></Field>
          </div>
        </>
      )}
      <div className="f2">
        <Field label="Start"><input type="date" value={f.start_date} onChange={set('start_date')} /></Field>
        <Field label="Target"><input type="date" value={f.due_date} onChange={set('due_date')} /></Field>
      </div>
      <Field label="Color">
        <div className="color-row">{shadesFor(f.type).map(c => <div key={c} className={`sw ${f.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setF({ ...f, color: c })} />)}</div>
        <div style={{ color:'var(--faint)', fontSize:10.5, marginTop:6 }}>Shades follow the "{typeLabel[f.type]}" category so projects in the same category stay visually consistent.</div>
      </Field>
      <Field label="Tags (comma-separated)"><input value={f.tags} onChange={set('tags')} placeholder="react, web" /></Field>
      <Field label="Notes"><textarea rows="2" value={f.notes} onChange={set('notes')} placeholder="Free-form notes, decisions, etc..." /></Field>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<Confirm message={`Delete project "${edit.name}" and all its tasks, logs and payments?`} onYes={del} />) : null} />
    </>
  );
}

/* ---------- TASK ---------- */
export function TaskForm({ edit, projects, defaultProject, onDone }) {
  const { open, close } = useModal();
  const { toast, refresh } = useStore();
  const [f, setF] = useState(edit ? { project_id:edit.project_id, title:edit.title, status:edit.status, priority:edit.priority, due_date:dateInput(edit.due_date), tags:(edit.tags || []).join(', ') }
    : { project_id:defaultProject || projects[0]?.id, title:'', status:'todo', priority:'medium', due_date:'', tags:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setT(true); if (!f.title.trim()) return; setBusy(true);
    const data = { ...f, due_date: f.due_date || null, tags: parseTags(f.tags) };
    try { edit ? await api.updateTask(edit.id, data) : await api.createTask(data); toast(edit ? 'Task updated' : 'Task created'); await refresh(); onDone && onDone(); close(); }
    catch (e) { toast(e.message, 'err'); setBusy(false); }
  };
  const del = async () => { await api.deleteTask(edit.id); toast('Task deleted'); await refresh(); onDone && onDone(); close(); };
  return (
    <>
      <h3><Icon name="check-sq" /> {edit ? 'Edit Task' : 'New Task'}</h3>
      <Field label="Task Title" req><input className={t && !f.title.trim() ? 'err' : ''} value={f.title} onChange={set('title')} placeholder="e.g. Build the home page layout" autoFocus /></Field>
      <Field label="Project" req><select value={f.project_id} onChange={set('project_id')} disabled={!!edit}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <div className="f3">
        <Field label="Status"><select value={f.status} onChange={set('status')}><option value="todo">To Do</option><option value="doing">Doing</option><option value="done">Done</option></select></Field>
        <Field label="Priority"><select value={f.priority} onChange={set('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
        <Field label="Due"><input type="date" value={f.due_date} onChange={set('due_date')} /></Field>
      </div>
      <Field label="Tags (comma-separated)"><input value={f.tags} onChange={set('tags')} placeholder="frontend, urgent" /></Field>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<Confirm message={`Delete task "${edit.title}"?`} onYes={del} />) : null} />
    </>
  );
}

/* ---------- WORK LOG ⭐ ---------- */
export function WorkLogForm({ edit, projects, defaultProject, tasks = [], onDone }) {
  const { open, close } = useModal();
  const { toast, refresh } = useStore();
  const [f, setF] = useState(edit ? { project_id:edit.project_id, task_id:edit.task_id || '', log_date:dateInput(edit.log_date), description:edit.description, hours:Number(edit.hours) || 0, billable:!!edit.billable }
    : { project_id:defaultProject || projects[0]?.id, task_id:'', log_date:todayInput(), description:'', hours:1, billable:false });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setT(true); if (!f.description.trim()) return; setBusy(true);
    const data = { ...f, task_id: f.task_id || null, hours: +f.hours || 0 };
    try { edit ? await api.updateLog(edit.id, data) : await api.createLog(data); toast(edit ? 'Log updated' : 'Work logged'); await refresh(); onDone && onDone(); close(); }
    catch (e) { toast(e.message, 'err'); setBusy(false); }
  };
  const del = async () => { await api.deleteLog(edit.id); toast('Log deleted'); await refresh(); onDone && onDone(); close(); };
  const projTasks = tasks.filter(x => String(x.project_id) === String(f.project_id));
  return (
    <>
      <h3><Icon name="bolt" /> {edit ? 'Edit' : 'Log'} Work</h3>
      <Field label="What did you work on?" req><textarea rows="2" className={t && !f.description.trim() ? 'err' : ''} value={f.description} onChange={set('description')} placeholder="e.g. Built the login endpoint and wired it to the frontend" autoFocus /></Field>
      <div className="f2">
        <Field label="Project" req><select value={f.project_id} onChange={set('project_id')}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Task (optional)"><select value={f.task_id} onChange={set('task_id')}><option value="">— no task —</option>{projTasks.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>
      </div>
      <div className="f2">
        <Field label="Date"><input type="date" value={f.log_date} onChange={set('log_date')} /></Field>
        <Field label="Hours"><input type="number" step="0.25" min="0" value={f.hours} onChange={set('hours')} /></Field>
      </div>
      <label className="chk" style={{ marginBottom:6 }}><input type="checkbox" checked={f.billable} onChange={(e) => setF({ ...f, billable: e.target.checked })} /> <Icon name="wallet" /> Billable (hours paid by the client)</label>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<Confirm message="Delete this work log?" onYes={del} />) : null} />
    </>
  );
}

/* ---------- PAYMENT ---------- */
export function PaymentForm({ edit, projects, defaultProject, onDone }) {
  const { open, close } = useModal();
  const { toast, refresh } = useStore();
  const paidP = projects.filter(p => p.type === 'freelance' || p.type === 'parttime');
  const list = paidP.length ? paidP : projects;
  const [f, setF] = useState(edit ? { project_id:edit.project_id, label:edit.label || '', amount:Number(edit.amount) || 0, currency:edit.currency || 'IDR', status:edit.status, invoice_date:dateInput(edit.invoice_date), paid_date:dateInput(edit.paid_date), note:edit.note || '' }
    : { project_id:defaultProject || list[0]?.id, label:'', amount:0, currency:'IDR', status:'unpaid', invoice_date:'', paid_date:'', note:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setT(true); if (!f.amount) return; setBusy(true);
    const data = { ...f, amount: +f.amount || 0, invoice_date: f.invoice_date || null, paid_date: f.status === 'paid' ? (f.paid_date || todayInput()) : (f.paid_date || null) };
    try { edit ? await api.updatePayment(edit.id, data) : await api.createPayment(data); toast(edit ? 'Payment updated' : 'Payment recorded'); await refresh(); onDone && onDone(); close(); }
    catch (e) { toast(e.message, 'err'); setBusy(false); }
  };
  const del = async () => { await api.deletePayment(edit.id); toast('Payment deleted'); await refresh(); onDone && onDone(); close(); };
  return (
    <>
      <h3><Icon name="wallet" /> {edit ? 'Edit Payment' : 'New Payment'}</h3>
      <Field label="Project" req><select value={f.project_id} onChange={set('project_id')}>{list.map(p => <option key={p.id} value={p.id}>{p.name}{p.client_name ? ` · ${p.client_name}` : ''}</option>)}</select></Field>
      <div className="f2">
        <Field label="Label"><input value={f.label} onChange={set('label')} placeholder="e.g. 50% deposit, Milestone 1" /></Field>
        <Field label="Status"><select value={f.status} onChange={set('status')}><option value="unpaid">Unpaid</option><option value="invoiced">Invoiced</option><option value="paid">Paid</option></select></Field>
      </div>
      <div className="f2">
        <Field label="Amount" req><input type="number" className={t && !f.amount ? 'err' : ''} value={f.amount} onChange={set('amount')} placeholder="0" /></Field>
        <Field label="Currency"><select value={f.currency} onChange={set('currency')}><option>IDR</option><option>USD</option><option>SGD</option></select></Field>
      </div>
      <div className="f2">
        <Field label="Invoice Date"><input type="date" value={f.invoice_date} onChange={set('invoice_date')} /></Field>
        <Field label="Paid Date"><input type="date" value={f.paid_date} onChange={set('paid_date')} /></Field>
      </div>
      <Field label="Note"><input value={f.note} onChange={set('note')} placeholder="optional" /></Field>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<Confirm message="Delete this payment?" onYes={del} />) : null} />
    </>
  );
}

/* ---------- CONFIRM ---------- */
export function Confirm({ message, onYes }) {
  const { close } = useModal();
  const [busy, setBusy] = useState(false);
  const yes = async () => { setBusy(true); try { await onYes(); close(); } catch { setBusy(false); } };
  return (
    <>
      <h3><Icon name="trash" /> Confirm</h3>
      <p style={{ color:'var(--muted)', lineHeight:1.6, marginBottom:18 }}>{message}</p>
      <div className="modal-foot"><div /><div className="row"><button className="btn ghost" onClick={close}>Cancel</button><button className="btn danger" onClick={yes} disabled={busy}><Icon name="trash" /> {busy ? '...' : 'Delete'}</button></div></div>
    </>
  );
}
