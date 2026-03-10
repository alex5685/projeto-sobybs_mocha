
DROP INDEX idx_consultation_expenses_business_id;
DROP TABLE consultation_expenses;

DROP INDEX idx_negotiation_log_created_at;
DROP INDEX idx_negotiation_log_business_id;
DROP TABLE negotiation_log;

DROP INDEX idx_business_legal_data_business_id;
DROP TABLE business_legal_data;

DROP INDEX idx_business_details_business_id;
DROP TABLE business_details;

DROP INDEX idx_subscriptions_status;
DROP INDEX idx_subscriptions_user_id;
DROP TABLE subscriptions;

ALTER TABLE user_profiles DROP COLUMN cpf_socio;
ALTER TABLE user_profiles DROP COLUMN cnpj;
ALTER TABLE user_profiles DROP COLUMN legal_name;
ALTER TABLE user_profiles DROP COLUMN cpf;
ALTER TABLE user_profiles DROP COLUMN phone;
ALTER TABLE user_profiles DROP COLUMN full_name;
ALTER TABLE user_profiles DROP COLUMN person_type;
