# ⌘ MUTAZ OS
### Personal Work Operating System
> Catat semua yang lu kerjain — kantor, freelance, part-time, personal. Jam, task, income kerecord otomatis.

Personal work tracker buat 1 orang (lu), **no login**, jalan di laptop.
Stack: **PostgreSQL + Express + React (Vite)**.

---

## 🚀 Jalanin (urut: DB → BE → FE)
```bash
# 1. Database
createdb -U postgres mutaz_os
psql -U postgres -d mutaz_os -f database/schema.sql
psql -U postgres -d mutaz_os -f database/seed.sql

# 2. Backend
cd backend && cp .env.example .env   # isi DATABASE_URL
npm install && npm run dev           # http://localhost:4000

# 3. Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```
Buka `localhost:5173` — langsung masuk, **tanpa login**. (Shortcut: dari `backend`, `npm run db:init`.)

---

## ✨ Yang di-upgrade di UI/UX (vs WorkTracker)

| Fitur | Detail |
|---|---|
| **⌘ Command Palette** | Tekan **Ctrl/Cmd + K** — cari aksi, halaman, project. Ala Linear/Raycast. |
| **⚡ Quick Log Bar** | Di Dashboard: ketik apa yang dikerjain → **Enter** langsung tercatat. Aksi tersering jadi 1 detik. |
| **⌨️ Keyboard Shortcuts** | `g d/p/t/w/f/a` navigasi cepat · `n` catat kerjaan · `Ctrl+K` palette · `Esc` tutup |
| **🔥 Streak** | "5 hari beruntun" — motivasi konsistensi (dihitung di DB). |
| **📈 KPI Delta** | Jam minggu ini nampilin **+/-% vs minggu lalu**, bukan angka telanjang. |
| **👋 Greeting** | "Selamat pagi/siang/sore/malam, Mu'taz" — personal, time-aware. |
| **💀 Skeleton Loading** | Bukan spinner polos — layout ghost biar ga "kedip". |
| **📌 Pin Project** | Pin project penting ke atas. |
| **🎨 Color Swatch Picker** | Pilih warna project dari palet (bukan color input jelek). |
| **📊 Progress bar** di card | Card project nampilin % task selesai. |
| **✨ Empty state ber-CTA** | Kosong → langsung ada tombol aksi, ga cuma teks. |
| **📱 FAB mobile** | Tombol floating "catat kerjaan" di mobile. |
| **🌗 Dark/Light** | Toggle, tersimpan. Palet warna direfine (lebih deep & kontras). |

---

## 🧩 Halaman
- **Dashboard** — greeting, streak, quick-log bar, KPI (jam hari ini/minggu + delta, task, income), chart 14 hari (hari ini di-highlight), jam per konteks, kerjaan terakhir, due minggu ini, project mangkrak, tagihan belum dibayar
- **Projects** — card (warna, pin, progress %, jam, income, staleness), filter segmented
- **Project Detail** — tabs: Tasks (klik-toggle), Work Log, Payments, Notes
- **Tasks** — grouped Doing/Todo/Done, quick-toggle
- **Work Log** ⭐ — timeline per hari + total jam, export CSV
- **Finance** — income, unpaid, tandai lunas 1-klik, export
- **Analytics** — jam per konteks, income per bulan, top project

---

## 🗄 Data model (4 tabel)
`projects` · `tasks` · `work_logs` (⭐ jantung) · `payments`
+ views (summary, dashboard, hours-by-day/type) + `fn_streak()` + trigger (last_activity, done_at).

## 🔌 API (no auth)
```
GET  /api/dashboard   /api/dashboard/analytics
CRUD /api/projects[/:id]   PATCH /:id/pin
CRUD /api/tasks[/:id]      PATCH /:id/status
CRUD /api/worklogs[/:id]
CRUD /api/payments[/:id]   PATCH /:id/paid
```

---

## ✅ Catatan
- Divalidasi: 19 file JSX parse+transpile clean, semua import resolve, backend clean.
- **No auth by design** — jangan host public tanpa proteksi (data income kebuka).
- Belum ada: timer live start/stop, PWA/offline. By design tahap ini.

Dibuat buat Hanif Mu'taz · personal use
