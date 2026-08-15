import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useStore } from '../lib/store.jsx';
import { useModal } from '../components/Modal.jsx';
import { api } from '../lib/api.js';
import { dateInput, todayInput } from '../lib/format.js';

const COLORS = ['#6b9bff', '#3ddc97', '#fb923c', '#a586ff', '#fbbf24', '#f87171', '#22d3ee', '#f472b6'];

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
      <div>{onDelete && <button className="btn danger sm" onClick={onDelete}><Icon name="trash" /> Hapus</button>}</div>
      <div className="row"><button className="btn ghost" onClick={close}>Batal</button>
        <button className="btn" onClick={onSave} disabled={busy}><Icon name="check" /> {busy ? '...' : 'Simpan'}</button></div>
    </div>
  );
}

/* ---------- PROJECT ---------- */
export function ProjectForm({ edit }) {
  const { createProject, updateProject, deleteProject } = useStore();
  const { open, close } = useModal();
  const [f, setF] = useState(edit ? {
    name:edit.name, type:edit.type, status:edit.status, description:edit.description || '',
    client_name:edit.client_name || '', rate_type:edit.rate_type, rate:Number(edit.rate) || 0, currency:edit.currency || 'IDR',
    color:edit.color || COLORS[0], tags:(edit.tags || []).join(', '), notes:edit.notes || '',
    start_date:dateInput(edit.start_date), due_date:dateInput(edit.due_date),
  } : { name:'', type:'personal', status:'active', description:'', client_name:'', rate_type:'none', rate:0, currency:'IDR', color:COLORS[0], tags:'', notes:'', start_date:'', due_date:'' });
  const [busy, setBusy] = useState(false); const [t, setT] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isPaid = f.type === 'freelance' || f.type === 'parttime';
  const save = async () => {
    setT(true); if (!f.name.trim()) return; setBusy(true);
    const data = { ...f, rate: +f.rate || 0, tags: parseTags(f.tags),
      rate_type: isPaid ? f.rate_type : 'none', start_date: f.start_date || null, due_date: f.due_date || null };
    try { edit ? await updateProject(edit.id, data) : await createProject(data); close(); }
    catch { setBusy(false); }
  };
  return (
    <>
      <h3><Icon name="folder" /> {edit ? 'Edit' : 'Project Baru'}</h3>
      <Field label="Nama Project" req><input className={t && !f.name.trim() ? 'err' : ''} value={f.name} onChange={set('name')} placeholder="cth: Landing Page UMKM" autoFocus /></Field>
      <div className="f2">
        <Field label="Type"><select value={f.type} onChange={set('type')}><option value="office">Kantor</option><option value="freelance">Freelance</option><option value="parttime">Part-time</option><option value="personal">Personal</option></select></Field>
        <Field label="Status"><select value={f.status} onChange={set('status')}><option value="active">Active</option><option value="on_hold">On Hold</option><option value="done">Done</option><option value="archived">Archived</option></select></Field>
      </div>
      {isPaid && (
        <>
          <div className="note"><Icon name="wallet" /> Info bayaran buat tracking income.</div>
          <Field label="Client / Pemberi Kerja"><input value={f.client_name} onChange={set('client_name')} placeholder="cth: Toko Berkah" /></Field>
          <div className="f3">
            <Field label="Rate Type"><select value={f.rate_type} onChange={set('rate_type')}><option value="none">—</option><option value="hourly">Per Jam</option><option value="fixed">Fixed</option></select></Field>
            <Field label={f.rate_type === 'hourly' ? 'Rate / Jam' : 'Nilai Total'}><input type="number" value={f.rate} onChange={set('rate')} placeholder="0" /></Field>
            <Field label="Currency"><select value={f.currency} onChange={set('currency')}><option>IDR</option><option>USD</option><option>SGD</option></select></Field>
          </div>
        </>
      )}
      <div className="f2">
        <Field label="Mulai"><input type="date" value={f.start_date} onChange={set('start_date')} /></Field>
        <Field label="Target"><input type="date" value={f.due_date} onChange={set('due_date')} /></Field>
      </div>
      <Field label="Warna">
        <div className="color-row">{COLORS.map(c => <div key={c} className={`sw ${f.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setF({ ...f, color: c })} />)}</div>
      </Field>
      <Field label="Tags (pisah koma)"><input value={f.tags} onChange={set('tags')} placeholder="react, web" /></Field>
      <Field label="Catatan / Notes"><textarea rows="2" value={f.notes} onChange={set('notes')} placeholder="Catatan bebas, keputusan, dll..." /></Field>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<Confirm message={`Hapus project "${edit.name}" beserta semua task/log/payment-nya?`} onYes={() => deleteProject(edit.id)} />) : null} />
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
    try { edit ? await api.updateTask(edit.id, data) : await api.createTask(data); toast(edit ? 'Task diperbarui' : 'Task dibuat'); await refresh(); onDone && onDone(); close(); }
    catch (e) { toast(e.message, 'err'); setBusy(false); }
  };
  const del = async () => { await api.deleteTask(edit.id); toast('Task dihapus'); await refresh(); onDone && onDone(); close(); };
  return (
    <>
      <h3><Icon name="check-sq" /> {edit ? 'Edit' : 'Task Baru'}</h3>
      <Field label="Judul Task" req><input className={t && !f.title.trim() ? 'err' : ''} value={f.title} onChange={set('title')} placeholder="cth: Slicing halaman home" autoFocus /></Field>
      <Field label="Project" req><select value={f.project_id} onChange={set('project_id')} disabled={!!edit}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <div className="f3">
        <Field label="Status"><select value={f.status} onChange={set('status')}><option value="todo">To Do</option><option value="doing">Doing</option><option value="done">Done</option></select></Field>
        <Field label="Prioritas"><select value={f.priority} onChange={set('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
        <Field label="Due"><input type="date" value={f.due_date} onChange={set('due_date')} /></Field>
      </div>
      <Field label="Tags (pisah koma)"><input value={f.tags} onChange={set('tags')} placeholder="frontend, urgent" /></Field>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<Confirm message={`Hapus task "${edit.title}"?`} onYes={del} />) : null} />
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
    try { edit ? await api.updateLog(edit.id, data) : await api.createLog(data); toast(edit ? 'Log diperbarui' : 'Kerjaan dicatat 🔥'); await refresh(); onDone && onDone(); close(); }
    catch (e) { toast(e.message, 'err'); setBusy(false); }
  };
  const del = async () => { await api.deleteLog(edit.id); toast('Log dihapus'); await refresh(); onDone && onDone(); close(); };
  const projTasks = tasks.filter(x => String(x.project_id) === String(f.project_id));
  return (
    <>
      <h3><Icon name="bolt" /> {edit ? 'Edit' : 'Catat'} Kerjaan</h3>
      <Field label="Apa yang dikerjain?" req><textarea rows="2" className={t && !f.description.trim() ? 'err' : ''} value={f.description} onChange={set('description')} placeholder="cth: Coding endpoint login + integrasi ke frontend" autoFocus /></Field>
      <div className="f2">
        <Field label="Project" req><select value={f.project_id} onChange={set('project_id')}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Task (opsional)"><select value={f.task_id} onChange={set('task_id')}><option value="">— tanpa task —</option>{projTasks.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>
      </div>
      <div className="f2">
        <Field label="Tanggal"><input type="date" value={f.log_date} onChange={set('log_date')} /></Field>
        <Field label="Jam kerja"><input type="number" step="0.25" min="0" value={f.hours} onChange={set('hours')} /></Field>
      </div>
      <label className="chk" style={{ marginBottom:6 }}><input type="checkbox" checked={f.billable} onChange={(e) => setF({ ...f, billable: e.target.checked })} /> <Icon name="wallet" /> Billable (jam ini dibayar klien)</label>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<Confirm message="Hapus work log ini?" onYes={del} />) : null} />
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
    try { edit ? await api.updatePayment(edit.id, data) : await api.createPayment(data); toast(edit ? 'Payment diperbarui' : 'Payment dicatat'); await refresh(); onDone && onDone(); close(); }
    catch (e) { toast(e.message, 'err'); setBusy(false); }
  };
  const del = async () => { await api.deletePayment(edit.id); toast('Payment dihapus'); await refresh(); onDone && onDone(); close(); };
  return (
    <>
      <h3><Icon name="wallet" /> {edit ? 'Edit' : 'Payment Baru'}</h3>
      <Field label="Project" req><select value={f.project_id} onChange={set('project_id')}>{list.map(p => <option key={p.id} value={p.id}>{p.name}{p.client_name ? ` · ${p.client_name}` : ''}</option>)}</select></Field>
      <div className="f2">
        <Field label="Label"><input value={f.label} onChange={set('label')} placeholder="cth: DP 50%, Termin 1" /></Field>
        <Field label="Status"><select value={f.status} onChange={set('status')}><option value="unpaid">Unpaid</option><option value="invoiced">Invoiced</option><option value="paid">Paid</option></select></Field>
      </div>
      <div className="f2">
        <Field label="Jumlah" req><input type="number" className={t && !f.amount ? 'err' : ''} value={f.amount} onChange={set('amount')} placeholder="0" /></Field>
        <Field label="Currency"><select value={f.currency} onChange={set('currency')}><option>IDR</option><option>USD</option><option>SGD</option></select></Field>
      </div>
      <div className="f2">
        <Field label="Tgl Invoice"><input type="date" value={f.invoice_date} onChange={set('invoice_date')} /></Field>
        <Field label="Tgl Dibayar"><input type="date" value={f.paid_date} onChange={set('paid_date')} /></Field>
      </div>
      <Field label="Catatan"><input value={f.note} onChange={set('note')} placeholder="opsional" /></Field>
      <Foot busy={busy} onSave={save} onDelete={edit ? () => open(<Confirm message="Hapus payment ini?" onYes={del} />) : null} />
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
      <h3><Icon name="trash" /> Konfirmasi</h3>
      <p style={{ color:'var(--muted)', lineHeight:1.6, marginBottom:18 }}>{message}</p>
      <div className="modal-foot"><div /><div className="row"><button className="btn ghost" onClick={close}>Batal</button><button className="btn danger" onClick={yes} disabled={busy}><Icon name="trash" /> {busy ? '...' : 'Hapus'}</button></div></div>
    </>
  );
}
