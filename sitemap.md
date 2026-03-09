# Mapa do Site - VendeAgora

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     ÁREA PÚBLICA                             │
│  Home → Sobre → FAQ → Marketplace → Detalhes da Empresa     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   AUTENTICAÇÃO                               │
│         Cadastro → Login → Callback → Setup Perfil          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  ÁREA AUTENTICADA                            │
│              (Depende do tipo de perfil)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. MÓDULO PÚBLICO (Não requer autenticação)

### 1.1 Home (`/`)
**Arquivo:** `src/react-app/pages/Home.tsx`
**Função:** Página inicial do site
**Navegação:**
- → `/cadastro` (Cadastro)
- → `/sobre` (Sobre)
- → `/faq` (FAQ)
- → `/marketplace` (Marketplace)
- → `/planos` (Planos de Assinatura)

**Dependências:** Nenhuma

---

### 1.2 Sobre (`/sobre`)
**Arquivo:** `src/react-app/pages/About.tsx`
**Função:** Informações sobre a plataforma
**Navegação:**
- → `/` (Home)
- → `/cadastro` (Cadastro)

**Dependências:** Nenhuma

---

### 1.3 FAQ (`/faq`)
**Arquivo:** `src/react-app/pages/FAQ.tsx`
**Função:** Perguntas frequentes
**Navegação:**
- → `/` (Home)
- → `/cadastro` (Cadastro)

**Dependências:** Nenhuma

---

### 1.4 Marketplace (`/marketplace`)
**Arquivo:** `src/react-app/pages/Marketplace.tsx`
**Função:** Listagem pública de empresas à venda (dados anônimos)
**Backend:** `GET /api/business/public`
**Navegação:**
- → `/` (Home)
- → `/empresa/:id` (Detalhes da Empresa - apenas empresas públicas)
- → `/cadastro` (Cadastro para manifestar interesse)

**Dependências:**
- Backend: `/src/backend/routes/business.ts` (endpoint público)
- Banco de dados: tabela `businesses` (is_public = 1)

---

### 1.5 Detalhes da Empresa (`/empresa/:id`)
**Arquivo:** `src/react-app/pages/BusinessDetail.tsx`
**Função:** Visualização detalhada de uma empresa
**Controle de Acesso:**
- Empresa pública: qualquer pessoa pode ver
- Empresa privada: apenas owner, admin ou usuários autorizados

**Backend:** 
- `GET /api/business/:id` (detalhes)
- `GET /api/business/:id/images` (imagens)

**Navegação:**
- → `/marketplace` (voltar ao marketplace)
- → `/dashboard` (se autenticado e for owner)
- → `/empresa/:id/imagens` (gerenciar imagens - apenas owner)

**Dependências:**
- Backend: `/src/backend/routes/business.ts`
- Banco de dados: tabelas `businesses`, `business_details`

---

## 2. MÓDULO DE AUTENTICAÇÃO

### 2.1 Cadastro (`/cadastro`)
**Arquivo:** `src/react-app/pages/UserRegistration.tsx`
**Função:** Cadastro de novos usuários (PF ou PJ)
**Fluxo:**
1. Escolha entre Pessoa Física ou Pessoa Jurídica
2. Preenchimento dos dados
3. Criação da conta
4. Redirecionamento para `/auth/callback`

**Backend:** `POST /api/auth/register`
**Navegação:**
- → `/auth/callback` (após cadastro bem-sucedido)

**Dependências:**
- Backend: `/src/backend/routes/auth.ts`
- Banco de dados: tabela `users`

---

### 2.2 Auth Callback (`/auth/callback`)
**Arquivo:** `src/react-app/pages/AuthCallback.tsx`
**Função:** Página de redirecionamento após login/cadastro
**Fluxo:**
1. Verifica se usuário tem perfil configurado
2. Se não tem perfil → redireciona para `/perfil-setup`
3. Se tem perfil → redireciona para `/dashboard`

**Backend:** `GET /api/users/me`
**Navegação:**
- → `/perfil-setup` (se perfil não configurado)
- → `/dashboard` (se perfil já configurado)

