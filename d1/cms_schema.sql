CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
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
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_templates_sort_order
ON cms_templates(sort_order);
