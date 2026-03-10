
CREATE TABLE financial_data (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL UNIQUE,
  revenue_json TEXT,
  ebitda REAL,
  net_debt REAL,
  asset_value REAL,
  owner_dependency_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financial_data_business_id ON financial_data(business_id);
