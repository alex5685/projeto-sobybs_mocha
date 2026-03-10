
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  alias_name TEXT NOT NULL,
  real_legal_name TEXT,
  sector TEXT NOT NULL,
  status_workflow TEXT DEFAULT 'adesao',
  valuation_ia_est REAL,
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_status_workflow ON businesses(status_workflow);
CREATE INDEX idx_businesses_is_public ON businesses(is_public);
CREATE INDEX idx_businesses_sector ON businesses(sector);
