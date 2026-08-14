export const typeLabel = { office:'Kantor', freelance:'Freelance', parttime:'Part-time', personal:'Personal' };
export const typeClass = { office:'b-blue', freelance:'b-green', parttime:'b-purple', personal:'b-yellow' };
export const typeColor = { office:'#5b8cff', freelance:'#34d399', parttime:'#9b6bff', personal:'#fbbf24' };
export const typeIcon = { office:'briefcase', freelance:'wallet', parttime:'clock', personal:'user' };

export const projStatusLabel = { active:'Active', on_hold:'On Hold', done:'Done', archived:'Archived' };
export const projStatusClass = { active:'b-green', on_hold:'b-yellow', done:'b-blue', archived:'b-gray' };

export const taskLabel = { todo:'To Do', doing:'Doing', done:'Done' };
export const taskClass = { todo:'b-gray', doing:'b-blue', done:'b-green' };
export const prioLabel = { low:'Low', medium:'Medium', high:'High' };
export const prioClass = { low:'b-gray', medium:'b-yellow', high:'b-orange' };

export const payLabel = { unpaid:'Unpaid', invoiced:'Invoiced', paid:'Paid' };
export const payClass = { unpaid:'b-orange', invoiced:'b-yellow', paid:'b-green' };

export const num = (v) => Math.round(Number(v) || 0);
export const hrs = (v) => { const n = Number(v) || 0; return (Number.isInteger(n) ? n : n.toFixed(1)) + 'j'; };

export function money(v, cur = 'IDR') {
  const n = Number(v) || 0;
  if (cur === 'IDR') return 'Rp' + n.toLocaleString('id-ID');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
}
export function moneyShort(v) {
  const n = Number(v) || 0;
  if (n >= 1e9) return 'Rp' + (n / 1e9).toFixed(1) + 'M';
  if (n >= 1e6) return 'Rp' + (n / 1e6).toFixed(1) + 'jt';
  if (n >= 1e3) return 'Rp' + Math.round(n / 1e3) + 'rb';
  return 'Rp' + n;
}

const MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DAY = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso); if (isNaN(d)) return iso;
  return `${String(d.getDate()).padStart(2,'0')} ${MON[d.getMonth()]}`;
}
export function fmtDateFull(iso) {
  if (!iso) return '—';
  const d = new Date(iso); if (isNaN(d)) return iso;
  const t = new Date(); t.setHours(0,0,0,0);
  const dd = new Date(d); dd.setHours(0,0,0,0);
  const diff = Math.round((t - dd) / 86400000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  return `${DAY[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}
export function dowShort(iso) { const d = new Date(iso); return isNaN(d) ? '' : DAY[d.getDay()]; }
export function dateInput(iso) {
  if (!iso) return '';
  const d = new Date(iso); if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}
export const todayInput = () => new Date().toISOString().slice(0, 10);

export function idleText(days) {
  if (days == null) return '';
  if (days <= 0) return 'Hari ini';
  if (days === 1) return 'Kemarin';
  return `${days} hari lalu`;
}
export function idleColor(days) {
  if (days >= 14) return 'var(--red)';
  if (days >= 7) return 'var(--orange)';
  if (days >= 4) return 'var(--yellow)';
  return 'var(--muted)';
}
export function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}
// delta % antara dua angka
export function delta(cur, prev) {
  cur = Number(cur) || 0; prev = Number(prev) || 0;
  if (prev === 0) return cur > 0 ? { up: true, text: 'baru' } : null;
  const pct = Math.round((cur - prev) / prev * 100);
  if (pct === 0) return { flat: true, text: 'sama' };
  return { up: pct > 0, text: (pct > 0 ? '+' : '') + pct + '%' };
}
