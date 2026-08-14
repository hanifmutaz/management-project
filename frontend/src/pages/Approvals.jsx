import { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { statusLabel, statusClass, fmtDateTime } from '../lib/format.js';
import { Badge, Empty } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { ApprovalForm } from '../modals/Forms.jsx';

function ApprovalCard({ a }) {
  const { decideApproval } = useStore();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = a.status === 'pending';
  const decide = async (d) => { setBusy(true); try { await decideApproval(a.id, d, note); } catch { setBusy(false); } };
  return (
    <div className="appr-card">
      <div className="ah">
        <div>
          <div className="at"><Icon name="gavel" /> {a.title}</div>
          <div className="ameta"><span><Icon name="folder" /> {a.project_code} · {a.project_name}</span><span><Icon name="layers" /> {statusLabel(a.entity_type)}: {a.entity_label}</span></div>
        </div>
        <Badge cls={statusClass(a.status)}>{statusLabel(a.status)}</Badge>
      </div>
      <div className="adesc">
        Diminta oleh <b>{a.requester}</b> · Approver <b>{a.approver}</b> · {fmtDateTime(a.requested_at)}
        {a.request_note && <><br />Catatan: {a.request_note}</>}
        {a.decision_note && <><br />Keputusan: {a.decision_note}</>}
        {a.decided_at && <><br />Diputuskan: {fmtDateTime(a.decided_at)}</>}
      </div>
      {pending && (
        <>
          <textarea className="appr-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan keputusan (opsional)..." />
          <div className="aact">
            <button className="btn sm" disabled={busy} onClick={() => decide('approved')}><Icon name="check" /> Approve</button>
            <button className="btn danger sm" disabled={busy} onClick={() => decide('rejected')}><Icon name="x" /> Reject</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Approvals({ onMenu }) {
  const { approvals } = useStore();
  const { open } = useModal();
  const [tab, setTab] = useState('pending');
  const pend = approvals.filter(a => a.status === 'pending');
  const dec = approvals.filter(a => a.status !== 'pending');
  return (
    <>
      <Topbar title="Approvals" sub="Governance · sign-off & acceptance" onMenu={onMenu}>
        <button className="btn sm" onClick={() => open(<ApprovalForm />)}><Icon name="plus" /> Request Approval</button>
      </Topbar>
      <div className="tabs">
        <a className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}><Icon name="inbox" /> Pending <Badge cls="b-orange">{pend.length}</Badge></a>
        <a className={tab === 'decided' ? 'active' : ''} onClick={() => setTab('decided')}><Icon name="check" /> Decided</a>
      </div>
      {tab === 'pending'
        ? (pend.length ? pend.map(a => <ApprovalCard key={a.id} a={a} />) : <Empty icon="check">Tidak ada approval pending 🎉</Empty>)
        : (dec.length ? dec.map(a => <ApprovalCard key={a.id} a={a} />) : <Empty>Belum ada keputusan</Empty>)}
    </>
  );
}
