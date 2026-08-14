# ProjectHub — Phase 2: Notifications + Approval Workflow

Dokumen ini menjelaskan dua fitur governance yang ditambahkan di Phase 2, plus perbaikan
**CRUD penuh** dan **icon set yang calm** (SVG line, gaya Lucide) pada demo UI.

---

## 1. Icon set (calm, bukan emoji norak)
Semua emoji diganti **inline SVG line icon** (stroke 1.7px, minimalis, konsisten).
Tersimpan sebagai sprite `<symbol>` di atas `<body>`, dipanggil via `<use href="#i-...">`.
Contoh: `i-grid, i-folder, i-check-sq, i-alert, i-bell, i-gavel, i-shield, i-trend, ...`

---

## 2. CRUD penuh (create · edit · delete · persist)
Sekarang semua entity benar-benar bisa dikelola, bukan cuma toast:
- **Create** — form modal dengan validasi field wajib (border merah bila kosong).
- **Edit** — tiap baris tabel & project card punya tombol edit (form terisi data lama).
- **Delete** — tombol hapus + **dialog konfirmasi**; hapus project ikut membersihkan
  task/milestone/issue/dst milik project itu (cascade di UI).
- **Persist** — state disimpan di `localStorage` (`ph_state`), jadi tidak hilang saat refresh.
- Entity ber-CRUD: Project, Task, Milestone, Deliverable, Issue, Risk, Action, Decision.
- Health & progress project **dihitung ulang otomatis** tiap ada perubahan (health engine).

> Tombol **+ Add** di Project Detail bersifat *context-aware* — labelnya menyesuaikan tab aktif
> (Tasks → Task, Milestones → Milestone, Issues → Issue, dst).

---

## 3. Notifications 🔔
Sistem aktif memberi tahu user, bukan user yang harus cek manual.

### Pemicu (demo + backend trigger)
| Kejadian | Penerima | Contoh |
|---|---|---|
| Task di-assign | PIC | "Task baru di P002: Setup DB" |
| Task jadi overdue | PIC | "P001.7 overdue (06 Mei)" |
| Issue **critical** dibuat | Semua anggota project | "Critical issue di P005: Akses ConMas" |
| Approval dibuat | Approver | "Approval menunggu: Sign-off M2" |
| Approval diputuskan | Requester | "Sign-off M2 → Approved" |

### UI
- Lonceng di header dengan **titik merah** bila ada unread.
- Panel dropdown: daftar notif, warna & icon per jenis, tombol *"Tandai sudah dibaca"*.
- Badge angka di menu **Approvals** (jumlah pending).

### Backend
`GET /api/notifications` · `GET /api/notifications/count` ·
`PATCH /api/notifications/:id/read` · `PATCH /api/notifications/read-all`
Trigger DB: `fn_notify`, `fn_notify_project`, `trg_notify_task/issue/approval` (lihat `schema_phase2.sql`).

---

## 4. Approval Workflow ⚖️
Governance: hal penting tidak bisa "selesai" tanpa persetujuan pihak berwenang.

### Alur
```
Owner: Request Approval (Milestone / Deliverable / Report / Closure)
        ↓  🔔 notif ke Approver
Approver: buka Approvals → Approve / Reject + catatan
        ↓
 ├─ Approved → (Milestone) otomatis jadi Done · tercatat di Evidence
 └─ Rejected → balik ke Owner + alasan
        ↓  🔔 notif ke Requester · masuk Audit + Evidence Center
```

### UI
- Menu **Approvals** dengan tab **Pending** / **Decided**.
- Kartu approval: judul, project, entity, requester, approver, status.
- Untuk pending: kolom catatan + tombol **Approve** / **Reject**.
- Tombol **Request Approval** di halaman Approvals & di Project Detail (entity auto-terisi
  dari milestone/deliverable project tsb).

### Backend
`GET /api/approvals?status=pending` ·
`POST /api/approvals` (request) ·
`PATCH /api/approvals/:id/decide` (approve/reject, role: admin/owner/viewer)
Trigger `fn_notify_approval`: kirim notif + tandai milestone `done` saat approved.

---

## 5. Jejak Evidence
Setiap approval (request & decision) otomatis masuk **Evidence Center** dan **Audit Log** —
traceable: siapa minta, siapa memutuskan, kapan, catatannya apa.
Sesuai core value: *Every update becomes evidence.*

---

## Cara coba (demo)
Buka `frontend/demo/ProjectHub.html`:
1. **Projects → + Project** → isi → Simpan (muncul di grid, health dihitung).
2. Masuk detail → tab **Tasks → + Task**, ubah progress → lihat evidence & trend berubah.
3. Buat **Issue** severity *Critical* → muncul notifikasi 🔔 merah.
4. **Request Approval** (header detail) → cek menu **Approvals** → **Approve** →
   milestone jadi Done + notif balik + tercatat di Evidence.
5. Refresh halaman — data tetap ada (localStorage). Tombol tema & role tersedia.
