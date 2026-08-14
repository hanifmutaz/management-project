// Menyusun payload lengkap 1 project untuk Excel/PDF report & Evidence Pack.
// Bentuk output cocok dengan excel_report.py (SAMPLE_DATA schema).
import { query } from '../db.js';

const d = (x) => x ? new Date(x).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '';

export async function buildReportData(projectId) {
  const P = (await query(`SELECT p.*, u.full_name owner FROM projects p LEFT JOIN users u ON u.id=p.owner_id WHERE p.id=$1`, [projectId])).rows[0];
  if (!P) throw new Error('Project not found');
  const stats = (await query(`SELECT * FROM v_project_stats WHERE id=$1`, [projectId])).rows[0];

  const ms  = (await query(`SELECT m.*, u.full_name owner FROM milestones m LEFT JOIN users u ON u.id=m.owner_id WHERE project_id=$1 ORDER BY sort_order`, [projectId])).rows;
  const del = (await query(`SELECT d.*, u.full_name owner, m.name ms FROM deliverables d LEFT JOIN users u ON u.id=d.owner_id LEFT JOIN milestones m ON m.id=d.milestone_id WHERE d.project_id=$1`, [projectId])).rows;
  const tasks = (await query(`SELECT t.*, u.full_name pic FROM tasks t LEFT JOIN users u ON u.id=t.pic_id WHERE project_id=$1 ORDER BY task_code`, [projectId])).rows;
  const issues = (await query(`SELECT i.*, u.full_name owner FROM issues i LEFT JOIN users u ON u.id=i.owner_id WHERE project_id=$1`, [projectId])).rows;
  const risks  = (await query(`SELECT r.*, u.full_name owner FROM risks r LEFT JOIN users u ON u.id=r.owner_id WHERE project_id=$1`, [projectId])).rows;
  const ph = (await query(`SELECT h.*, u.full_name by_name FROM progress_history h LEFT JOIN users u ON u.id=h.changed_by WHERE project_id=$1 ORDER BY changed_at`, [projectId])).rows;
  const audit = (await query(`SELECT a.*, u.full_name uname FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE project_id=$1 ORDER BY created_at DESC LIMIT 200`, [projectId])).rows;

  return {
    period: `${d(P.start_date)} – ${d(P.target_date)}`,
    project: {
      code: P.project_code, name: P.name, category: P.category, owner: P.owner,
      sponsor: P.sponsor, start: d(P.start_date), target: d(P.target_date),
      status: P.status, priority: P.priority,
      kpi: {
        progress: stats?.avg_progress ?? 0, health: P.health, health_reason: P.health_reason,
        open_issues: stats?.open_issues ?? 0, high_risks: stats?.high_risks ?? 0,
        overdue: stats?.overdue_tasks ?? 0, ms_done: ms.filter(m=>m.status==='done').length,
      },
    },
    milestones: ms.map(m => ({ name:m.name, owner:m.owner, target:d(m.target_date), progress:+m.progress, status:m.status })),
    deliverables: del.map(x => ({ name:x.name, milestone:x.ms, owner:x.owner, target:d(x.target_date), progress:+x.progress, status:x.status })),
    tasks: tasks.map(t => ({ code:t.task_code, title:t.title, pic:t.pic, status:t.status, progress:+t.progress,
                             health:t.health, due:d(t.due_date), constraint:t.constraint_note, next_action:t.next_action })),
    issues_risks: [
      ...issues.map(i => ({ type:'Issue', title:i.title, severity:i.severity, impact:i.impact, probability:'',
                            owner:i.owner, status:i.status, target:d(i.target_date), next_action:i.next_action })),
      ...risks.map(r => ({ type:'Risk', title:r.title, severity:r.severity, impact:r.impact, probability:r.probability,
                           owner:r.owner, status:r.status, target:d(r.target_date), next_action:r.mitigation })),
    ],
    progress_history: ph.map(h => ({ date:new Date(h.changed_at).toLocaleString('id-ID'), entity:h.entity_type+' #'+h.entity_id,
                                     prev:+h.prev_progress, new:+h.new_progress, delta:+h.delta, by:h.by_name, comment:h.note })),
    audit: audit.map(a => ({ date:new Date(a.created_at).toLocaleString('id-ID'), user:a.uname, action:a.action,
                             entity:a.entity_ref||a.entity_type, field:a.field, prev:a.prev_value, new:a.new_value })),
  };
}
