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
      <Topbar title={<h1>Finance</h1>} sub="Income freelance & part-time" onMenu={onMenu}>
        <button className="btn ghost sm" onClick={() => exportPayments(payments)}><Icon name="download" /> Export</button>
        <button className="btn sm" onClick={() => open(<PaymentForm projects={projects} onDone={reload} />)}><Icon name="plus" /> Payment</button>
      </Topbar>
      <div className="kpis">
        <KpiCard label="Income Bulan Ini" value={moneyShort(thisMonth)} tag="sudah dibayar" accent="acc-green" icon="wallet" />
        <KpiCard label="Total Dibayar" value={moneyShort(paid)} tag="semua waktu" accent="acc-blue" icon="check" />
        <KpiCard label="Belum Dibayar" value={moneyShort(unpaid)} tag="outstanding" accent="acc-orange" icon="clock" />
        <KpiCard label="Total Entri" value={payments.length} tag="payment" accent="acc-purple" icon="chart" />
      </div>
      <div className="filters">
        <div className="seg">{[['', 'Semua'], ['unpaid', 'Unpaid'], ['invoiced', 'Invoiced'], ['paid', 'Paid']].map(([v, l]) => <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{l}</button>)}</div>
      </div>
      <div className="panel" style={{ padding:0 }}>
        <DataTable rows={payments} cols={[
          { h:'Project', title:1, cell:p => p.project_name },
          { h:'Client', cell:p => p.client_name || '—' },
          { h:'Label', cell:p => p.label || '—' },
          { h:'Jumlah', cell:p => <b>{money(p.amount, p.currency)}</b> },
          { h:'Status', cell:p => <Badge cls={payClass[p.status]}>{payLabel[p.status]}</Badge> },
          { h:'Invoice', cell:p => fmtDate(p.invoice_date) },
          { h:'Dibayar', cell:p => fmtDate(p.paid_date) },
          { h:'', cell:p => (
            <span className="rowact">
              {p.status !== 'paid' && <button onClick={async () => { await api.markPaid(p.id); reload(); }} title="Tandai lunas" aria-label="Tandai lunas"><Icon name="check" /></button>}
              <button onClick={() => open(<PaymentForm edit={p} projects={projects} onDone={reload} />)} title="Edit payment" aria-label="Edit payment"><Icon name="edit" /></button>
            </span>
          ) },
        ]} cardTitle={p => `${p.project_name} · ${money(p.amount, p.currency)}`} empty="Belum ada payment. Tambah dari project freelance." />
      </div>
    </>
  );
}
