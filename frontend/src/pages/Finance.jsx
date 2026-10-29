import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { KpiCard, DataTable, Badge } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { useModal } from '../components/Modal.jsx';
import { PaymentForm } from '../modals/Forms.jsx';
import { exportPayments } from '../lib/export.js';
import { payLabel, payClass, money, moneyShort, fmtDate } from '../lib/format.js';

export default function Finance({ onMenu }) {
  const { projects, refresh } = useStore();
  const { open } = useModal();
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => { setPayments(await api.payments(status ? '?status=' + status : '')); }, [status]);
  useEffect(() => { load(); }, [load]);
  const reload = async () => { await load(); await refresh(); };

  const idr = payments.filter(p => p.currency === 'IDR');
  const paid = idr.filter(p => p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0);
  const unpaid = idr.filter(p => p.status !== 'paid').reduce((a, p) => a + Number(p.amount), 0);
  const now = new Date();
  const thisMonth = idr.filter(p => p.status === 'paid' && p.paid_date && new Date(p.paid_date).getMonth() === now.getMonth() && new Date(p.paid_date).getFullYear() === now.getFullYear()).reduce((a, p) => a + Number(p.amount), 0);

  return (
    <>
      <Topbar title={<h1>Finance</h1>} sub="Freelance & part-time income" onMenu={onMenu}>
        <button className="btn ghost sm" onClick={() => exportPayments(payments)}><Icon name="download" /> Export</button>
        <button className="btn sm" onClick={() => open(<PaymentForm projects={projects} onDone={reload} />)}><Icon name="plus" /> Payment</button>
      </Topbar>
      <div className="kpis">
        <KpiCard label="Income This Month" value={moneyShort(thisMonth)} tag="paid · IDR" accent="acc-green" icon="wallet" />
        <KpiCard label="Total Paid" value={moneyShort(paid)} tag="all time · IDR" accent="acc-blue" icon="check" />
        <KpiCard label="Outstanding" value={moneyShort(unpaid)} tag="unpaid · IDR" accent="acc-orange" icon="clock" />
        <KpiCard label="Total Entries" value={payments.length} tag="payments · all currencies" accent="acc-purple" icon="chart" />
      </div>
      {payments.some(p => p.currency !== 'IDR') && (
        <p style={{ color:'var(--muted)', fontSize:12, marginTop:-8, marginBottom:16 }}>
          The KPIs above only count IDR payments. There are payments in other currencies in the table below, check those manually.
        </p>
      )}
      <div className="filters">
        <div className="seg">{[['', 'All'], ['unpaid', 'Unpaid'], ['invoiced', 'Invoiced'], ['paid', 'Paid']].map(([v, l]) => <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{l}</button>)}</div>
      </div>
      <div className="panel" style={{ padding:0 }}>
        <DataTable rows={payments} cols={[
          { h:'Project', title:1, cell:p => p.project_name },
          { h:'Client', cell:p => p.client_name || '—' },
          { h:'Label', cell:p => p.label || '—' },
          { h:'Amount', cell:p => <b>{money(p.amount, p.currency)}</b> },
          { h:'Status', cell:p => <Badge cls={payClass[p.status]}>{payLabel[p.status]}</Badge> },
          { h:'Invoiced', cell:p => fmtDate(p.invoice_date) },
          { h:'Paid', cell:p => fmtDate(p.paid_date) },
          { h:'', cell:p => (
            <span className="rowact">
              {p.status !== 'paid' && <button onClick={async () => { await api.markPaid(p.id); reload(); }} title="Mark as paid" aria-label="Mark as paid"><Icon name="check" /></button>}
              <button onClick={() => open(<PaymentForm edit={p} projects={projects} onDone={reload} />)} title="Edit payment" aria-label="Edit payment"><Icon name="edit" /></button>
            </span>
          ) },
        ]} cardTitle={p => `${p.project_name} · ${money(p.amount, p.currency)}`} empty="No payments yet. Add one from a freelance project." />
      </div>
    </>
  );
}
