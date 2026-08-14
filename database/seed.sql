-- =====================================================================
--  ProjectHub — Seed data
--  password_hash = bcrypt('password123'). Ganti sebelum production.
--  Run SETELAH schema.sql:  psql -U postgres -d projecthub -f seed.sql
-- =====================================================================

INSERT INTO users (full_name,email,password_hash,role,department,avatar_init) VALUES
 ('Hanif Mu''taz','hanif.mutaz@hirose-gl.com','$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrq4pR4Yb9wS0qF2yXqg6Q0m3jKcE6u','admin','Kaizen','HM'),
 ('Triana','triana@hirose-gl.com','$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrq4pR4Yb9wS0qF2yXqg6Q0m3jKcE6u','owner','IT','TR'),
 ('Team IT','team.it@hirose-gl.com','$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrq4pR4Yb9wS0qF2yXqg6Q0m3jKcE6u','member','IT','IT'),
 ('Management','mgmt@hirose-gl.com','$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrq4pR4Yb9wS0qF2yXqg6Q0m3jKcE6u','viewer','Direksi','MG');

INSERT INTO projects (project_code,name,description,category,owner_id,sponsor,objectives,start_date,target_date,priority,status) VALUES
 ('P001','Monitoring PM Excel','Trial monitoring PM berbasis Excel + VBA','Trial',1,'Management','Otomasi laporan PM per-short, monthly & weekly','2026-04-01','2026-05-06','high','execution'),
 ('P002','Monitoring PM Web Dashboard','Versi web dari monitoring PM (ProjectHub)','Dev',1,'Management','Single source of truth berbasis web','2026-05-01','2026-07-30','high','execution'),
 ('P005','Dashboard PCB ConMas','Connected Master System - Form PCB, BI, Motion Board','Trial',2,'Management','Dashboard PCB terintegrasi BI','2026-04-01','2026-06-30','high','planning');

INSERT INTO project_members (project_id,user_id,role_in_proj) VALUES
 (1,1,'owner'),(1,4,'viewer'),(2,1,'owner'),(2,3,'member'),(3,2,'owner'),(3,1,'member'),(3,4,'viewer');

INSERT INTO milestones (project_id,name,description,owner_id,target_date,status,progress,sort_order) VALUES
 (1,'M1 - Planning','Analisa kebutuhan & desain template',1,'2026-04-15','done',100,1),
 (1,'M2 - Development','Develop VBA import & laporan',1,'2026-04-25','in_progress',80,2),
 (1,'M3 - Testing & Sign-off','Trial data real & review direktur',1,'2026-05-06','in_progress',30,3),
 (3,'M1 - Setup ConMas','Setup akses & form master',2,'2026-04-20','delayed',10,1);

INSERT INTO deliverables (project_id,milestone_id,name,description,owner_id,target_date,status,progress) VALUES
 (1,1,'Requirement & Template Excel','Spec field PM + template',1,'2026-04-15','done',100),
 (1,2,'VBA Report Engine','Import, parsing, generate laporan',1,'2026-04-25','in_progress',75),
 (1,3,'Validated PM Monitoring V1','Excel tervalidasi & disetujui direktur',1,'2026-05-06','in_progress',30);

INSERT INTO tasks (project_id,milestone_id,deliverable_id,task_code,title,category,pic_id,start_date,due_date,status,priority,progress,constraint_note,next_action) VALUES
 (1,1,1,'P001.1','Analisa kebutuhan data PM','Planning',1,'2026-04-01','2026-04-10','done','high',100,NULL,NULL),
 (1,1,1,'P001.2','Desain template Excel','Design',1,'2026-04-05','2026-04-15','done','high',100,NULL,NULL),
 (1,2,2,'P001.3','Develop VBA import & parsing','Dev',1,'2026-04-08','2026-04-20','done','high',100,NULL,NULL),
 (1,2,2,'P001.4','Develop VBA laporan per-short','Dev',1,'2026-04-15','2026-04-25','done','high',100,NULL,NULL),
 (1,2,2,'P001.5','Develop VBA laporan monthly & weekly','Dev',1,'2026-04-15','2026-05-06','in_progress','high',50,NULL,'Lanjut coding aggregate'),
 (1,3,3,'P001.6','Meeting request feature baru','Meeting',1,'2026-04-28','2026-05-06','in_progress','high',40,NULL,'Siapkan deck request'),
 (1,3,3,'P001.7','Trial & validasi data real','Testing',1,'2026-05-01','2026-05-06','in_progress','high',30,'Data belum matching manual','Cek hasil vs data manual'),
 (1,3,3,'P001.8','Review & sign-off ke direktur','Milestone',1,'2026-05-01','2026-05-06','in_progress','high',20,NULL,'Presentasi hasil trial'),
 (2,NULL,NULL,'P002.1','Desain arsitektur DB (PostgreSQL)','Design',1,'2026-05-01','2026-05-10','in_progress','high',40,NULL,'Finalisasi ERD'),
 (2,NULL,NULL,'P002.2','Setup DB & health engine','Dev',1,'2026-05-05','2026-05-20','not_started','high',0,NULL,NULL),
 (3,NULL,NULL,'P005.1','Setup Form Master PCB','Dev',2,'2026-04-15','2026-05-02','not_started','high',0,'Menunggu akses ConMas','Koordinasi IT');

