CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  is_active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  force_logout_after TEXT,
  last_login_at TEXT,
  email_verified_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_templates (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  main_image_src TEXT NOT NULL,
  logo_src TEXT NOT NULL,
  description TEXT NOT NULL,
  features_json TEXT NOT NULL,
  case_study_link TEXT NOT NULL,
  demo_images_json TEXT NOT NULL,
  project_link TEXT,
  cta_talk TEXT,
  cta_read_case_study TEXT,
  test_img TEXT,
  testimonial TEXT,
  founder_name TEXT,
  position TEXT,
  status_label TEXT,
  is_best_seller INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_templates_sort_order
ON cms_templates(sort_order);

CREATE TABLE IF NOT EXISTS otp_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('REGISTER', 'RESET_PASSWORD', 'CHANGE_EMAIL')),
  otp_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  consumed_at TEXT,
  request_ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_email_purpose_created
ON otp_requests(email, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_requests_expires_at
ON otp_requests(expires_at);

CREATE TABLE IF NOT EXISTS otp_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  otp_request_id TEXT,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  request_ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email
ON password_reset_tokens(email, created_at DESC);

CREATE TABLE IF NOT EXISTS super_admin_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  detail_json TEXT,
  severity TEXT NOT NULL DEFAULT 'INFO',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_super_admin_audit_logs_created
ON super_admin_audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS auth_login_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  success INTEGER NOT NULL,
  reason TEXT,
  request_ip TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_login_logs_email_created
ON auth_login_logs(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_login_logs_success_created
ON auth_login_logs(success, created_at DESC);

CREATE TABLE IF NOT EXISTS super_admin_backups (
  id TEXT PRIMARY KEY,
  snapshot_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_super_admin_backups_created
ON super_admin_backups(created_at DESC);
