# Sugestões de Campos para Módulos

## Módulo: Cadastro de Empresa (Formulário Completo)

Baseado nos requisitos fornecidos, o cadastro de empresa já está bem documentado nos campos 2-27. Seguir exatamente a estrutura fornecida com:

### Seção 1: Caracterização do Negócio
- Ramo de Atividade (combobox)
- Segmento (combobox: Serviços, Indústria, Comércio, Tecnologia)
- Tempo de Atuação (combobox faixas)
- Faturamento Bruto Mensal (combobox faixas)
- Despesas Fixas Mensais (combobox faixas)
- Número de Funcionários (combobox faixas)
- Possui Imóveis? (sim/não)
  - Se sim: Quantos? (combobox faixas)
  - Se sim: Valor total? (combobox faixas)
- Possui Frota? (sim/não)
  - Se sim: Tipo (combobox: Mista, Caminhões, Carros, Motos)
  - Se sim: Quantidade (numérico)
  - Se sim: Valor da frota quitada (combobox faixas)

### Seção 2: Localização
- CEP (com autocomplete)
- Rua
- Número e Complemento
- Bairro
- Cidade
- País

### Seção 3: Marketing
- Utiliza mídia para divulgação? (sim/não)
  - Se sim: Qual? (combobox múltipla: Jornais, Revistas, Internet, TV, Rádio, Panfletos)

### Seção 4: Situação Fiscal
- Dívidas de impostos? (sim/não)
  - Se sim: Valor total (combobox faixas)
- Dívidas particulares/empréstimos? (sim/não)
  - Se sim: Valor total (combobox faixas)

### Seção 5: Análise do Vendedor
- Quanto vale seu negócio? (texto memorando)
- Por que quer vender? (texto memorando)

---

## Módulo: Planos de Consultoria

### Plano Gold - R$ 3.000,00/mês (mínimo 3 meses)

**Benefícios:**
- 8 anúncios mensais destacados em jornais de grande circulação e econômicos no Brasil e exterior
- Banner exclusivo em sites parceiros
- Confecção de dossiê de apresentação detalhado e exclusivo da empresa
- Acesso garantido no site ao andamento da negociação (quantas apresentações, quantidade de likes, etc.)
- Apresentação detalhada da empresa aos investidores cadastrados no site Sobybs
- Levantamento de garantias, certidões negativas e busca de nome negativo dos compradores interessados
- Assessoria jurídica e contábil do corpo de advogados e contadores

### Plano Silver - R$ 1.800,00/mês (mínimo 3 meses)

**Benefícios:**
- 4 anúncios mensais destacados em jornais de grande circulação ou exterior
- Banner compartilhado em sites parceiros
- Confecção de apresentação detalhada e exclusiva da empresa
- Acesso garantido no site ao andamento da negociação (quantas apresentações, quantidade de likes, etc.)
- Apresentação detalhada da empresa aos investidores cadastrados no site Sobybs
- Assessoria jurídica e contábil do corpo de advogados e contadores
- Levantamento de garantias e busca de nome negativo dos compradores interessados

### Plano Bronze - R$ 500,00/mês (mínimo 3 meses)

**Benefícios:**
- 2 anúncios mensais destacados em jornais de grande circulação da praça da empresa
- Acesso garantido no site ao andamento da negociação (quantas apresentações, quantidade de likes, etc.)
- Apresentação da empresa aos investidores cadastrados no site Sobybs
- Pareceres jurídico e contábil do corpo de advogados e contadores
- Busca de nome negativo dos compradores interessados

### Campos do Banco de Dados (tabela subscriptions):
- **user_id**: ID do usuário
- **plan_type**: (gold, silver, bronze)
- **monthly_value**: Valor mensal do plano
- **start_date**: Data de início
- **end_date**: Data de término
- **status**: (active, cancelled, expired, pending_payment)
- **payment_method**: (credit_card, debit_card, bank_transfer, boleto)
- **auto_renew**: Renovação automática (boolean)
- **ads_used_this_month**: Quantidade de anúncios já utilizados no mês
- **ads_limit**: Limite de anúncios do plano (8, 4 ou 2)
- **next_billing_date**: Próxima data de cobrança
- **created_at**: Data de criação
- **updated_at**: Última atualização

### Página de Seleção de Planos:
- Cards comparativos lado a lado
- Destaque visual para o plano recomendado (Silver ou Gold)
- Lista de benefícios com ícones check
- Botão "Contratar" em cada card
- Badge "Mais Popular" no plano Silver
- Badge "Melhor Custo-Benefício" no plano Bronze
- Badge "Completo" no plano Gold
- Cálculo automático do valor trimestral (mínimo 3 meses)
- Link para "Comparar Planos" com tabela detalhada

---

## Módulo: Valuation IA

### Campos de Entrada (já coletados no cadastro):
- Faturamento Bruto Mensal
- Despesas Fixas Mensais
- Lucro Líquido Mensal (%)
- Número de Funcionários
- Tempo de Atuação
- Valor de Ativos (imóveis + frota)
- Segmento de Mercado
- Localização

### Campos de Saída (gerados pela IA):
- **Valuation Estimado**: Valor principal calculado
- **Faixa de Valor**: Mínimo e máximo recomendados
- **Múltiplo de Faturamento**: Ex: 2.5x o faturamento anual
- **Múltiplo de EBITDA**: Se aplicável
- **Score de Atratividade**: 1-10 baseado em características
- **Análise Comparativa**: Comparação com empresas similares do setor
- **Fatores Positivos**: Lista de pontos fortes que aumentam valor
- **Fatores de Risco**: Lista de pontos que podem diminuir valor
- **Recomendações**: Sugestões para aumentar valor antes da venda
- **Data da Avaliação**: Timestamp do cálculo
- **Confiabilidade**: Percentual de confiança na estimativa

