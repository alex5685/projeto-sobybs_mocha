CREATE TABLE valuations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'done',
  plan_type TEXT,
  valor_estimado REAL,
  valor_minimo REAL,
  valor_maximo REAL,
  nivel_incerteza_referencia INTEGER,
  score_atratividade INTEGER,
  metodologias_json TEXT,
  riscos_json TEXT,
  recomendacoes_json TEXT,
  intangiveis_json TEXT,
  input_snapshot_json TEXT,
  report_id TEXT,
  certificate_id TEXT,
  revisions_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_valuations_business ON valuations(business_id, created_at DESC);
CREATE INDEX idx_valuations_user ON valuations(user_id, type);