-- =====================================================================
--  MUTAZ OS — Seed Riwayat Project Nyata
--  Isi project-project yang udah pernah lu bikin sebelum Mutaz OS ada.
--
--  CARA PAKE (clean start, dari nol):
--    psql -U postgres -d mutaz_os -f database/schema.sql        -- drop & recreate semua tabel
--    psql -U postgres -d mutaz_os -f database/seed_history.sql  -- isi data asli lu
--    -- (skip seed.sql — itu cuma data demo/contoh, bukan punya lu)
--
--  Catatan: hours di work_logs & tanggal-tanggal di sini masih placeholder kasar.
--  Edit manual dulu kalau lu inget tanggal/jam yang lebih akurat, atau biarin
--  aja terus mulai catat log harian yang baru dari sekarang.
-- =====================================================================

BEGIN;

-- ═══════════════════════ KANTOR (karyawan, PT Hirose) ═══════════════════════

-- ── 1) Dashboard ConMas ───────────────────────────────────────────────
INSERT INTO projects (name,type,status,description,client_name,rate_type,rate,currency,color,tags,notes,pinned,start_date,last_activity)
VALUES (
  'Dashboard ConMas',
  'office','active',
  'Production monitoring system multi-lokasi (Internal/Hirose, SGP, Systech) dengan Master instance yang agregasi data dari backend subcontractor via /api/external/*.',
  'PT Hirose Electric Indonesia','none',0,'IDR','#6b9bff',
  ARRAY['react','express','postgresql','monitoring'],
  'Repo: github.com/hirose-idn/Dashboard-ConMas. Instance isolation pakai IS_INTERNAL_INSTANCE & TEMPAT_LABEL. Diagram rendering via mmdc + headless Chrome (hex color wajib hardcode). Ada shared getNowWIB() helper buat konsistensi timezone.',
  TRUE, '2025-01-01', CURRENT_DATE
);
INSERT INTO tasks (project_id,title,status,priority) VALUES
 (currval('projects_id_seq'),'Setup arsitektur multi-lokasi (Internal/Hirose, SGP, Systech, Master aggregator)','done','high'),
 (currval('projects_id_seq'),'Build /api/external/* buat sinkron data dari backend subcontractor','done','high'),
 (currval('projects_id_seq'),'Isolasi instance via IS_INTERNAL_INSTANCE & TEMPAT_LABEL','done','medium'),
 (currval('projects_id_seq'),'Fix lineDiscoveryService.js hardcoded tempat bug','done','medium'),
 (currval('projects_id_seq'),'Fix PostgreSQL DATE timezone-shift via types.setTypeParser(1082)','done','medium'),
 (currval('projects_id_seq'),'Tambah shared getNowWIB() helper buat konsistensi timezone','done','medium'),
 (currval('projects_id_seq'),'Fix KPI cards yang narik dari state salah','done','medium'),
 (currval('projects_id_seq'),'Setup diagram rendering via mmdc + headless Chrome (puppeteer)','done','low'),
 (currval('projects_id_seq'),'Debug CREATE VIEW rollback pas insert data','doing','high'),
 (currval('projects_id_seq'),'Lanjutin maintenance & bugfix rutin','todo','medium');
INSERT INTO work_logs (project_id,log_date,description,hours,billable) VALUES
 (currval('projects_id_seq'),CURRENT_DATE-40,'Setup arsitektur multi-lokasi (Internal/Hirose, SGP, Systech, Master aggregator)',6,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-37,'Build /api/external/* buat sinkron data dari backend subcontractor',5,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-33,'Isolasi instance via IS_INTERNAL_INSTANCE & TEMPAT_LABEL',3,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-20,'Fix lineDiscoveryService.js hardcoded tempat bug',1.5,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-18,'Fix PostgreSQL DATE timezone-shift via types.setTypeParser(1082)',2,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-17,'Tambah shared getNowWIB() helper buat konsistensi timezone',1,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-10,'Fix KPI cards yang narik dari state salah',1.5,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-6,'Setup diagram rendering via mmdc + headless Chrome',3,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-1,'Debug CREATE VIEW rollback pas insert data (in progress)',2,FALSE);

