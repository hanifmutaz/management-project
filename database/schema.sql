-- =====================================================================
--  MUTAZ OS — Personal Work Operating System
--  PostgreSQL 14+  ·  single-user, no auth
--  Run: psql -U postgres -d mutaz_os -f schema.sql
-- =====================================================================

DROP TABLE IF EXISTS payments   CASCADE;
DROP TABLE IF EXISTS work_logs  CASCADE;
DROP TABLE IF EXISTS tasks      CASCADE;
DROP TABLE IF EXISTS projects   CASCADE;

DO $$ BEGIN
  CREATE TYPE proj_type    AS ENUM ('office','freelance','parttime','personal','kuliah');
  CREATE TYPE proj_status  AS ENUM ('active','on_hold','done','archived');
  CREATE TYPE task_status  AS ENUM ('todo','doing','done');
  CREATE TYPE priority_lvl AS ENUM ('low','medium','high');
  CREATE TYPE rate_type    AS ENUM ('none','hourly','fixed');
  CREATE TYPE pay_status   AS ENUM ('unpaid','invoiced','paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE projects (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(160) NOT NULL,
  type          proj_type    NOT NULL DEFAULT 'personal',
  status        proj_status  NOT NULL DEFAULT 'active',
  description   TEXT,
  client_name   VARCHAR(120),
  rate_type     rate_type    DEFAULT 'none',
  rate          NUMERIC(12,2) DEFAULT 0,
  currency      VARCHAR(8)   DEFAULT 'IDR',
  color         VARCHAR(9)   DEFAULT '#5b8cff',
  tags          TEXT[]       DEFAULT '{}',
  notes         TEXT,
  pinned        BOOLEAN      DEFAULT FALSE,
  start_date    DATE,
  due_date      DATE,
  last_activity DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_proj_type ON projects(type);
CREATE INDEX idx_proj_status ON projects(status);

CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(220) NOT NULL,
  status      task_status  DEFAULT 'todo',
  priority    priority_lvl DEFAULT 'medium',
  due_date    DATE,
  tags        TEXT[]       DEFAULT '{}',
  sort_order  INT DEFAULT 0,
  done_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_task_project ON tasks(project_id);
CREATE INDEX idx_task_status ON tasks(status);

-- ⭐ Work Log: rekam jejak "apa aja yang gua kerjain"
CREATE TABLE work_logs (
  id          SERIAL PRIMARY KEY,
  project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
  task_id     INT REFERENCES tasks(id) ON DELETE SET NULL,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  hours       NUMERIC(6,2) DEFAULT 0,
  billable    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wl_project ON work_logs(project_id);
CREATE INDEX idx_wl_date ON work_logs(log_date);

CREATE TABLE payments (
  id            SERIAL PRIMARY KEY,
  project_id    INT REFERENCES projects(id) ON DELETE CASCADE,
  label         VARCHAR(160),
  amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency      VARCHAR(8) DEFAULT 'IDR',
  status        pay_status DEFAULT 'unpaid',
  invoice_date  DATE,
  paid_date     DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pay_project ON payments(project_id);
CREATE INDEX idx_pay_status ON payments(status);

-- =====================================================================
--  TRIGGERS
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_touch_project(p_id INT) RETURNS void AS $$
BEGIN UPDATE projects SET last_activity = CURRENT_DATE, updated_at = now() WHERE id = p_id; END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_worklog_after() RETURNS TRIGGER AS $$
BEGIN PERFORM fn_touch_project(NEW.project_id); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_worklog_after AFTER INSERT OR UPDATE ON work_logs FOR EACH ROW EXECUTE FUNCTION fn_worklog_after();

CREATE OR REPLACE FUNCTION fn_task_before() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN NEW.done_at := now();
  ELSIF NEW.status <> 'done' THEN NEW.done_at := NULL; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_task_before BEFORE INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION fn_task_before();

CREATE OR REPLACE FUNCTION fn_task_after() RETURNS TRIGGER AS $$
BEGIN PERFORM fn_touch_project(NEW.project_id); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_task_after AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION fn_task_after();

-- =====================================================================
--  VIEWS
-- =====================================================================
CREATE OR REPLACE VIEW v_project_summary AS
SELECT p.*,
  COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id), 0)                                    AS total_tasks,
  COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id AND t.status='done'), 0)                AS done_tasks,
  COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id AND t.status<>'done'
            AND t.due_date < CURRENT_DATE), 0)                                                           AS overdue_tasks,
  COALESCE((SELECT SUM(hours) FROM work_logs w WHERE w.project_id=p.id), 0)                              AS total_hours,
  COALESCE((SELECT SUM(hours) FROM work_logs w WHERE w.project_id=p.id AND w.billable), 0)               AS billable_hours,
  CASE p.rate_type
    WHEN 'hourly' THEN COALESCE((SELECT SUM(hours) FROM work_logs w WHERE w.project_id=p.id AND w.billable),0) * p.rate
    WHEN 'fixed'  THEN p.rate ELSE 0 END                                                                 AS est_value,
  COALESCE((SELECT SUM(amount) FROM payments pm WHERE pm.project_id=p.id AND pm.status='paid'), 0)       AS paid_amount,
  COALESCE((SELECT SUM(amount) FROM payments pm WHERE pm.project_id=p.id AND pm.status<>'paid'), 0)      AS unpaid_amount,
  (CURRENT_DATE - p.last_activity)                                                                        AS days_idle
FROM projects p;

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
  (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status<>'paid' AND currency='IDR')             AS unpaid_total,
  (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid' AND currency='IDR'
     AND paid_date >= date_trunc('month', CURRENT_DATE))                                              AS income_this_month;

-- Zero-filled: selalu 14 baris (hari ini - 13 s/d hari ini) walau sebagian hari ga ada log,
-- biar chart "Jam Kerja 14 Hari" di dashboard ga bolong/loncat tanggal.
CREATE OR REPLACE VIEW v_hours_by_day AS
SELECT d::date AS log_date, COALESCE(SUM(w.hours), 0) AS hours
FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d
LEFT JOIN work_logs w ON w.log_date = d::date
GROUP BY d ORDER BY d;

CREATE OR REPLACE VIEW v_hours_by_type AS
SELECT p.type, COALESCE(SUM(w.hours),0) AS hours
FROM projects p LEFT JOIN work_logs w ON w.project_id=p.id GROUP BY p.type;

-- streak: berapa hari berturut-turut (dari hari ini/kemarin) ada work log
CREATE OR REPLACE FUNCTION fn_streak() RETURNS INT AS $$
DECLARE d DATE := CURRENT_DATE; cnt INT := 0; has BOOLEAN;
BEGIN
  -- kalau hari ini belum ada log, mulai hitung dari kemarin
  IF NOT EXISTS (SELECT 1 FROM work_logs WHERE log_date = CURRENT_DATE) THEN d := CURRENT_DATE - 1; END IF;
  LOOP
    SELECT EXISTS (SELECT 1 FROM work_logs WHERE log_date = d) INTO has;
    EXIT WHEN NOT has;
    cnt := cnt + 1; d := d - 1;
  END LOOP;
  RETURN cnt;
END $$ LANGUAGE plpgsql;