**Dependências:**
- Hook: `src/react-app/hooks/useProfile.ts`

---

### 2.3 Setup de Perfil (`/perfil-setup`)
**Arquivo:** `src/react-app/pages/ProfileSetup.tsx`
**Função:** Configuração do perfil do usuário após cadastro
**Opções de Perfil:**
- Básico (gratuito)
- Comprador
- Vendedor
- Híbrido (Comprador + Vendedor)

**Backend:** `POST /api/profiles`
**Navegação:**
- → `/dashboard` (após configuração concluída)

**Dependências:**
- Backend: `/src/backend/routes/profiles.ts`
- Banco de dados: tabela `user_profiles`

---

## 3. MÓDULO DASHBOARD (Área Autenticada)

### 3.1 Dashboard (`/dashboard`)
**Arquivo:** `src/react-app/pages/Dashboard.tsx`
**Função:** Painel principal do usuário (varia conforme o perfil)
**Controle de Acesso:** Requer autenticação

**Visualização por Perfil:**
- **Básico:** Visualização limitada, convite para upgrade
- **Vendedor:** Minhas empresas cadastradas, cadastrar nova empresa
- **Comprador:** Empresas favoritas, propostas enviadas
- **Híbrido:** Combinação Vendedor + Comprador
- **Admin:** Acesso completo + link para painel admin

**Backend:**
- `GET /api/users/me` (dados do usuário)
- `GET /api/business/my` (empresas do usuário - se vendedor)

**Navegação:**
- → `/cadastrar-empresa` (Vendedor/Híbrido)
- → `/empresa/:id` (visualizar empresas próprias)
- → `/meu-perfil` (editar perfil)
- → `/planos` (upgrade de plano)
- → `/admin` (apenas Admin)

**Dependências:**
- Hook: `src/react-app/hooks/useProfile.ts`
- Backend: `/src/backend/routes/users.ts`, `/src/backend/routes/business.ts`

---

## 4. MÓDULO DE EMPRESAS (Área Autenticada)

### 4.1 Cadastrar Empresa (`/cadastrar-empresa`)
**Arquivo:** `src/react-app/pages/BusinessRegistration.tsx`
**Função:** Formulário completo de cadastro de empresa
**Controle de Acesso:** Apenas perfis Vendedor, Híbrido e Admin

**Campos do Formulário:**
- Dados básicos (nome, CNPJ, segmento, etc.)
- Dados financeiros
- Localização
- Informações de contato
- Visibilidade (público/privado)

**Backend:** `POST /api/business`
**Navegação:**
- → `/empresa/:id` (após cadastro bem-sucedido)
- → `/dashboard` (cancelar)

**Dependências:**
- Backend: `/src/backend/routes/business.ts`
- Banco de dados: tabelas `businesses`, `business_details`
- Proteção de rota: verifica tipo de perfil

---

### 4.2 Gerenciar Imagens da Empresa (`/empresa/:id/imagens`)
**Arquivo:** `src/react-app/pages/ManageBusinessImages.tsx`
**Função:** Upload e gestão de imagens da empresa
**Controle de Acesso:** Apenas owner da empresa ou Admin

**Funcionalidades:**
- Upload de imagens (até 10)
- Definir imagem principal
- Excluir imagens
- Pré-visualização

**Backend:**
- `GET /api/business/:id/images` (listar imagens)
- `POST /api/files/business/:id/image` (upload)
- `PUT /api/files/image/:id/primary` (definir principal)
- `DELETE /api/files/image/:id` (excluir)

**Navegação:**
- → `/empresa/:id` (voltar para detalhes)

**Dependências:**
- Backend: `/src/backend/routes/files.ts`
- Storage: R2 Bucket (armazenamento de imagens)
- Banco de dados: tabela `business_images`

---

### 4.3 Valuation IA (`/empresa/:id/valuation`)
**Arquivo:** `src/react-app/pages/AIValuation.tsx`
**Função:** Análise de valuation da empresa usando IA
**Controle de Acesso:** Apenas owner da empresa ou Admin
**Status:** Em desenvolvimento

