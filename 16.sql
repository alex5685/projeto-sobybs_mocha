CREATE TABLE quick_valuations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL,
  valor_minimo REAL NOT NULL,
  valor_maximo REAL NOT NULL,
  multiplo_min REAL NOT NULL,
  multiplo_max REAL NOT NULL,
  metodo TEXT NOT NULL,
  segmento TEXT,
  lucro_liquido_mensal_estimado REAL,
  lucro_liquido_anual_estimado REAL,
  ativos_incluidos REAL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quick_valuations_business_id ON quick_valuations(business_id);