-- ── 2) Monitoring-PM (Excel x VBA) — precursor, sebelum versi web ──────
INSERT INTO projects (name,type,status,description,client_name,rate_type,rate,currency,color,tags,notes,pinned,start_date,last_activity)
VALUES (
  'Monitoring-PM (Excel x VBA)',
  'office','done',
  'Sistem monitoring preventive maintenance berbasis Excel/VBA (Monitoring_PM_V4.xlsm) — cikal bakal sebelum dibikin versi web. Tracking PM Short (shot/cycle-based, per Drawing No + Line No) dan PM Monthly/Weekly (point-based).',
  'PT Hirose Electric Indonesia','none',0,'IDR','#f472b6',
  ARRAY['excel','vba','preventive-maintenance'],
  'Formula poin: 2+ CL No/hari = 1 poin, 1 CL No = 0.5 poin, PM ke-trigger di 30 poin. Digantikan oleh versi web (lihat project "Monitoring-PM (Web)" di Freelance).',
  FALSE, NULL, CURRENT_DATE - 200
);
INSERT INTO tasks (project_id,title,status,priority) VALUES
 (currval('projects_id_seq'),'Build tracking PM Short (shot/cycle-based, per Drawing No + Line No)','done','high'),
 (currval('projects_id_seq'),'Build tracking PM Monthly/Weekly point-based (2+ CL No/hari=1 poin, 1 CL No=0.5 poin, trigger 30 poin)','done','high'),
 (currval('projects_id_seq'),'Build sheet Dashboard','done','medium'),
 (currval('projects_id_seq'),'Build Helper sheets','done','low'),
 (currval('projects_id_seq'),'Build sheet History','done','medium'),
 (currval('projects_id_seq'),'Build UserForm buat input data PM','done','medium'),
 (currval('projects_id_seq'),'Rilis Monitoring_PM_V4.xlsm','done','low');
INSERT INTO work_logs (project_id,log_date,description,hours,billable) VALUES
 (currval('projects_id_seq'),CURRENT_DATE-210,'Build tracking PM Short (shot/cycle-based, per Drawing No + Line No)',5,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-205,'Build tracking PM Monthly/Weekly point-based',5,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-200,'Build sheet Dashboard',3,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-198,'Build Helper sheets',1.5,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-196,'Build sheet History',2,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-194,'Build UserForm buat input data PM',3,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-190,'Rilis Monitoring_PM_V4.xlsm',1,FALSE);

-- ── 3) Production Problem Board ─────────────────────────────────────────
-- Catatan: detail fitur belum lengkap di sisi gua — task di bawah masih
-- placeholder awal, tambahin/edit manual biar sesuai kondisi asli.
INSERT INTO projects (name,type,status,description,client_name,rate_type,rate,currency,color,tags,notes,pinned,start_date,last_activity)
VALUES (
  'Production Problem Board',
  'office','active',
  'Board buat tracking problem/issue produksi.',
  'PT Hirose Electric Indonesia','none',0,'IDR','#f87171',
  ARRAY['board','production'],
  'Repo: github.com/hanifmutaz/production-problem-board. Deskripsi & task masih minim — lengkapin manual.',
  FALSE, NULL, CURRENT_DATE - 10
);
INSERT INTO tasks (project_id,title,status,priority) VALUES
 (currval('projects_id_seq'),'Setup repo & struktur awal project','done','medium'),
 (currval('projects_id_seq'),'Lengkapi scope & fitur board','todo','high');
INSERT INTO work_logs (project_id,log_date,description,hours,billable) VALUES
 (currval('projects_id_seq'),CURRENT_DATE-10,'Setup repo & struktur awal project',1,FALSE);

-- ═══════════════════════ PERSONAL ═══════════════════════

