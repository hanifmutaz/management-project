-- =====================================================================
--  MUTAZ OS — Seed contoh
--  Run SETELAH schema.sql:  psql -U postgres -d mutaz_os -f seed.sql
-- =====================================================================

INSERT INTO projects (name,type,status,description,client_name,rate_type,rate,currency,color,tags,pinned,start_date,due_date,last_activity) VALUES
 ('Monitoring PM Web (Kantor)','office','active','Dashboard monitoring PM di kantor',NULL,'none',0,'IDR','#5b8cff',ARRAY['react','postgres'],TRUE,'2026-05-01','2026-07-30',CURRENT_DATE),
 ('Landing Page UMKM','freelance','active','Company profile + landing untuk klien','Toko Berkah','fixed',3500000,'IDR','#34d399',ARRAY['web','nextjs'],TRUE,'2026-07-20','2026-08-25',CURRENT_DATE - 2),
 ('Bot WhatsApp Reminder','freelance','active','Bot reminder pembayaran, dibayar per jam','CV Maju Jaya','hourly',150000,'IDR','#fb923c',ARRAY['node','automation'],FALSE,'2026-08-01','2026-08-30',CURRENT_DATE - 1),
 ('Ngajar Coding (Part-time)','parttime','active','Mentor coding tiap Sabtu','Kampus XYZ','hourly',120000,'IDR','#9b6bff',ARRAY['teaching'],FALSE,'2026-06-01',NULL,CURRENT_DATE - 6),
 ('Belajar Rust','personal','active','Personal project belajar Rust',NULL,'none',0,'IDR','#fbbf24',ARRAY['learning','rust'],FALSE,'2026-07-01',NULL,CURRENT_DATE - 9);

INSERT INTO tasks (project_id,title,status,priority,due_date,tags) VALUES
 (1,'Setup schema PostgreSQL','done','high','2026-05-10',ARRAY['db']),
 (1,'Bikin REST API','doing','high','2026-06-10',ARRAY['backend']),
 (1,'Develop dashboard React','todo','high','2026-07-01',ARRAY['frontend']),
 (2,'Desain wireframe','done','high','2026-07-25',NULL),
 (2,'Slicing HTML/CSS','doing','high','2026-08-10',NULL),
 (2,'Integrasi form kontak','todo','medium','2026-08-20',NULL),
 (3,'Setup Baileys / WA gateway','doing','high','2026-08-12',NULL),
 (3,'Logic reminder terjadwal','todo','high','2026-08-25',NULL),
 (4,'Siapin materi minggu ini','todo','medium','2026-08-16',NULL),
 (5,'Baca ownership & borrowing','doing','low',NULL,ARRAY['rust']);

INSERT INTO work_logs (project_id,task_id,log_date,description,hours,billable) VALUES
 (1,2,CURRENT_DATE,'Coding endpoint projects & tasks',3.5,FALSE),
 (1,2,CURRENT_DATE - 1,'Setup Express + koneksi DB',2.0,FALSE),
 (2,5,CURRENT_DATE - 2,'Slicing hero section + navbar',4.0,TRUE),
 (3,7,CURRENT_DATE - 1,'Riset library WA gateway',2.5,TRUE),
 (3,7,CURRENT_DATE,'Setup koneksi WA + tes kirim pesan',3.0,TRUE),
 (4,9,CURRENT_DATE - 3,'Ngajar materi array & function',2.0,TRUE),
 (5,10,CURRENT_DATE - 9,'Baca bab ownership Rust',1.5,FALSE);

INSERT INTO payments (project_id,label,amount,currency,status,invoice_date,paid_date) VALUES
 (2,'DP 50% Landing Page',1750000,'IDR','paid','2026-07-22','2026-07-24'),
 (2,'Pelunasan 50%',1750000,'IDR','unpaid','2026-08-25',NULL),
 (3,'Termin Agustus (est.)',825000,'IDR','unpaid',NULL,NULL),
 (4,'Honor ngajar Juli',960000,'IDR','paid','2026-08-01','2026-08-05');
