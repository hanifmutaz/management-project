// Health Engine (mirror dari fn_compute_project_health di DB).
// Dipakai backend untuk menghitung/menjelaskan health project secara real-time,
// mengembalikan { health, reason } — health BUKAN cuma progress.
import { query } from '../db.js';

export async function computeProjectHealth(projectId) {
  const q = async (sql) => (await query(sql, [projectId])).rows[0];

  const overdue    = +(await q(`SELECT COUNT(*) n FROM tasks WHERE project_id=$1 AND due_date<CURRENT_DATE AND status<>'done'`)).n;
  const critIssue  = +(await q(`SELECT COUNT(*) n FROM issues WHERE project_id=$1 AND severity='critical' AND status NOT IN ('resolved','closed')`)).n;
  const highIssue  = +(await q(`SELECT COUNT(*) n FROM issues WHERE project_id=$1 AND severity='high' AND status NOT IN ('resolved','closed')`)).n;
  const overdueMs  = +(await q(`SELECT COUNT(*) n FROM milestones WHERE project_id=$1 AND target_date<CURRENT_DATE AND status<>'done'`)).n;
  const avg        = +(await q(`SELECT COALESCE(AVG(progress),0) v FROM tasks WHERE project_id=$1`)).v;
  const elapsed    = +(await q(`SELECT CASE WHEN target_date>start_date THEN
                    LEAST(100,GREATEST(0,(CURRENT_DATE-start_date)::numeric/NULLIF(target_date-start_date,0)*100)) ELSE 0 END v
                    FROM projects WHERE id=$1`)).v;

  const reasons = [];
  let health = 'on_track';
  const bump = (to) => { const order = { on_track:0, watch:1, at_risk:2, critical:3 };
    if (order[to] > order[health]) health = to; };

  if (critIssue > 0) { health = 'critical'; reasons.push(`${critIssue} critical issue`); }
  if (overdueMs > 0) { bump('at_risk'); reasons.push(`${overdueMs} overdue milestone`); }
  if (overdue   > 0) { bump('at_risk'); reasons.push(`${overdue} overdue task${overdue>1?'s':''}`); }
  if (highIssue > 0) { bump('watch');   reasons.push(`${highIssue} high-impact issue`); }
  if (elapsed - avg >= 25) { bump('watch');
    reasons.push(`schedule variance ${Math.round(elapsed-avg)}% (waktu ${Math.round(elapsed)}% vs progress ${Math.round(avg)}%)`); }
  if (!reasons.length) reasons.push('No blocking issues, on schedule');

  return { health, reason: reasons.join(' · ') };
}

// refresh & simpan health ke tabel projects
export async function refreshProjectHealth(projectId) {
  const { health, reason } = await computeProjectHealth(projectId);
  await query(`UPDATE projects SET health=$2, health_reason=$3, updated_at=now() WHERE id=$1`,
              [projectId, health, reason]);
  return { health, reason };
}
