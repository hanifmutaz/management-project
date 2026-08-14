// Export client-side sederhana. Untuk report .xlsx 7-sheet gunakan endpoint backend.
import { healthLabel, statusLabel, num } from './format.js';

function save(content, filename, mime) {
  const b = new Blob([content], { type: mime });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = filename; a.click();
  URL.revokeObjectURL(u);
}
export function exportPortfolio(projects, fmt = 'csv', scope = 'portfolio') {
  const rows = [['Code', 'Project', 'Owner', 'Progress', 'Health', 'Status'],
    ...projects.map(p => [p.project_code, p.name, p.owner, num(p.avg_progress) + '%', healthLabel[p.health] || p.health, statusLabel(p.status)])];
  if (fmt === 'csv') {
    save('\ufeff' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n'), `ProjectHub_${scope}.csv`, 'text/csv');
  } else if (fmt === 'json') {
    save(JSON.stringify({ generated_at: new Date().toISOString(), scope, projects }, null, 2), `ProjectHub_${scope}.json`, 'application/json');
  } else {
    const th = rows[0].map(x => `<th style="background:#2F55D4;color:#fff">${x}</th>`).join('');
    const body = rows.slice(1).map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('');
    save(`<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><h3>ProjectHub — ${scope}</h3><table border="1"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></body></html>`, `ProjectHub_${scope}.xls`, 'application/vnd.ms-excel');
  }
}