### Informações Complementares:
- **Tendências de Mercado**: Para o segmento específico
- **Demanda Regional**: Interesse de compradores na região
- **Tempo Médio de Venda**: Para empresas similares
- **Histórico de Transações**: Referências de negócios fechados no setor

---

## Módulo: Documentos

### Estrutura de Pastas (por negociação):
```
/empresa-[id]/
  /cadastrais/          # RG, CPF, Contrato Social, etc.
  /fiscais/             # IR, Balanços, Certidões
  /patrimoniais/        # Escrituras, registros de veículos
  /contratos/           # Contratos gerados pela plataforma
  /propostas/           # Propostas de compradores
  /comunicacoes/        # Emails, atas de reunião
  /due-diligence/       # Documentos de análise jurídica/contábil
  /outros/              # Diversos
```

### Campos de Metadados (para cada documento):
- **Nome do Arquivo**: Automático do upload
- **Tipo de Documento**: (combobox: RG, CPF, Contrato Social, Balanço, Certidão, Proposta, etc.)
- **Categoria**: (combobox das pastas acima)
- **Data de Upload**: Automático
- **Usuário que fez Upload**: Automático (Admin/Operador/Cliente)
- **Data do Documento**: Campo manual (quando foi emitido)
- **Descrição**: Texto curto opcional
- **Status**: (Pendente Análise, Aprovado, Rejeitado, Expirado)
- **Visibilidade**: (Privado, Visível para Comprador Autorizado, Público)
- **Data de Expiração**: Opcional (para certidões com validade)
- **Tamanho**: Automático
- **Hash MD5**: Para verificação de integridade

### Controles de Acesso:
- **Documentos Sensíveis**: Visíveis apenas após NDA assinado
- **Documentos Públicos**: Visíveis no card do marketplace (fotos, vídeo pitch)
- **Documentos Restritos**: Apenas Admin e Operador designado
- **Log de Acessos**: Registro de quem visualizou cada documento e quando

### Funcionalidades:
- Upload múltiplo (drag & drop)
- Preview online (PDF, imagens)
- Download individual ou em lote (ZIP)
- Versionamento (histórico de versões do mesmo documento)
- Comentários/anotações por documento
- Notificações quando novos documentos são adicionados
- Checklist de documentos obrigatórios por etapa do workflow

---

## Módulo: Marketplace

### Card Público da Empresa (dados anônimos):
- **Título**: "Empresa de [Segmento] em [Região]"
- **Código**: ID único (ex: "EMP-12345")
- **Segmento**: Comércio, Serviços, Indústria, Tecnologia
- **Região**: Cidade/Estado (sem endereço completo)
- **Tempo de Atuação**: Faixa (Ex: "10-15 anos")
- **Faturamento Bruto Mensal**: Faixa (Ex: "R$ 50k-100k")
- **Faixa de Preço Pedido**: Ex: "R$ 500k - R$ 800k"
- **Número de Funcionários**: Faixa (Ex: "10-20")
- **Status**: (Disponível, Em Negociação, Vendido)
- **Destaques**: Tags (Ex: "Lucrativa", "Sem Dívidas", "Marca Forte", "Boa Localização")
- **Foto da Fachada**: Opcional, sem identificação
- **Descrição Resumida**: Texto curto sem identificar razão social
- **Data de Listagem**: Quando foi publicado

### Filtros do Marketplace:
- Segmento (múltipla escolha)
- Região/Estado (múltipla escolha)
- Faixa de Faturamento
- Faixa de Preço
- Tempo de Atuação
- Número de Funcionários
- Possui Imóveis (sim/não)
- Possui Frota (sim/não)
- Status (Disponível, Recém Listadas)
- Ordenação (Mais Recentes, Menor Preço, Maior Faturamento)

### Ações do Comprador:
- **Manifestar Interesse**: Botão que envia solicitação
- **Adicionar aos Favoritos**: Salvar para ver depois
- **Solicitar Detalhes**: Pedir acesso a informações confidenciais (requer aprovação)
- **Compartilhar**: Link para enviar a sócios/parceiros
- **Comparar**: Selecionar até 3 empresas para comparação lado a lado

### Informações Detalhadas (após aprovação):
Após comprador ser aprovado e assinar NDA:
- Razão Social
- CNPJ
- Endereço Completo
- Nome dos Sócios
- Valores Exatos (não em faixas)
- Documentos Fiscais
- Demonstrativos Financeiros
- Detalhes de Ativos
- Contratos Principais
- Lista de Clientes/Fornecedores (se autorizado)

---

## Recomendações de Implementação

1. **Priorize a segurança**: Implemente RLS (Row Level Security) no banco de dados para garantir que cada usuário só acesse seus próprios dados
2. **Workflow visual**: Crie um indicador visual do estágio atual (1-8) em todas as páginas
3. **Validações progressivas**: Valide campos conforme o usuário preenche, não apenas no submit
4. **Salvamento automático**: Auto-save a cada X segundos para não perder dados
5. **Mobile-first**: Garanta que todos os formulários funcionem bem em dispositivos móveis
6. **Onboarding**: Crie um tour guiado para novos usuários entenderem o fluxo
7. **Notificações em tempo real**: WebSockets ou polling para avisar sobre novos interessados/mensagens
8. **Backup de documentos**: Redundância no armazenamento de documentos críticos
9. **Logs de auditoria**: Registre todas as ações importantes para compliance
10. **Templates de documentos**: Usar docxtemplater ou similar para gerar contratos com dados preenchidos
