-- =====================================================================
--  ProjectHub — Phase 2 add-on: Notifications + Approvals workflow
--  Jalankan SETELAH schema.sql (v2 core).
--  psql -U postgres -d projecthub -f schema_phase2.sql
-- =====================================================================

-- ---------- APPROVALS ----------
-- (Tabel approvals sudah ada di schema.sql v2; blok ini memastikan kolom lengkap
--  bila lu pakai schema lama. Aman dijalankan berulang.)
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS approvals (
  id           SERIAL PRIMARY KEY,
  project_id   INT REFERENCES projects(id) ON DELETE CASCADE,
  entity_type  VARCHAR(30),        -- milestone / deliverable / report / closure
  entity_id    INT,
  entity_label VARCHAR(200),       -- nama entity yg diminta (untuk display)
  title        VARCHAR(220),
  requested_by INT REFERENCES users(id) ON DELETE SET NULL,
  approver_id  INT REFERENCES users(id) ON DELETE SET NULL,
  status       approval_status DEFAULT 'pending',
  request_note TEXT,
  decision_note TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  decided_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_appr_project ON approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_appr_status  ON approvals(status);

-- ---------- NOTIFICATIONS ----------
DO $$ BEGIN
  CREATE TYPE notif_kind AS ENUM ('info','due','overdue','issue','approval','decision','assigned','health');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,   -- penerima
  project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
  kind        notif_kind DEFAULT 'info',
  title       VARCHAR(240) NOT NULL,
  link_entity VARCHAR(40),        -- task / issue / approval ...
  link_ref    VARCHAR(60),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- helper: buat notifikasi ke satu user
CREATE OR REPLACE FUNCTION fn_notify(p_user INT, p_project INT, p_kind notif_kind,
                                     p_title TEXT, p_entity TEXT DEFAULT NULL, p_ref TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications(user_id,project_id,kind,title,link_entity,link_ref)
  VALUES (p_user,p_project,p_kind,p_title,p_entity,p_ref);
END $$ LANGUAGE plpgsql;

-- helper: notifikasi ke seluruh anggota project (mis. issue critical)
CREATE OR REPLACE FUNCTION fn_notify_project(p_project INT, p_kind notif_kind,
                                             p_title TEXT, p_entity TEXT DEFAULT NULL, p_ref TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications(user_id,project_id,kind,title,link_entity,link_ref)
  SELECT pm.user_id, p_project, p_kind, p_title, p_entity, p_ref
  FROM project_members pm WHERE pm.project_id = p_project;
END $$ LANGUAGE plpgsql;

-- ---------- TRIGGERS: auto-notify dari kejadian ----------
-- Task jadi overdue / di-assign
CREATE OR REPLACE FUNCTION fn_notify_task() RETURNS TRIGGER AS $$
BEGIN
  -- assigned ke PIC baru
  IF TG_OP='INSERT' AND NEW.pic_id IS NOT NULL THEN
    PERFORM fn_notify(NEW.pic_id, NEW.project_id, 'assigned',
      'Task baru: '||NEW.title, 'task', NEW.task_code);
  END IF;
  -- baru jadi overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status<>'done'
     AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status OR OLD.due_date IS DISTINCT FROM NEW.due_date)
     AND NEW.pic_id IS NOT NULL THEN
    PERFORM fn_notify(NEW.pic_id, NEW.project_id, 'overdue',
      NEW.task_code||' overdue ('||to_char(NEW.due_date,'DD Mon')||')', 'task', NEW.task_code);
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_notify_task ON tasks;
CREATE TRIGGER trg_notify_task AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION fn_notify_task();

-- Issue critical → notify seluruh anggota project
CREATE OR REPLACE FUNCTION fn_notify_issue() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity='critical' THEN
    PERFORM fn_notify_project(NEW.project_id, 'issue',
      'Critical issue: '||NEW.title, 'issue', 'ISS-'||NEW.id);
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_notify_issue ON issues;
CREATE TRIGGER trg_notify_issue AFTER INSERT ON issues
  FOR EACH ROW EXECUTE FUNCTION fn_notify_issue();

-- Approval dibuat → notify approver ; diputuskan → notify requester
CREATE OR REPLACE FUNCTION fn_notify_approval() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.approver_id IS NOT NULL THEN
    PERFORM fn_notify(NEW.approver_id, NEW.project_id, 'approval',
      'Approval menunggu: '||COALESCE(NEW.title,NEW.entity_label), 'approval', 'APR-'||NEW.id);
  ELSIF TG_OP='UPDATE' AND OLD.status='pending' AND NEW.status<>'pending' AND NEW.requested_by IS NOT NULL THEN
    PERFORM fn_notify(NEW.requested_by, NEW.project_id, 'approval',
      COALESCE(NEW.title,NEW.entity_label)||' -> '||NEW.status, 'approval', 'APR-'||NEW.id);
    -- milestone approved → tandai done
    IF NEW.status='approved' AND NEW.entity_type='milestone' AND NEW.entity_id IS NOT NULL THEN
      UPDATE milestones SET status='done', progress=100 WHERE id=NEW.entity_id;
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_notify_approval ON approvals;
CREATE TRIGGER trg_notify_approval AFTER INSERT OR UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION fn_notify_approval();

-- Extend evidence view supaya approval masuk timeline evidence (opsional).
-- (v_evidence di schema.sql sudah mencakup approvals bila kolom cocok.)
