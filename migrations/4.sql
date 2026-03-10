
CREATE TABLE secure_documents (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  access_level TEXT DEFAULT 'private',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_secure_documents_business_id ON secure_documents(business_id);
CREATE INDEX idx_secure_documents_access_level ON secure_documents(access_level);