**Funcionalidades Planejadas:**
- Análise automática de dados financeiros
- Cálculo de múltiplos (EBITDA, receita)
- Comparação com mercado
- Geração de relatório

**Backend:** `POST /api/business/:id/valuation` (a ser criado)
**Navegação:**
- → `/empresa/:id` (voltar para detalhes)

**Dependências:**
- Dados financeiros obrigatórios na empresa
- Integração com IA (a ser definida)
- Todo #42: Estruturar valuation IA

---

## 5. MÓDULO DE DOCUMENTOS (Área Autenticada)

### 5.1 Documentos (`/documentos`)
**Arquivo:** `src/react-app/pages/Documents.tsx`
**Função:** Geração de documentos para empresas
**Controle de Acesso:** Requer autenticação

**Tipos de Documento:**
- NDA (Acordo de Confidencialidade)
- Proposta de Compra
- Recibo de Pagamento

**Backend:**
- `POST /api/documents/nda` (gerar NDA)
- `POST /api/documents/proposal` (gerar proposta)
- `POST /api/documents/receipt` (gerar recibo)

**Navegação:**
- → `/dashboard` (voltar ao dashboard)

**Dependências:**
- Backend: `/src/backend/routes/documents.ts`
- Geração de PDF (biblioteca interna)

---

## 6. MÓDULO DE PAGAMENTOS (Área Autenticada)

### 6.1 Planos de Assinatura (`/planos`)
**Arquivo:** `src/react-app/pages/SubscriptionPlans.tsx`
**Função:** Visualização e contratação de planos

**Planos Disponíveis:**
- Básico (Gratuito)
- Comprador
- Vendedor
- Híbrido

**Backend:** `POST /api/payments/create-link` (criar link de pagamento)
**Navegação:**
- → URL externa (Stripe/gateway de pagamento)
- → `/dashboard` (após conclusão)

**Dependências:**
- Backend: `/src/backend/routes/payments.ts`
- Banco de dados: tabela `payment_links`
- Integração: Gateway de pagamento (Stripe - a implementar)
- Todo #13: Integrar gateway de pagamento

---

## 7. MÓDULO DE PERFIL (Área Autenticada)

### 7.1 Meu Perfil (`/meu-perfil`)
**Arquivo:** `src/react-app/pages/MyProfile.tsx`
**Função:** Visualização e edição de dados do perfil
**Controle de Acesso:** Requer autenticação

**Informações Exibidas:**
- Dados pessoais/empresariais
- Tipo de perfil
- Status da assinatura
- Empresas cadastradas (se vendedor)

**Backend:**
- `GET /api/users/me` (dados do usuário)
- `PUT /api/users/me` (atualizar dados)

**Navegação:**
- → `/dashboard` (voltar ao dashboard)
- → `/planos` (alterar plano)

**Dependências:**
- Backend: `/src/backend/routes/users.ts`
- Hook: `src/react-app/hooks/useProfile.ts`

---

## 8. MÓDULO ADMINISTRATIVO (Apenas Admin)

### 8.1 Painel Admin (`/admin`)
**Arquivo:** `src/react-app/pages/AdminPanel.tsx`
**Função:** Painel de administração da plataforma
**Controle de Acesso:** Apenas perfil Admin

**Funcionalidades:**
- Estatísticas gerais (usuários, empresas, receitas)
- Listagem de usuários
- Listagem de empresas
- Gestão de equipe
- Controle de pagamentos

**Backend:**
- `GET /api/admin/stats` (estatísticas)
- `GET /api/admin/users` (listar usuários)
- `GET /api/admin/businesses` (listar empresas)
- `GET /api/team` (membros da equipe)
- `POST /api/team/invite` (convidar membro)

**Navegação:**
- → `/dashboard` (voltar ao dashboard)
- → `/empresa/:id` (visualizar empresas)

**Dependências:**
- Backend: `/src/backend/routes/admin.ts`, `/src/backend/routes/team.ts`
- Banco de dados: todas as tabelas
- Proteção de rota: verifica se user_type = 'admin'

