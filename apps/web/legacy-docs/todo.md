# Todo
- #4: Adicionar período de teste gratuito para perfis pagos

## Cadastro e Autenticação
- #1: Implementar fluxo de cadastro Pessoa Física (nome, email, telefone, CPF, senha)
- #2: Implementar fluxo de cadastro Pessoa Jurídica (razão social, CNPJ, CPF sócio, senha)
- #3: Criar perfil de usuário com tipo (Básico, Comprador, Vendedor, Híbrido, Admin)

## Cadastro de Empresa Detalhado
- #38: Adicionar etapa de dados financeiros detalhados (receita anual, lucro líquido, EBITDA, margem, ativos, passivos, capital de giro)

## Consultoria e Pagamento
- #10: Implementar agendamento de entrevista (campo 28)
- #13: Integrar gateway de pagamento Stripe (cartão/débito/boleto)
- #14: Criar dashboard de assinatura para cliente (status, anúncios usados, próxima cobrança)
- #15: Adicionar campos pós-contratação (CPF/RG sócios, IE, IM, Junta Comercial, lucro, IR - campos 29-36)

## Documentos e Contratos
- #14: Criar gerador automático de contrato de prestação de serviços (campo 37)
- #15: Implementar gerador de recibo de pagamento (campo 38)
- #16: Criar gerador de boleto de cobrança (campo 39)
- #17: Adicionar gerador de papel timbrado (campo 40)

## Workflow e Controle
- #19: Criar sistema de acompanhamento de negociação com log temporal (campo 41)
- #20: Adicionar área para observações externas (advogados, contadores - campo 42)
- #21: Implementar controle de valores e despesas de consultoria (campos 43-45)
- #22: Criar campos de fechamento (valor, comissão, assinatura digital - campos 47-49)

## Valuation IA e Relatórios
- #39: Criar página de visualização da empresa cadastrada com botões "Valuation IA" e "Gerar Relatório"
- #40: Adaptar valuation para usar dados financeiros detalhados obrigatórios
- #41: Criar gerador de relatório analítico consolidado com todos os dados da empresa
- ✅ #42: Valuation Rápido (gratuito) implementado - /valuation-rapido/:businessId
- ✅ #49: Valuation Completo (pago) implementado - /empresa/:businessId/valuation-completo com conteúdo por plano (Bronze/Silver/Gold)
- ✅ #56: Sistema de revisões de valuation implementado com limites por plano (Bronze: 1/90d, Silver/Gold: ilimitadas)
- #50: Implementar geração REAL de PDFs com pdfkit (atualmente retorna stub com report_id)

## Marketplace
- #26: Criar listagem pública de empresas com dados anônimos
- #27: Implementar sistema de cards com informações básicas (segmento, faturamento, região)
- #28: Adicionar filtros por segmento, região, faixa de preço
- #29: Criar sistema de manifestação de interesse

## Institucional

## Área Administrativa
- #30: Criar dashboard administrativo com níveis de acesso (Admin/Operador)
- #31: Implementar relatórios e gráficos por período (campos 50-57)
- #32: Criar controle de receitas (comissões, consultorias)
- #33: Adicionar gestão de despesas e lançamentos (campo 58)
- #34: Implementar sistema de permissões por perfil de usuário
- #43: Implementar upload massivo de empresas (CSV/JSON)

## Notificações
- #35: Configurar email transacional para novos cadastros
- #36: Criar notificações de mudança de status no workflow
- #37: Implementar alertas de vencimento de pagamentos

## Conversão e Lead Nurturing
- #51: Implementar worker/cron para e-mail automático D+3 após quick valuation
- ✅ #52: Modal de expiração (D+7) implementado - ValuationExpiredModal.tsx
- ✅ #53: Banner persistente implementado - ConversionBanner.tsx
- ✅ #54: Modal "Conteúdo Premium" implementado - PremiumModal.tsx
- ✅ Tracking de conversão implementado com query params e eventos
- #55: Adicionar métricas de conversão por fonte no painel Admin (dashboard de analytics)

## Segurança e Testes
- #44: Teste de invasão de URL (ID enumeration - verificar acesso não autorizado)
- #45: Teste de expiração de link (links temporários de acesso)
- #46: Teste de escalonamento de privilégios (perfil básico tentando acessar /admin ou /valuation-detalhado)
- #47: Teste de injeção de arquivos (sanitização - bloquear upload de .html, .js, aceitar apenas formatos permitidos)
- #48: Teste de vazamento em notificações (garantir que emails não contenham dados sensíveis como valores ou nomes reais)
