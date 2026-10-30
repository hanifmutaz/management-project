export const typeLabel = { office:'Office', freelance:'Freelance', parttime:'Part-time', personal:'Personal', kuliah:'Study' };
export const typeClass = { office:'b-blue', freelance:'b-green', parttime:'b-purple', personal:'b-yellow', kuliah:'b-cyan' };
// Workspace colors are CSS variables (see styles.css) so light and dark mode each get a tuned shade.
export const typeColor = { office:'var(--c-office)', freelance:'var(--c-freelance)', parttime:'var(--c-parttime)', personal:'var(--c-personal)', kuliah:'var(--c-kuliah)' };
export const typeDesc = { office:'Internal team projects', freelance:'Client projects and independent work', parttime:'Part-time and teaching work', personal:'Personal projects and learning', kuliah:'Coursework and study' };
export const TYPE_ORDER = ['office', 'freelance', 'parttime', 'personal', 'kuliah'];
export const typeIcon = { office:'briefcase', freelance:'wallet', parttime:'clock', personal:'user', kuliah:'book' };
// Shades per category — every project in a category picks one of these colors, so a glance
// tells you "this is office/freelance/etc." (same hue) while projects stay distinguishable
// (different shade). Used by the project form's color picker (see Forms.jsx).
export const typeShades = {
  office:    ['#5b8cff', '#3b6fe0', '#7ba0ff', '#274ea8', '#8fb3ff', '#4a7ff0'],
  freelance: ['#34d399', '#189367', '#5ee0b0', '#0f7a53', '#7bead0', '#22b880'],
  parttime:  ['#9b6bff', '#6a3ed1', '#b28cff', '#552fa8', '#c5a8ff', '#8150e6'],
  personal:  ['#fbbf24', '#c9910a', '#ffd166', '#a87708', '#ffdd94', '#e0a70f'],
  kuliah:    ['#22d3ee', '#0d94ab', '#5ee3f5', '#0a7a8c', '#8aebf7', '#12b6d1'],
};

export const projStatusLabel = { active:'Active', on_hold:'On Hold', done:'Done', archived:'Archived' };
export const projStatusClass = { active:'b-green', on_hold:'b-yellow', done:'b-blue', archived:'b-gray' };
export const projStatusColor = { active:'var(--green)', on_hold:'var(--yellow)', done:'var(--brand)', archived:'var(--faint)' };

export const taskLabel = { todo:'To Do', doing:'Doing', done:'Done' };
export const taskClass = { todo:'b-gray', doing:'b-blue', done:'b-green' };
export const prioLabel = { low:'Low', medium:'Medium', high:'High' };
export const prioClass = { low:'b-gray', medium:'b-yellow', high:'b-red' };

export const payLabel = { unpaid:'Unpaid', invoiced:'Invoiced', paid:'Paid' };
export const payClass = { unpaid:'b-orange', invoiced:'b-yellow', paid:'b-green' };

export const num = (v) => Math.round(Number(v) || 0);
export const hrs = (v) => { const n = Number(v) || 0; return (Number.isInteger(n) ? n : n.toFixed(1)) + 'h'; };

export function money(v, cur = 'IDR') {
  const n = Number(v) || 0;
  if (cur === 'IDR') return 'Rp' + n.toLocaleString('id-ID');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
}
export function moneyShort(v, cur = 'IDR') {
  const n = Number(v) || 0;
  if (cur !== 'IDR') return money(n, cur);
  if (n >= 1e9) return 'Rp' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return 'Rp' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return 'Rp' + Math.round(n / 1e3) + 'K';
  return 'Rp' + n;
}

