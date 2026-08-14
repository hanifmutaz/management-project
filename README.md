# 🗂 ProjectHub — Full-Stack
### Project Management, Monitoring & Reporting Platform
> **Update once. Track everything. Report instantly.** — *Every project update becomes evidence.*

Satu paket lengkap: **Frontend (React)** ↔ **Backend (Express)** ↔ **Database (PostgreSQL)**.
FE sekarang **beneran nyambung ke PostgreSQL** lewat REST API (bukan localStorage).
Single source of truth = database.

---

## 📁 Struktur
```
projecthub/
├── database/
│   ├── schema.sql      # tabel, enum, views, HEALTH ENGINE, triggers (audit, notif, approval)
│   └── seed.sql        # data contoh (users, P001/P002/P005, dst)
├── backend/            # Node.js + Express + JWT
│   └── src/
│       ├── server.js  db.js
│       ├── middleware/auth.js
│       └── routes/  auth · projects · entities · dashboard · evidence · approvals · notifications
└── frontend/           # React + Vite (nyambung ke /api)
    └── src/
        ├── lib/  api.js (⭐ semua fetch ke backend) · store.jsx (cache+orchestrate) · format.js
        ├── components/  Icon · ui · Modal · Layout · Login
        ├── modals/Forms.jsx
        └── pages/  Overview · Projects · ProjectDetail · MyTasks · IssuesRisks · Approvals · Analytics · Reports · Evidence
```

---

## 🚀 Cara jalanin (urut: DB → BE → FE)

### 1. Database
```bash
createdb -U postgres projecthub
psql -U postgres -d projecthub -f database/schema.sql
psql -U postgres -d projecthub -f database/seed.sql
```
> Error `database "projecthub" does not exist`? Berarti `createdb` belum jalan.

### 2. Backend
```bash
cd backend
cp .env.example .env         # isi DATABASE_URL & JWT_SECRET
npm install
npm run dev                  # http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```
Vite otomatis **proxy `/api` → http://localhost:4000** (lihat vite.config.js).

### Login
Buka http://localhost:5173 → login pakai seed:
```
Email    : hanif.mutaz@hirose-gl.com
Password : password123
```
> ⚠️ Ganti password_hash di seed sebelum production.

---

## 🔌 Bagaimana FE ↔ BE nyambung
- **Semua data lewat `frontend/src/lib/api.js`** → `fetch('/api/...')` dengan header `Authorization: Bearer <JWT>`.
- **`store.jsx` bukan penyimpan data** — dia cache + orchestrator: tiap aksi (create/update/delete) panggil API, lalu **refetch** dari DB, lalu re-render.
- Health, audit trail, progress history, notifikasi, approval → **semua dihitung di PostgreSQL** (view + trigger). FE cuma menampilkan.

Jadi kalau buka dari 2 browser/laptop, datanya **sama** (dari DB), bukan kepisah di masing-masing browser.

---

## ✨ Fitur
- **CRUD penuh** (Project, Task, Milestone, Deliverable, Issue, Risk, Action, Decision) — create/edit/delete + validasi + konfirmasi.
- **Health Engine** rule-based di DB (`fn_compute_project_health`) → health **+ alasan**, auto-refresh tiap perubahan.
- **Notifications** 🔔 — trigger DB kirim notif (task overdue, critical issue, approval).
- **Approval Workflow** ⚖️ — request → approve/reject; milestone approved auto-Done; tercatat di evidence.
- **Evidence Center** — view `v_evidence` gabungkan progress/issue/risk/decision/approval, traceable.
- **Reports & Analytics**, **Export** (CSV/Excel/JSON), **Login/JWT**, **dark/light**, **responsive**.

---

## 🔐 REST API (ringkas)
```
POST   /api/auth/login
GET    /api/auth/users
GET    /api/dashboard
GET    /api/projects            GET /api/projects/:id     POST/PUT/DELETE /api/projects[/:id]
POST/PUT/DELETE /api/tasks|milestones|deliverables|issues|risks|actions|decisions[/:id]
GET    /api/evidence?project_id=&etype=&user=
GET    /api/approvals?status=   POST /api/approvals   PATCH /api/approvals/:id/decide
GET    /api/notifications       PATCH /api/notifications/:id/read   PATCH /api/notifications/read-all
```

---

## ✅ Catatan (tahap developer, belum production-hardened)
- Sudah divalidasi: semua JSX parse & transpile clean, semua import resolve.
- Belum ada: unit test, refresh-token, rate-limit, file upload, websocket real-time.
- `bcrypt` hash di seed = `password123`. Ganti untuk semua user sebelum dipakai beneran.

Dibuat untuk Hanif Mu'taz · Kaizen Section