-- ── 4) Premium Finance ────────────────────────────────────────────────
INSERT INTO projects (name,type,status,description,client_name,rate_type,rate,currency,color,tags,notes,pinned,start_date,last_activity)
VALUES (
  'Premium Finance',
  'personal','active',
  'Full-stack personal finance app: Transactions, Debts (installment + auto next_due_date), Goals, Wishlist, Receivables, Budget, Financial Health Score, Forecast.',
  NULL,'none',0,'IDR','#a586ff',
  ARRAY['nextjs','typescript','supabase','tailwind'],
  'Repo: github.com/hanifmutaz/premium-finance. Lagi diadaptasi jadi prototype Figma mobile (10 layar, UCD) buat tugas IMK.',
  FALSE, NULL, CURRENT_DATE - 5
);
INSERT INTO tasks (project_id,title,status,priority) VALUES
 (currval('projects_id_seq'),'Setup Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui + Supabase, deploy Vercel','done','high'),
 (currval('projects_id_seq'),'Full CRUD: Transactions, Debts, Goals, Wishlist, Receivables, Budget','done','high'),
 (currval('projects_id_seq'),'Trigger Postgres buat auto next_due_date di Debts','done','medium'),
 (currval('projects_id_seq'),'Financial Health Score feature','done','medium'),
 (currval('projects_id_seq'),'Forecast page pakai 3 bulan history','done','medium'),
 (currval('projects_id_seq'),'Recurring transactions via Edge Function','done','medium'),
 (currval('projects_id_seq'),'Web push notification (VAPID keys, Supabase Edge Functions)','done','medium'),
 (currval('projects_id_seq'),'PDF/Excel/CSV export','done','low'),
 (currval('projects_id_seq'),'Adaptasi ke prototype Figma mobile, 10 layar, metodologi UCD (tugas IMK)','doing','medium');
INSERT INTO work_logs (project_id,log_date,description,hours,billable) VALUES
 (currval('projects_id_seq'),CURRENT_DATE-60,'Setup Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase, deploy Vercel',4,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-55,'Full CRUD: Transactions, Debts, Goals, Wishlist, Receivables, Budget',10,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-50,'Trigger Postgres buat auto next_due_date di Debts',2,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-45,'Financial Health Score feature',3,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-40,'Forecast page pakai 3 bulan history',3,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-35,'Recurring transactions via Edge Function',3,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-30,'Web push notification (VAPID keys, Supabase Edge Functions)',2.5,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-20,'PDF/Excel/CSV export',3,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-5,'Adaptasi ke prototype Figma mobile (in progress)',4,FALSE);

-- ═══════════════════════ KAMPUS ═══════════════════════

-- ── 5) Inventaris Kantor ─────────────────────────────────────────────
INSERT INTO projects (name,type,status,description,client_name,rate_type,rate,currency,color,tags,notes,pinned,start_date,last_activity)
VALUES (
  'Inventaris Kantor',
  'personal','done',
  'Office inventory system, dikerjain buat UAS (final exam) mata kuliah Sistem Terintegrasi.',
  NULL,'none',0,'IDR','#fbbf24',
  ARRAY['codeigniter3','academic'],
  'Repo: github.com/hanifmutaz/inventaris-kantor.',
  FALSE, NULL, CURRENT_DATE - 60
);
INSERT INTO tasks (project_id,title,status,priority) VALUES
 (currval('projects_id_seq'),'Build sistem inventaris kantor (CodeIgniter 3)','done','medium'),
 (currval('projects_id_seq'),'Submit sebagai UAS Sistem Terintegrasi','done','low');
INSERT INTO work_logs (project_id,log_date,description,hours,billable) VALUES
 (currval('projects_id_seq'),CURRENT_DATE-65,'Build sistem inventaris kantor (CodeIgniter 3)',8,FALSE),
 (currval('projects_id_seq'),CURRENT_DATE-60,'Submit sebagai UAS Sistem Terintegrasi',1,FALSE);

-- ═══════════════════════ FREELANCE ═══════════════════════

-- ── 6) IGP Sales App ─────────────────────────────────────────────────
INSERT INTO projects (name,type,status,description,client_name,rate_type,rate,currency,color,tags,notes,pinned,start_date,last_activity)
VALUES (
  'IGP Sales App',
  'freelance','done',
  'Sales management app: PO, cicilan/termin, komisi entitas (Sales, Nego, Collector, KC), retur/loss, split biaya trip.',
  'Intergas Perdana','none',0,'IDR','#fb923c',
  ARRAY['nodejs','express','sales','commission'],
  'Repo: github.com/Hanif-Mutaz/IGP. Backend Node.js/Express + flat JSON database. Export Excel/PDF via Python (openpyxl/reportlab).',
  FALSE, NULL, CURRENT_DATE - 30
);
INSERT INTO tasks (project_id,title,status,priority) VALUES
 (currval('projects_id_seq'),'Setup backend Node.js/Express + flat JSON database','done','high'),
 (currval('projects_id_seq'),'Build PO & tracking cicilan/termin','done','high'),
 (currval('projects_id_seq'),'Logic komisi (Sales, Nego, Collector, KC)','done','high'),
 (currval('projects_id_seq'),'Handling retur/loss & split biaya trip','done','medium'),
 (currval('projects_id_seq'),'Export Excel/PDF via Python (openpyxl/reportlab)','done','medium');
