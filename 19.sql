ALTER TABLE valuations ADD COLUMN email_day3_sent INTEGER DEFAULT 0;
ALTER TABLE valuations ADD COLUMN notified_expiration INTEGER DEFAULT 0;
ALTER TABLE valuations ADD COLUMN conversion_source TEXT;
ALTER TABLE valuations ADD COLUMN converted_at DATETIME;
ALTER TABLE valuations ADD COLUMN last_plan_page_source TEXT;