INSERT INTO issues (project_id,task_id,title,description,severity,impact,status,owner_id,target_date,next_action) VALUES
 (1,7,'Data real belum matching hasil manual','Hasil VBA beda dgn manual','high','Validasi tertunda, sign-off berisiko mundur','open',1,'2026-05-04','Cek formula parsing vs manual'),
 (1,6,'Deck request feature belum siap','Materi meeting belum lengkap','medium','Meeting bisa mundur','open',1,'2026-05-05','Selesaikan deck'),
 (3,11,'Akses ConMas belum tersedia','Belum dapat kredensial','critical','Project tidak bisa mulai','open',2,'2026-04-28','Eskalasi ke IT infra');

INSERT INTO risks (project_id,title,description,probability,impact,owner_id,mitigation,status,target_date) VALUES
 (1,'Sign-off direktur mundur','Jika validasi gagal, review tertunda','high','high',1,'Buffer 3 hari + hasil validasi lengkap','mitigating','2026-05-06'),
 (2,'Scope creep fitur web','Permintaan fitur bertambah','medium','high',1,'Lock scope MVP, backlog phase 2','identified','2026-06-01');

INSERT INTO actions (project_id,title,owner_id,due_date,priority,status,related_issue,related_risk) VALUES
 (1,'Bandingkan output VBA vs manual per short',1,'2026-05-04','high','in_progress',1,1),
 (1,'Finalisasi deck request feature',1,'2026-05-05','medium','open',2,NULL),
 (2,'Kunci scope MVP & buat backlog phase 2',1,'2026-05-30','high','open',NULL,2);

INSERT INTO decisions (project_id,title,description,made_by,decided_at,reason,impact,related_risk) VALUES
 (2,'Gunakan PostgreSQL sebagai database','Pilih PostgreSQL vs MySQL',1,'2026-05-02','Dukungan view/trigger & JSON kuat','Health engine & audit mudah',2),
 (1,'Sign-off ditunda 3 hari jika validasi <100%','Buffer untuk kualitas',1,'2026-05-01','Hindari sign-off data belum valid','Timeline mundur maks 3 hari',NULL);

INSERT INTO approvals (project_id,entity_type,entity_id,entity_label,title,requested_by,approver_id,status,request_note,requested_at,decided_at,decision_note) VALUES
 (1,'milestone',2,'M2 - Development','Sign-off Milestone M2 - Development',1,4,'pending','Mohon review hasil development','2026-08-13 15:00+07',NULL,NULL),
 (1,'deliverable',2,'VBA Report Engine','Acceptance VBA Report Engine',1,4,'approved','Sesuai spec','2026-08-10 09:00+07','2026-08-11 10:30+07','Sesuai spec, lanjut');

INSERT INTO progress_history (entity_type,entity_id,project_id,prev_progress,new_progress,delta,changed_by,note,changed_at) VALUES
 ('task',7,1,0,10,10,1,'Mulai trial','2026-05-01 09:00+07'),
 ('task',7,1,10,20,10,1,'Setup data real','2026-05-02 10:00+07'),
 ('task',7,1,20,30,10,1,'Cek batch pertama','2026-05-03 14:00+07'),
 ('task',5,1,0,25,25,1,'Skeleton aggregate','2026-04-20 11:00+07'),
 ('task',5,1,25,50,25,1,'Monthly report jalan','2026-04-28 16:00+07');

-- hitung health awal semua project
SELECT fn_refresh_all_health();
