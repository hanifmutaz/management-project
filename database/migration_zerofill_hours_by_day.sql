-- =====================================================================
--  Migration: zero-fill v_hours_by_day
--  Sebelumnya view cuma GROUP BY log_date, jadi kalau ada hari yang
--  beneran ga ada log sama sekali, harinya ga muncul di hasil query.
--  Efeknya chart "Jam Kerja 14 Hari" di Dashboard bisa nampilin kurang
--  dari 14 kolom / tanggalnya loncat.
--  Sekarang selalu return 14 baris (hari ini - 13 s/d hari ini),
--  hari kosong otomatis jadi 0 jam.
--  Run: psql -U postgres -d mutaz_os -f database/migration_zerofill_hours_by_day.sql
-- =====================================================================
CREATE OR REPLACE VIEW v_hours_by_day AS
SELECT d::date AS log_date, COALESCE(SUM(w.hours), 0) AS hours
FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d
LEFT JOIN work_logs w ON w.log_date = d::date
GROUP BY d ORDER BY d;