export const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
// Date-only strings ("2026-10-29") are parsed as LOCAL dates; plain new Date("2026-10-29")
// is UTC midnight, which lands on the previous day in UTC- timezones.
function parseDate(iso) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).slice(0, 10));
  const d = m && String(iso).length === 10 ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso);
  return isNaN(d) ? null : d;
}
export function monthYear(d) { return `${MON[d.getMonth()]} ${d.getFullYear()}`; }
export function fmtDate(iso) {
  if (!iso) return '—';
  const d = parseDate(iso); if (!d) return iso;
  return `${String(d.getDate()).padStart(2,'0')} ${MON[d.getMonth()]}`;
}
export function fmtDateFull(iso) {
  if (!iso) return '—';
  const d = parseDate(iso); if (!d) return iso;
  const t = new Date(); t.setHours(0,0,0,0);
  const dd = new Date(d); dd.setHours(0,0,0,0);
  const diff = Math.round((t - dd) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${DAY[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}
export function dowShort(iso) { const d = parseDate(iso); return d ? DAY[d.getDay()] : ''; }
export function dateInput(iso) {
  if (!iso) return '';
  const d = parseDate(iso); if (!d) return '';
  return localISO(d);
}
export const todayInput = () => localISO();

export function idleText(days) {
  if (days == null) return '';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}
export function idleColor(days) {
  if (days >= 14) return 'var(--red)';
  if (days >= 7) return 'var(--orange)';
  if (days >= 4) return 'var(--yellow)';
  return 'var(--muted)';
}
const DAYFULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
// Day label for grouping "Upcoming": Today / Tomorrow / weekday name (< 7 days) / plain date
export function dayLabel(iso) {
  if (!iso) return '';
  const d = parseDate(iso); if (!d) return iso;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const dd = new Date(d); dd.setHours(0, 0, 0, 0);
  const diff = Math.round((dd - t) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return DAYFULL[d.getDay()];
  return fmtDate(iso);
}
// Relative "X ago" from a timestamp (used by Recent Work)
export function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso); if (isNaN(d)) return '';
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return min + 'm ago';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + 'h ago';
  const day = Math.floor(hr / 24);
  if (day < 7) return day + 'd ago';
  return fmtDate(iso);
}
export function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  if (h >= 18 && h < 22) return 'Good evening';
  return 'Burning the midnight oil';
}
// delta % antara dua angka
export function delta(cur, prev) {
  cur = Number(cur) || 0; prev = Number(prev) || 0;
  if (prev === 0) return cur > 0 ? { up: true, text: 'new' } : null;
  const pct = Math.round((cur - prev) / prev * 100);
  if (pct === 0) return { flat: true, text: 'same' };
  return { up: pct > 0, text: (pct > 0 ? '+' : '') + pct + '%' };
}

// Local-time YYYY-MM-DD (toISOString() would give the UTC date, which is "yesterday" in the
// early morning for UTC+ timezones).
export function localISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// "2026-10-27" -> "Oct 27" without going through Date parsing (no timezone shift).
export function weekLabel(iso) {
  const [, m, d] = String(iso).split('-');
  return `${MON[+m - 1]} ${+d}`;
}

// Whole days from `from` to `to` (both YYYY-MM-DD); negative when `to` is earlier.
export function dayDiff(to, from = localISO()) {
  const a = parseDate(to), b = parseDate(from);
  if (!a || !b) return 0;
  return Math.round((a - b) / 86400000);
}
// "Fri, 30 Oct 2026" for the app bar.
export function todayLabel() {
  const d = new Date();
  return `${DAY[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}
// Group heading for Upcoming: Today / Tomorrow / "Tuesday, 5 Nov".
export function dayHeading(iso) {
  const diff = dayDiff(iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  const d = parseDate(iso);
  return d ? `${DAYFULL[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}` : String(iso);
}
// Due-date text + tone for a task row. tone: danger | warn | muted
export function dueInfo(iso) {
  if (!iso) return { text: 'No due date', tone: 'muted' };
  const diff = dayDiff(iso);
  if (diff < 0) return { text: diff === -1 ? 'Yesterday' : `${-diff} days ago`, tone: 'danger' };
  if (diff === 0) return { text: 'Today', tone: 'danger' };
  if (diff === 1) return { text: 'Tomorrow', tone: 'warn' };
  const d = parseDate(iso);
  return { text: `${d.getDate()} ${MON[d.getMonth()]}`, tone: 'muted' };
}
