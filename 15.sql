
CREATE TABLE business_images (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_images_business_id ON business_images(business_id);
CREATE INDEX idx_business_images_primary ON business_images(business_id, is_primary);
