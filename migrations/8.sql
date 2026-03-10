
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category) VALUES
  ('commission_bronze', '5', 'number', 'Percentual de comissão plano Bronze', 'comissoes'),
  ('commission_silver', '7.5', 'number', 'Percentual de comissão plano Silver', 'comissoes'),
  ('commission_gold', '10', 'number', 'Percentual de comissão plano Gold', 'comissoes'),
  ('service_valuation', '500', 'number', 'Valor do serviço de Valuation IA (R$)', 'servicos'),
  ('service_legal', '1500', 'number', 'Valor do suporte jurídico (R$)', 'servicos'),
  ('service_accounting', '1000', 'number', 'Valor do suporte contábil (R$)', 'servicos'),
  ('service_document_verification', '300', 'number', 'Valor da verificação de documentos (R$)', 'servicos'),
  ('institutional_message', 'Bem-vindo à Negócio Certo! Conectamos compradores e vendedores com transparência e segurança.', 'text', 'Mensagem institucional principal', 'institucional'),
  ('institutional_history', 'A Negócio Certo nasceu da necessidade de profissionalizar o mercado de M&A no Brasil.', 'text', 'História da empresa', 'institucional'),
  ('institutional_mission', 'Facilitar negociações seguras e transparentes de compra e venda de empresas.', 'text', 'Missão da empresa', 'institucional'),
  ('institutional_vision', 'Ser a plataforma de referência no Brasil para transações empresariais.', 'text', 'Visão da empresa', 'institucional');
