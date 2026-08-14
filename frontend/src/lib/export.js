import { fmtDateFull } from './format.js';

function save(content, filename, mime) {
  const b = new Blob([content], { type: mime });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = filename; a.click();
  URL.revokeObjectURL(u);
}
const csvRow = (arr) => arr.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');

export function exportWorkLog(logs) {
  const head = ['Tanggal', 'Project', 'Type', 'Task', 'Deskripsi', 'Jam', 'Billable'];
  const rows = logs.map(l => [fmtDateFull(l.log_date), l.project_name, l.project_type, l.task_title || '', l.description, l.hours, l.billable ? 'Ya' : '']);
  const total = logs.reduce((a, l) => a + Number(l.hours), 0);
  rows.push(['', '', '', '', 'TOTAL', total, '']);
  save('\ufeff' + [csvRow(head), ...rows.map(csvRow)].join('\n'), `MutazOS_WorkLog_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
}
export function exportPayments(payments) {
  const head = ['Project', 'Client', 'Label', 'Jumlah', 'Currency', 'Status', 'Invoice', 'Dibayar'];
  const rows = payments.map(p => [p.project_name, p.client_name || '', p.label || '', p.amount, p.currency, p.status, p.invoice_date || '', p.paid_date || '']);
  save('\ufeff' + [csvRow(head), ...rows.map(csvRow)].join('\n'), `MutazOS_Payments_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
}
