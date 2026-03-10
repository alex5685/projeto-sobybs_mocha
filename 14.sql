
CREATE TABLE faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faqs_active ON faqs(is_active);
CREATE INDEX idx_faqs_order ON faqs(display_order);

-- Insert initial FAQs
INSERT INTO faqs (question, answer, display_order) VALUES
('Posso cancelar a qualquer momento?', 'Todos os planos têm contratação mínima de 3 meses. Após esse período, você pode cancelar com 30 dias de antecedência.', 1),
('Posso mudar de plano?', 'Sim! Você pode fazer upgrade do seu plano a qualquer momento. O valor será ajustado proporcionalmente.', 2),
('Como funciona o pagamento?', 'Aceitamos cartão de crédito, débito em conta e boleto bancário. O pagamento é processado mensalmente de forma automática.', 3),
('Qual plano é recomendado?', 'O plano Silver é o mais popular e oferece excelente custo-benefício. Para negócios de maior valor, recomendamos o Gold.', 4);
