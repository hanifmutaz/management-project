-- =====================================================================
--  Migration: fix v_dashboard nyampur currency pas SUM(amount)
--  Sebelumnya unpaid_total & income_this_month jumlahin SEMUA currency
--  jadi satu angka (IDR + USD + SGD ketambah kayak nilainya sama).
--  Sekarang cuma jumlahin payment IDR (konsisten sama halaman Finance).
--  Run: psql -U postgres -d mutaz_os -f database/migration_fix_dashboard_currency.sql
-- =====================================================================
CREATE OR REPLACE VIEW v_dashboard AS
SELECT
  (SELECT COUNT(*) FROM projects WHERE status='active')                                                 AS active_projects,
  (SELECT COUNT(*) FROM tasks WHERE status<>'done')                                                     AS open_tasks,
  (SELECT COUNT(*) FROM tasks WHERE status<>'done' AND due_date < CURRENT_DATE)                         AS overdue_tasks,
  (SELECT COALESCE(SUM(hours),0) FROM work_logs WHERE log_date >= date_trunc('week', CURRENT_DATE))     AS hours_this_week,
  (SELECT COALESCE(SUM(hours),0) FROM work_logs WHERE log_date >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days'
     AND log_date < date_trunc('week', CURRENT_DATE))                                                   AS hours_last_week,
  (SELECT COALESCE(SUM(hours),0) FROM work_logs WHERE log_date = CURRENT_DATE)                          AS hours_today,
  (SELECT COALESCE(SUM(hours),0) FROM work_logs WHERE log_date >= date_trunc('month', CURRENT_DATE))    AS hours_this_month,
  (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status<>'paid' AND currency='IDR')                AS unpaid_total,
  (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid' AND currency='IDR'
     AND paid_date >= date_trunc('month', CURRENT_DATE))                                                AS income_this_month;