INSERT INTO work_logs (project_id,log_date,description,hours,billable) VALUES
 (currval('projects_id_seq'),CURRENT_DATE-90,'Setup backend Node.js/Express + flat JSON database',3,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-85,'Build PO & tracking cicilan/termin',6,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-80,'Logic komisi (Sales, Nego, Collector, KC)',5,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-75,'Handling retur/loss & split biaya trip',4,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-70,'Export Excel/PDF via Python (openpyxl/reportlab)',3,TRUE);

-- ── 7) Monitoring-PM (Web) — versi web, dikerjain sebagai freelancer ────
INSERT INTO projects (name,type,status,description,client_name,rate_type,rate,currency,color,tags,notes,pinned,start_date,last_activity)
VALUES (
  'Monitoring-PM (Web)',
  'freelance','active',
  'Web app monitoring preventive maintenance (PM Short shot-based 113 part, PM Monthly/Weekly point-based 60 line), plus inventory & ROP, sinkron read-only dari ConMas DB. Penerus dari versi Excel/VBA.',
  'PT Hirose Electric Indonesia','none',0,'IDR','#3ddc97',
  ARRAY['react','express','postgresql','tailwind','preventive-maintenance'],
  'Repo: github.com/hanifmutaz/MonitoringPMReskin. Dikerjain sebagai freelancer/orang luar, bukan karyawan.',
  TRUE, '2025-06-01', CURRENT_DATE
);
INSERT INTO tasks (project_id,title,status,priority) VALUES
 (currval('projects_id_seq'),'Build auth JWT HttpOnly cookie + bcrypt + RBAC granular','done','high'),
 (currval('projects_id_seq'),'Build modul PM Part & PM Line monitoring','done','high'),
 (currval('projects_id_seq'),'Build Inventory & ROP (auto Safety Stock/Reorder Point calc)','done','high'),
 (currval('projects_id_seq'),'Build Master Data Import + CL Mapping (Part ↔ Change List/Drawing No)','done','medium'),
 (currval('projects_id_seq'),'Build email notification (Part DANGER/Inventory ORDER, anti-spam delay)','done','medium'),
 (currval('projects_id_seq'),'Build append-only audit log + User Management (self-register + admin approval)','done','medium'),
 (currval('projects_id_seq'),'ConMas sync adapter (Fase 3) via node-cron, skip graceful kalau creds belum ada','done','high'),
 (currval('projects_id_seq'),'Reskin infra: Tailwind v4 + shadcn/ui base, Login/Register, KpiCard, StatusBadge, LineStatusDonut, CriticalAlertsPanel, GanttUpcomingPanel','done','medium'),
 (currval('projects_id_seq'),'Reskin: Sidebar (+ icon-collapse), Topbar, DashboardPage layout','done','medium'),
 (currval('projects_id_seq'),'Reskin: Master Data tables & PM Part/Line pages','doing','high'),
 (currval('projects_id_seq'),'Reskin: User Management & Settings pages','todo','medium'),
 (currval('projects_id_seq'),'Barcode scan Drawing No buat Field Replacement form (iPad)','todo','low'),
 (currval('projects_id_seq'),'Wajibin parts.inventory_item_id biar PM history + stock-out selalu 1 transaksi','todo','low');
INSERT INTO work_logs (project_id,log_date,description,hours,billable) VALUES
 (currval('projects_id_seq'),CURRENT_DATE-70,'Build auth JWT HttpOnly cookie + bcrypt + RBAC granular',5,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-65,'Build modul PM Part & PM Line monitoring',8,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-60,'Build Inventory & ROP (auto Safety Stock/Reorder Point calc)',6,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-55,'Build Master Data Import + CL Mapping',4,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-50,'Build email notification (Part DANGER/Inventory ORDER)',3,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-45,'Build append-only audit log + User Management',4,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-40,'ConMas sync adapter (Fase 3) via node-cron',5,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-25,'Reskin infra: Tailwind v4 + shadcn/ui base + komponen kecil',6,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-15,'Reskin: Sidebar, Topbar, DashboardPage layout',5,TRUE),
 (currval('projects_id_seq'),CURRENT_DATE-2,'Reskin: Master Data tables & PM Part/Line pages (in progress)',3,TRUE);

COMMIT;
