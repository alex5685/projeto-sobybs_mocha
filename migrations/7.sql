
ALTER TABLE business_details ADD COLUMN user_id TEXT;
CREATE INDEX idx_business_details_user_id ON business_details(user_id);
