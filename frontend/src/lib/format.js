// Mapping nilai dari DB (enum lowercase) -> label & warna badge untuk UI.
export const healthLabel = { on_track:'On Track', watch:'Watch', at_risk:'At Risk', critical:'Critical' };
export const healthClass = { on_track:'b-green', watch:'b-yellow', at_risk:'b-orange', critical:'b-red' };
export const healthDot = { on_track:'var(--green)', watch:'var(--yellow)', at_risk:'var(--orange)', critical:'var(--red)' };
export const barHealth = (h) => h === 'critical' ? 'h-red' : h === 'at_risk' ? 'h-orange' : h === 'watch' ? '' : 'h-green';

// status enum -> label
export const statusLabel = (s) => ({
  not_started:'Not Started', in_progress:'In Progress', review:'Review', done:'Done', on_hold:'On Hold',
  cancelled:'Cancelled', planning:'Planning', execution:'Execution', monitoring:'Monitoring', closed:'Closed',
  delayed:'Delayed', open:'Open', resolved:'Resolved', identified:'Identified', analyzing:'Analyzing',
  mitigating:'Mitigating', occurred:'Occurred', pending:'Pending', approved:'Approved', rejected:'Rejected',
}[s] || s || '—');

export const statusClass = (s) => ({
  done:'b-green', approved:'b-green', resolved:'b-green',
  in_progress:'b-blue', execution:'b-blue', monitoring:'b-blue', mitigating:'b-blue', analyzing:'b-blue',
  review:'b-purple',
  open:'b-orange', pending:'b-orange', delayed:'b-red', rejected:'b-red', occurred:'b-red',
  not_started:'b-gray', planning:'b-gray', identified:'b-gray', on_hold:'b-gray', closed:'b-gray', cancelled:'b-gray',
}[s] || 'b-gray');

export const sevLabel = (s) => ({ low:'Low', medium:'Medium', high:'High', critical:'Critical' }[s] || s);
export const sevClass = (s) => ({ critical:'b-red', high:'b-orange', medium:'b-yellow', low:'b-gray' }[s] || 'b-gray');

export const num = (v) => Math.round(Number(v) || 0);
export const initials = (n) => (n || '?').split(/[\s\u2019']/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

// format tanggal ISO -> "06 Mei"
const MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${String(d.getDate()).padStart(2,'0')} ${MON[d.getMonth()]}`;
}
export function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${String(d.getDate()).padStart(2,'0')} ${MON[d.getMonth()]} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// input date value (YYYY-MM-DD) untuk <input type=date>
export function dateInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}
