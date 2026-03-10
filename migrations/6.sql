
-- Add new fields to user_profiles for detailed registration
ALTER TABLE user_profiles ADD COLUMN person_type TEXT;
ALTER TABLE user_profiles ADD COLUMN full_name TEXT;
ALTER TABLE user_profiles ADD COLUMN phone TEXT;
ALTER TABLE user_profiles ADD COLUMN cpf TEXT;
ALTER TABLE user_profiles ADD COLUMN legal_name TEXT;
ALTER TABLE user_profiles ADD COLUMN cnpj TEXT;
ALTER TABLE user_profiles ADD COLUMN cpf_socio TEXT;

-- Create subscriptions table
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  monthly_value REAL NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active',
  payment_method TEXT,
  auto_renew BOOLEAN DEFAULT 1,
  ads_used_this_month INTEGER DEFAULT 0,
  ads_limit INTEGER NOT NULL,
  next_billing_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Create business_details table for complete company profile
CREATE TABLE business_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL UNIQUE,
  ramo_atividade TEXT,
  segmento TEXT,
  tempo_atuacao TEXT,
  faturamento_mensal TEXT,
  despesas_fixas TEXT,
  num_funcionarios TEXT,
  possui_imoveis BOOLEAN DEFAULT 0,
  qtd_imoveis TEXT,
  valor_imoveis TEXT,
  possui_frota BOOLEAN DEFAULT 0,
  tipo_frota TEXT,
  qtd_veiculos INTEGER,
  valor_frota TEXT,
  cep TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  pais TEXT,
  utiliza_midia BOOLEAN DEFAULT 0,
  tipos_midia TEXT,
  divida_impostos BOOLEAN DEFAULT 0,
  valor_divida_impostos TEXT,
  divida_particular BOOLEAN DEFAULT 0,
  valor_divida_particular TEXT,
  valuation_vendedor TEXT,
  motivacao_venda TEXT,
  capital_aquisicao TEXT,
  prazo_maximo TEXT,
  objetivos_compra TEXT,
  experiencia_empreendedor TEXT,
  dedicacao_tempo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_details_business_id ON business_details(business_id);

-- Create business_legal_data table for post-consultation fields
CREATE TABLE business_legal_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL UNIQUE,
  cpf_socios TEXT,
  rg_socios TEXT,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  registro_junta TEXT,
  lucro_liquido_pct REAL,
  ir_recolhido REAL,
  lucro_prejuizo_anual REAL,
  valor_fechamento REAL,
  comissao_pct REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_legal_data_business_id ON business_legal_data(business_id);

-- Create negotiation_log table for tracking
CREATE TABLE negotiation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_negotiation_log_business_id ON negotiation_log(business_id);
CREATE INDEX idx_negotiation_log_created_at ON negotiation_log(created_at);

-- Create consultation_expenses table
CREATE TABLE consultation_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  expense_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consultation_expenses_business_id ON consultation_expenses(business_id);
