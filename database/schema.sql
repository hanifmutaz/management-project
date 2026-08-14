-- =====================================================================
--  ProjectHub — Full Schema (PostgreSQL 14+)
--  Core model + Health Engine + Audit + Approvals + Notifications
--  Run: psql -U postgres -d projecthub -f schema.sql
-- =====================================================================

DROP TABLE IF EXISTS notifications   CASCADE;
DROP TABLE IF EXISTS approvals       CASCADE;
DROP TABLE IF EXISTS audit_log       CASCADE;
DROP TABLE IF EXISTS attachments     CASCADE;
DROP TABLE IF EXISTS decisions       CASCADE;
DROP TABLE IF EXISTS actions         CASCADE;
DROP TABLE IF EXISTS risks           CASCADE;
DROP TABLE IF EXISTS issues          CASCADE;
DROP TABLE IF EXISTS progress_history CASCADE;
DROP TABLE IF EXISTS tasks           CASCADE;
DROP TABLE IF EXISTS deliverables    CASCADE;
DROP TABLE IF EXISTS milestones      CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects        CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

DO $$ BEGIN
  CREATE TYPE user_role     AS ENUM ('admin','owner','member','viewer');
  CREATE TYPE proj_status   AS ENUM ('planning','execution','monitoring','on_hold','closed','cancelled');
  CREATE TYPE task_status   AS ENUM ('not_started','in_progress','review','done','on_hold','cancelled');
  CREATE TYPE ms_status     AS ENUM ('not_started','in_progress','done','delayed');
  CREATE TYPE priority_lvl  AS ENUM ('low','medium','high','critical');
  CREATE TYPE health_lvl    AS ENUM ('on_track','watch','at_risk','critical');
  CREATE TYPE severity_lvl  AS ENUM ('low','medium','high','critical');
  CREATE TYPE issue_status  AS ENUM ('open','in_progress','monitoring','resolved','closed');
  CREATE TYPE risk_status   AS ENUM ('identified','analyzing','mitigating','monitoring','closed','occurred');
  CREATE TYPE action_status AS ENUM ('open','in_progress','done','cancelled');
  CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');
  CREATE TYPE notif_kind    AS ENUM ('info','due','overdue','issue','approval','decision','assigned','health');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  department VARCHAR(80),
  avatar_init VARCHAR(3),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  project_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  category VARCHAR(80),
  owner_id INT REFERENCES users(id) ON DELETE SET NULL,
  sponsor VARCHAR(120),
  objectives TEXT,
  start_date DATE,
  target_date DATE,
  priority priority_lvl DEFAULT 'medium',
  status proj_status DEFAULT 'planning',
  health health_lvl DEFAULT 'on_track',
  health_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE project_members (
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role_in_proj VARCHAR(40) DEFAULT 'member',
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE milestones (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  owner_id INT REFERENCES users(id) ON DELETE SET NULL,
  target_date DATE,
  status ms_status DEFAULT 'not_started',
  progress NUMERIC(5,2) DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ms_project ON milestones(project_id);

CREATE TABLE deliverables (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id INT REFERENCES milestones(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id INT REFERENCES users(id) ON DELETE SET NULL,
  target_date DATE,
  status task_status DEFAULT 'not_started',
  progress NUMERIC(5,2) DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_del_project ON deliverables(project_id);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id INT REFERENCES milestones(id) ON DELETE SET NULL,
  deliverable_id INT REFERENCES deliverables(id) ON DELETE SET NULL,
  parent_task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
  task_code VARCHAR(30),
  title VARCHAR(220) NOT NULL,
  description TEXT,
  category VARCHAR(60),
  pic_id INT REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE,
  due_date DATE,
  status task_status DEFAULT 'not_started',
  priority priority_lvl DEFAULT 'medium',
  progress NUMERIC(5,2) DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  health health_lvl DEFAULT 'on_track',
  constraint_note TEXT,
  next_action TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_pic ON tasks(pic_id);
CREATE INDEX idx_tasks_due ON tasks(due_date);

CREATE TABLE progress_history (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL,
  entity_id INT NOT NULL,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  prev_progress NUMERIC(5,2),
  new_progress NUMERIC(5,2),
  delta NUMERIC(5,2),
  changed_by INT REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ph_project ON progress_history(project_id);

CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  task_id INT REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  severity severity_lvl DEFAULT 'medium',
  impact TEXT,
  status issue_status DEFAULT 'open',
  owner_id INT REFERENCES users(id) ON DELETE SET NULL,
  target_date DATE,
  next_action TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_issues_project ON issues(project_id);

CREATE TABLE risks (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  probability severity_lvl DEFAULT 'medium',
  impact severity_lvl DEFAULT 'medium',
  rating INT,
  severity severity_lvl DEFAULT 'medium',
  owner_id INT REFERENCES users(id) ON DELETE SET NULL,
  mitigation TEXT,
  status risk_status DEFAULT 'identified',
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_risks_project ON risks(project_id);

CREATE TABLE actions (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(220) NOT NULL,
  owner_id INT REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  priority priority_lvl DEFAULT 'medium',
  status action_status DEFAULT 'open',
  related_issue INT REFERENCES issues(id) ON DELETE SET NULL,
  related_risk INT REFERENCES risks(id) ON DELETE SET NULL,
  related_decision INT,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_actions_project ON actions(project_id);

CREATE TABLE decisions (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  made_by INT REFERENCES users(id) ON DELETE SET NULL,
  decided_at DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  impact TEXT,
  related_issue INT REFERENCES issues(id) ON DELETE SET NULL,
  related_risk INT REFERENCES risks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE actions ADD CONSTRAINT fk_action_decision
  FOREIGN KEY (related_decision) REFERENCES decisions(id) ON DELETE SET NULL;

CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  entity_type VARCHAR(30),
  entity_id INT,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(60),
  file_size INT,
  uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(40),
  entity_type VARCHAR(40),
  entity_ref VARCHAR(80),
  field VARCHAR(60),
  prev_value TEXT,
  new_value TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_project ON audit_log(project_id);

CREATE TABLE approvals (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  entity_type VARCHAR(30),
  entity_id INT,
  entity_label VARCHAR(200),
  title VARCHAR(220),
  requested_by INT REFERENCES users(id) ON DELETE SET NULL,
  approver_id INT REFERENCES users(id) ON DELETE SET NULL,
  status approval_status DEFAULT 'pending',
  request_note TEXT,
  decision_note TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ
);
CREATE INDEX idx_appr_project ON approvals(project_id);
CREATE INDEX idx_appr_status ON approvals(status);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  kind notif_kind DEFAULT 'info',
  title VARCHAR(240) NOT NULL,
  link_entity VARCHAR(40),
  link_ref VARCHAR(60),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read);

-- =====================================================================
--  VIEWS
-- =====================================================================
CREATE OR REPLACE VIEW v_project_stats AS
SELECT
  p.id, p.project_code, p.name, p.category, p.status, p.target_date, p.start_date,
  p.priority, p.health, p.health_reason, u.full_name AS owner,
  COUNT(t.id) AS total_tasks,
  COUNT(*) FILTER (WHERE t.status='done') AS done_tasks,
  COUNT(*) FILTER (WHERE t.status='in_progress') AS active_tasks,
  COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status<>'done') AS overdue_tasks,
  COALESCE(ROUND(AVG(t.progress),0),0) AS avg_progress,
  (SELECT COUNT(*) FROM issues i WHERE i.project_id=p.id AND i.status NOT IN ('resolved','closed')) AS open_issues,
  (SELECT COUNT(*) FROM issues i WHERE i.project_id=p.id AND i.severity IN ('high','critical') AND i.status NOT IN ('resolved','closed')) AS high_issues,
  (SELECT COUNT(*) FROM risks r WHERE r.project_id=p.id AND r.status<>'closed' AND r.severity IN ('high','critical')) AS high_risks
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN users u ON u.id = p.owner_id
GROUP BY p.id, u.full_name;

CREATE OR REPLACE VIEW v_dashboard_kpi AS
SELECT
  (SELECT COUNT(*) FROM projects WHERE status<>'cancelled') AS total_projects,
  (SELECT COUNT(*) FROM projects WHERE health='on_track') AS healthy,
  (SELECT COUNT(*) FROM projects WHERE health='at_risk') AS at_risk,
  (SELECT COUNT(*) FROM projects WHERE health='critical') AS critical,
  (SELECT COALESCE(ROUND(AVG(avg_progress),0),0) FROM v_project_stats) AS overall_progress,
  (SELECT COUNT(*) FROM tasks WHERE due_date<CURRENT_DATE AND status<>'done') AS overdue_tasks,
  (SELECT COUNT(*) FROM issues WHERE status NOT IN ('resolved','closed')) AS open_issues,
  (SELECT COUNT(*) FROM approvals WHERE status='pending') AS pending_approvals;

CREATE OR REPLACE VIEW v_evidence AS
  SELECT ph.project_id, ph.changed_at AS at, 'progress' AS etype, u.full_name AS actor,
         ('Progress '||COALESCE(ph.prev_progress,0)||'% -> '||ph.new_progress||'%') AS summary
    FROM progress_history ph LEFT JOIN users u ON u.id=ph.changed_by
  UNION ALL
  SELECT i.project_id, i.created_at, 'issue', u.full_name, ('Issue: '||i.title)
    FROM issues i LEFT JOIN users u ON u.id=i.owner_id
  UNION ALL
  SELECT r.project_id, r.created_at, 'risk', u.full_name, ('Risk: '||r.title)
    FROM risks r LEFT JOIN users u ON u.id=r.owner_id
  UNION ALL
  SELECT d.project_id, d.created_at, 'decision', u.full_name, ('Decision: '||d.title)
    FROM decisions d LEFT JOIN users u ON u.id=d.made_by
  UNION ALL
  SELECT ap.project_id, COALESCE(ap.decided_at, ap.requested_at), 'approval', u.full_name,
         ('Approval '||ap.status||': '||COALESCE(ap.title,ap.entity_label))
    FROM approvals ap LEFT JOIN users u ON u.id=ap.approver_id;

-- =====================================================================
--  HEALTH ENGINE (rule-based, + alasan)
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_compute_project_health(p_id INT)
RETURNS TABLE(health health_lvl, reason TEXT) AS $$
DECLARE
  v_overdue INT; v_crit INT; v_high INT; v_odms INT; v_avg NUMERIC; v_elapsed NUMERIC;
  v_reasons TEXT[] := '{}'; v_h health_lvl := 'on_track';
BEGIN
  SELECT COUNT(*) INTO v_overdue FROM tasks WHERE project_id=p_id AND due_date<CURRENT_DATE AND status<>'done';
  SELECT COUNT(*) INTO v_crit FROM issues WHERE project_id=p_id AND severity='critical' AND status NOT IN ('resolved','closed');
  SELECT COUNT(*) INTO v_high FROM issues WHERE project_id=p_id AND severity='high' AND status NOT IN ('resolved','closed');
  SELECT COUNT(*) INTO v_odms FROM milestones WHERE project_id=p_id AND target_date<CURRENT_DATE AND status<>'done';
  SELECT COALESCE(AVG(progress),0) INTO v_avg FROM tasks WHERE project_id=p_id;
  SELECT CASE WHEN target_date>start_date THEN
     LEAST(100,GREATEST(0,(CURRENT_DATE-start_date)::numeric/NULLIF(target_date-start_date,0)*100)) ELSE 0 END
     INTO v_elapsed FROM projects WHERE id=p_id;

  IF v_crit>0 THEN v_h:='critical'; v_reasons:=array_append(v_reasons,v_crit||' critical issue'); END IF;
  IF v_odms>0 THEN IF v_h<>'critical' THEN v_h:='at_risk'; END IF; v_reasons:=array_append(v_reasons,v_odms||' overdue milestone'); END IF;
  IF v_overdue>0 THEN IF v_h IN ('on_track','watch') THEN v_h:='at_risk'; END IF; v_reasons:=array_append(v_reasons,v_overdue||' overdue task'||CASE WHEN v_overdue>1 THEN 's' ELSE '' END); END IF;
  IF v_high>0 THEN IF v_h='on_track' THEN v_h:='watch'; END IF; v_reasons:=array_append(v_reasons,v_high||' high-impact issue'); END IF;
  IF v_elapsed-v_avg>=25 THEN IF v_h='on_track' THEN v_h:='watch'; END IF;
     v_reasons:=array_append(v_reasons,'schedule variance '||ROUND(v_elapsed-v_avg)||'% (waktu '||ROUND(v_elapsed)||'% vs progress '||ROUND(v_avg)||'%)'); END IF;
  IF array_length(v_reasons,1) IS NULL THEN v_reasons:=array_append(v_reasons,'No blocking issues, on schedule'); END IF;

  RETURN QUERY SELECT v_h, array_to_string(v_reasons,' · ');
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_refresh_health(p_id INT) RETURNS void AS $$
DECLARE h RECORD;
BEGIN
  SELECT * INTO h FROM fn_compute_project_health(p_id);
  UPDATE projects SET health=h.health, health_reason=h.reason, updated_at=now() WHERE id=p_id;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_refresh_all_health() RETURNS void AS $$
DECLARE r RECORD; BEGIN FOR r IN SELECT id FROM projects LOOP PERFORM fn_refresh_health(r.id); END LOOP; END $$ LANGUAGE plpgsql;

-- =====================================================================
--  TRIGGERS
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_task_before() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date IS NOT NULL AND NEW.due_date<CURRENT_DATE AND NEW.status<>'done' THEN NEW.health:='critical';
  ELSIF NEW.due_date IS NOT NULL AND NEW.due_date<=CURRENT_DATE+INTERVAL '3 days' AND NEW.progress<60 AND NEW.status<>'done' THEN NEW.health:='at_risk';
  ELSIF NEW.progress<50 AND NEW.status='in_progress' THEN NEW.health:='watch';
  ELSE NEW.health:='on_track'; END IF;
  IF NEW.status='done' AND (OLD.status IS DISTINCT FROM 'done') THEN NEW.completed_at:=now(); NEW.progress:=100; END IF;
  NEW.updated_at:=now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_task_before BEFORE INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION fn_task_before();

CREATE OR REPLACE FUNCTION fn_task_after() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP='UPDATE' AND (OLD.progress IS DISTINCT FROM NEW.progress) THEN
    INSERT INTO progress_history(entity_type,entity_id,project_id,prev_progress,new_progress,delta,changed_by)
    VALUES ('task',NEW.id,NEW.project_id,OLD.progress,NEW.progress,NEW.progress-OLD.progress,NEW.pic_id);
    INSERT INTO audit_log(project_id,user_id,action,entity_type,entity_ref,field,prev_value,new_value)
    VALUES (NEW.project_id,NEW.pic_id,'progress','task',NEW.task_code,'progress',OLD.progress::text,NEW.progress::text);
  END IF;
  IF NEW.pic_id IS NOT NULL AND NEW.due_date<CURRENT_DATE AND NEW.status<>'done'
     AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO notifications(user_id,project_id,kind,title,link_entity,link_ref)
    VALUES (NEW.pic_id,NEW.project_id,'overdue',NEW.task_code||' overdue ('||to_char(NEW.due_date,'DD Mon')||')','task',NEW.task_code);
  END IF;
  PERFORM fn_refresh_health(NEW.project_id);
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_task_after AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION fn_task_after();

CREATE OR REPLACE FUNCTION fn_risk_rating() RETURNS TRIGGER AS $$
DECLARE pp INT; ii INT; BEGIN
  pp:=CASE NEW.probability WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 ELSE 4 END;
  ii:=CASE NEW.impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 ELSE 4 END;
  NEW.rating:=pp*ii;
  NEW.severity:=CASE WHEN NEW.rating>=12 THEN 'critical' WHEN NEW.rating>=6 THEN 'high' WHEN NEW.rating>=3 THEN 'medium' ELSE 'low' END;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_risk_rating BEFORE INSERT OR UPDATE ON risks FOR EACH ROW EXECUTE FUNCTION fn_risk_rating();

CREATE OR REPLACE FUNCTION fn_issue_after() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.severity='critical' THEN
    INSERT INTO notifications(user_id,project_id,kind,title,link_entity,link_ref)
    SELECT pm.user_id,NEW.project_id,'issue','Critical issue: '||NEW.title,'issue','ISS-'||NEW.id
    FROM project_members pm WHERE pm.project_id=NEW.project_id;
  END IF;
  PERFORM fn_refresh_health(NEW.project_id);
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_issue_after AFTER INSERT OR UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION fn_issue_after();

CREATE OR REPLACE FUNCTION fn_ms_after() RETURNS TRIGGER AS $$
BEGIN PERFORM fn_refresh_health(NEW.project_id); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_ms_after AFTER INSERT OR UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION fn_ms_after();

CREATE OR REPLACE FUNCTION fn_approval_after() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.approver_id IS NOT NULL THEN
    INSERT INTO notifications(user_id,project_id,kind,title,link_entity,link_ref)
    VALUES (NEW.approver_id,NEW.project_id,'approval','Approval menunggu: '||COALESCE(NEW.title,NEW.entity_label),'approval','APR-'||NEW.id);
  ELSIF TG_OP='UPDATE' AND OLD.status='pending' AND NEW.status<>'pending' THEN
    IF NEW.requested_by IS NOT NULL THEN
      INSERT INTO notifications(user_id,project_id,kind,title,link_entity,link_ref)
      VALUES (NEW.requested_by,NEW.project_id,'approval',COALESCE(NEW.title,NEW.entity_label)||' -> '||NEW.status,'approval','APR-'||NEW.id);
    END IF;
    IF NEW.status='approved' AND NEW.entity_type='milestone' AND NEW.entity_id IS NOT NULL THEN
      UPDATE milestones SET status='done', progress=100 WHERE id=NEW.entity_id;
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_approval_after AFTER INSERT OR UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION fn_approval_after();
