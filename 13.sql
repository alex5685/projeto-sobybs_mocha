
CREATE TABLE plan_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_name TEXT NOT NULL,
  service_description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plan_services_plan ON plan_services(plan_name);
CREATE INDEX idx_plan_services_active ON plan_services(is_active);

-- Insert initial Bronze plan services
INSERT INTO plan_services (plan_name, service_description, display_order) VALUES
('bronze', '2 anúncios mensais destacados em jornais de grande circulação da praça da empresa', 1),
('bronze', 'Acesso garantido no site ao andamento da negociação (apresentações, likes, etc.)', 2),
('bronze', 'Apresentação da empresa aos investidores cadastrados no site Sobybs', 3),
('bronze', 'Pareceres jurídico e contábil do corpo de advogados e contadores', 4),
('bronze', 'Busca de nome negativo dos compradores interessados', 5);

-- Insert initial Silver plan services
INSERT INTO plan_services (plan_name, service_description, display_order) VALUES
('silver', '4 anúncios mensais destacados em jornais de grande circulação ou exterior', 1),
('silver', 'Banner compartilhado em sites parceiros', 2),
('silver', 'Confecção de apresentação detalhada e exclusiva da empresa', 3),
('silver', 'Acesso garantido no site ao andamento da negociação (apresentações, likes, etc.)', 4),
('silver', 'Apresentação detalhada da empresa aos investidores cadastrados no site Sobybs', 5),
('silver', 'Assessoria jurídica e contábil do corpo de advogados e contadores', 6),
('silver', 'Levantamento de garantias e busca de nome negativo dos compradores', 7);

-- Insert initial Gold plan services
INSERT INTO plan_services (plan_name, service_description, display_order) VALUES
('gold', '8 anúncios mensais destacados em jornais de grande circulação e econômicos no Brasil e exterior', 1),
('gold', 'Banner exclusivo em sites parceiros', 2),
('gold', 'Confecção de dossiê de apresentação detalhado e exclusivo da empresa', 3),
('gold', 'Acesso garantido no site ao andamento da negociação (apresentações, likes, etc.)', 4),
('gold', 'Apresentação detalhada da empresa aos investidores cadastrados no site Sobybs', 5),
('gold', 'Levantamento de garantias, certidões negativas e busca de nome negativo dos compradores', 6),
('gold', 'Assessoria jurídica e contábil completa do corpo de advogados e contadores', 7);
