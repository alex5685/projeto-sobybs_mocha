'use client';

import { ArrowRight, Building2, TrendingUp, Shield, Users } from 'lucide-react';

export default function Home() {
  const redirectToLogin = () => {
    window.location.href = '/account/signin';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center">
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs Logo"
                className="h-16 w-auto"
              />
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="#como-funciona"
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                Como Funciona
              </a>
              <a
                href="/about"
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                Sobre
              </a>
              <a
                href="/subscription-plans"
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                Planos
              </a>
              <button
                onClick={redirectToLogin}
                className="px-6 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg"
              >
                Entrar
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 bg-[#00A9E0]/10 text-[#00A9E0] rounded-full text-sm font-semibold">
                Plataforma Segura de M&A
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Venda ou Compre Seu Negócio com
              <span className="bg-gradient-to-r from-primary to-[#1CB5E0] bg-clip-text text-transparent">
                {' '}
                Segurança
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              O marketplace completo para fusões e aquisições de PMEs. Gerencie todo o ciclo de vida
              da transação com workflow automatizado e máxima proteção de dados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={redirectToLogin}
                className="px-8 py-4 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-lg font-semibold"
              >
                <span>Começar Agora</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#como-funciona"
                className="px-8 py-4 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-all shadow-md hover:shadow-lg border border-border text-lg font-semibold text-center"
              >
                Saber Mais
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00A9E0] to-[#FFD700] rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-card rounded-2xl shadow-2xl p-8 border border-border">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#00A9E0]/10 to-[#1CB5E0]/10 rounded-xl">
                  <div className="p-3 bg-[#00A9E0] rounded-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Empresas Listadas</div>
                    <div className="text-2xl font-bold text-foreground">150+</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-accent/20 to-accent/30 rounded-xl">
                  <div className="p-3 bg-accent rounded-lg">
                    <TrendingUp className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Transações Fechadas</div>
                    <div className="text-2xl font-bold text-foreground">R$ 45M+</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-secondary to-secondary/80 rounded-xl">
                  <div className="p-3 bg-muted rounded-lg">
                    <Users className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Usuários Ativos</div>
                    <div className="text-2xl font-bold text-foreground">500+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Por Que Escolher o Sobybs?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tecnologia de ponta e segurança máxima para suas transações de M&A
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-[#1CB5E0] rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Segurança Total</h3>
            <p className="text-muted-foreground leading-relaxed">
              Proteção de dados sensíveis com Row Level Security. Seus documentos e informações
              confidenciais ficam protegidos até a autorização.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-accent-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Valuation com IA</h3>
            <p className="text-muted-foreground leading-relaxed">
              Estimativa de valor da empresa utilizando inteligência artificial. Análise de
              múltiplos e tendências de mercado em segundos.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-secondary to-muted rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7 text-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Workflow Completo</h3>
            <p className="text-muted-foreground leading-relaxed">
              Gestão do ciclo completo da transação em 8 estágios. Do cadastro ao fechamento, tudo
              em uma única plataforma.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary to-[#1CB5E0] rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">Pronto para Começar?</h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Cadastre-se agora e tenha acesso à plataforma mais completa de M&A para PMEs do Brasil.
          </p>
          <button
            onClick={redirectToLogin}
            className="px-10 py-4 bg-background text-primary rounded-xl hover:bg-background/80 transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
          >
            Criar Conta Gratuita
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground mt-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs Logo"
                className="h-10 w-auto mb-4"
              />
              <p className="text-sm text-muted-foreground/70">Sell Or Buy Your Business</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Marketplace
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Valuation IA
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-sm text-center text-muted-foreground/70">
            © 2024 Sobybs. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