---

## 9. ESTRUTURA DO BACKEND (API Routes)

### 9.1 Autenticação (`/api/auth/*`)
**Arquivo:** `src/backend/routes/auth.ts`
**Endpoints:**
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

---

### 9.2 Usuários (`/api/users/*`)
**Arquivo:** `src/backend/routes/users.ts`
**Endpoints:**
- `GET /api/users/me` - Dados do usuário atual
- `PUT /api/users/me` - Atualizar dados

---

### 9.3 Perfis (`/api/profiles/*`)
**Arquivo:** `src/backend/routes/profiles.ts`
**Endpoints:**
- `POST /api/profiles` - Criar/atualizar perfil
- `GET /api/profiles/:userId` - Buscar perfil

---

### 9.4 Empresas (`/api/business/*`)
**Arquivo:** `src/backend/routes/business.ts`
**Endpoints:**
- `GET /api/business/public` - Listar empresas públicas
- `GET /api/business/my` - Minhas empresas
- `GET /api/business/:id` - Detalhes da empresa
- `POST /api/business` - Cadastrar empresa
- `PUT /api/business/:id` - Atualizar empresa
- `DELETE /api/business/:id` - Excluir empresa
- `GET /api/business/:id/images` - Listar imagens

---

### 9.5 Arquivos (`/api/files/*`)
**Arquivo:** `src/backend/routes/files.ts`
**Endpoints:**
- `POST /api/files/business/:id/image` - Upload de imagem
- `POST /api/files/business/:id/document` - Upload de documento
- `PUT /api/files/image/:id/primary` - Definir imagem principal
- `DELETE /api/files/image/:id` - Excluir imagem
- `DELETE /api/files/document/:id` - Excluir documento

**Dependências:**
- R2 Bucket (storage)
- Tabelas: `business_images`, `business_documents`

---

### 9.6 Documentos (`/api/documents/*`)
**Arquivo:** `src/backend/routes/documents.ts`
**Endpoints:**
- `POST /api/documents/nda` - Gerar NDA
- `POST /api/documents/proposal` - Gerar proposta
- `POST /api/documents/receipt` - Gerar recibo

---

### 9.7 Pagamentos (`/api/payments/*`)
**Arquivo:** `src/backend/routes/payments.ts`
**Endpoints:**
- `POST /api/payments/create-link` - Criar link de pagamento
- `GET /api/payments/links` - Listar links
- `PUT /api/payments/:id/status` - Atualizar status

**Dependências:**
- Tabela: `payment_links`
- Integração futura: Stripe

---

### 9.8 Equipe (`/api/team/*`)
**Arquivo:** `src/backend/routes/team.ts`
**Endpoints:**
- `GET /api/team` - Listar membros
- `POST /api/team/invite` - Convidar membro
- `PUT /api/team/:id/role` - Atualizar função
- `DELETE /api/team/:id` - Remover membro

**Controle de Acesso:** Apenas Admin

---

### 9.9 Admin (`/api/admin/*`)
**Arquivo:** `src/backend/routes/admin.ts`
**Endpoints:**
- `GET /api/admin/stats` - Estatísticas gerais
- `GET /api/admin/users` - Listar todos os usuários
- `GET /api/admin/businesses` - Listar todas as empresas

**Controle de Acesso:** Apenas Admin

---

## 10. BANCO DE DADOS (D1 - SQLite)

### Tabelas Principais:

**users**
- Dados de autenticação e informações básicas
- Relaciona com: `user_profiles`, `businesses`

**user_profiles**
- Tipo de perfil e configurações
- Tipos: basic, buyer, seller, hybrid, admin
- Relaciona com: `users`

**businesses**
- Dados básicos da empresa
- Relaciona com: `business_details`, `business_images`, `business_documents`, `users` (owner)

**business_details**
- Dados detalhados e financeiros da empresa
- Relaciona com: `businesses`

**business_images**
- Imagens das empresas (até 10 por empresa)
- Armazenamento: R2 Bucket
- Relaciona com: `businesses`

