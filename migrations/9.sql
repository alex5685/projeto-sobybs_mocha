
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  linkedin_url TEXT,
  email TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_openings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type TEXT,
  description TEXT NOT NULL,
  requirements TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_opening_id INTEGER,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  cv_storage_key TEXT NOT NULL,
  cv_file_name TEXT NOT NULL,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_members_active ON team_members(is_active, display_order);
CREATE INDEX idx_job_openings_active ON job_openings(is_active);
CREATE INDEX idx_job_applications_status ON job_applications(status);

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES 
  ('institutional_founder_name', '', 'text', 'Nome do fundador', 'institucional'),
  ('institutional_founder_role', '', 'text', 'Cargo do fundador', 'institucional'),
  ('institutional_founder_bio', '', 'textarea', 'Biografia do fundador', 'institucional'),
  ('institutional_founder_photo', '', 'text', 'URL da foto do fundador', 'institucional'),
  ('institutional_founder_linkedin', '', 'text', 'LinkedIn do fundador', 'institucional');