**business_documents**
- Documentos anexados às empresas
- Armazenamento: R2 Bucket
- Relaciona com: `businesses`

**payment_links**
- Links de pagamento gerados
- Relaciona com: `users`, `businesses`

**team_members**
- Membros da equipe administrativa
- Relaciona com: `users`

---

## 11. CONTROLE DE ACESSO POR PERFIL

### Básico (Gratuito)
✅ Acesso: Home, Sobre, FAQ, Marketplace (visualização)
✅ Pode: Ver empresas públicas
❌ Não pode: Cadastrar empresas, fazer propostas, acessar valuation

### Comprador
✅ Acesso: Tudo do Básico +
✅ Pode: Fazer propostas, salvar favoritos, gerar NDA
❌ Não pode: Cadastrar empresas para venda

### Vendedor
✅ Acesso: Tudo do Básico +
✅ Pode: Cadastrar empresas, gerenciar imagens, acessar valuation, gerar documentos
❌ Não pode: Fazer propostas em outras empresas

### Híbrido
✅ Acesso: Comprador + Vendedor (todas as funcionalidades)

### Admin
✅ Acesso: Tudo + Painel Admin
✅ Pode: Ver e editar tudo, gerenciar usuários, acessar estatísticas

---

## 12. FLUXOS PRINCIPAIS

### Fluxo 1: Novo Usuário Vendedor
```
Home → Cadastro (PJ) → Auth Callback → 
Setup Perfil (Vendedor) → Dashboard → 
Cadastrar Empresa → Empresa Detalhes → 
Gerenciar Imagens → Valuation IA
```

### Fluxo 2: Novo Usuário Comprador
```
Home → Marketplace → Empresa Detalhes (pública) → 
Cadastro (PF) → Auth Callback → 
Setup Perfil (Comprador) → Dashboard → 
Manifestar Interesse → Gerar NDA
```

### Fluxo 3: Upgrade de Plano
```
Dashboard → Meu Perfil → Planos → 
Selecionar Plano → Pagamento → 
Dashboard (com novos recursos)
```

### Fluxo 4: Administrador
```
Login → Dashboard → Admin Panel → 
Ver Estatísticas → Gerenciar Usuários/Empresas → 
Convidar Membro Equipe
```

---

## 13. DEPENDÊNCIAS ENTRE MÓDULOS

```
┌──────────────────┐
│   AUTENTICAÇÃO   │ ← Base para tudo
└────────┬─────────┘
         ↓
┌──────────────────┐
│     PERFIL       │ ← Define permissões
└────────┬─────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌──────────┐
│EMPRESAS │ │PAGAMENTOS│
└────┬────┘ └──────────┘
     ↓
┌─────────┐
│ARQUIVOS │
│ DOCS    │
│VALUATION│
└─────────┘
```

**Legenda:**
- Autenticação é pré-requisito para tudo
- Perfil define o que o usuário pode fazer
- Empresas dependem de perfil Vendedor/Híbrido
- Arquivos/Docs/Valuation dependem de empresas cadastradas
- Pagamentos independentes mas afetam o perfil

---

## 14. PRÓXIMOS MÓDULOS (Planejados)

Ver `docs/todo.md` para detalhes completos:

- ⏳ Upload massivo de empresas (CSV/JSON)
- ⏳ Valuation IA completo
- ⏳ Sistema de workflow de negociação
- ⏳ Notificações por email
- ⏳ Sistema de propostas e ofertas
- ⏳ Integração Stripe
- ⏳ Testes de segurança
- ⏳ Dashboard de assinatura
- ⏳ Relatórios administrativos

---

## 15. ASSETS E RECURSOS

### Armazenamento R2 (Cloudflare)
- Imagens de empresas
- Documentos anexados
- PDFs gerados

### Banco de Dados D1 (SQLite)
- Dados estruturados
- Relações entre entidades
- Migrations versionadas

### Secrets
- API Keys de serviços externos
- Configurações sensíveis
- Tokens de autenticação

---

**Última atualização:** Este documento será atualizado conforme novas funcionalidades forem implementadas.
