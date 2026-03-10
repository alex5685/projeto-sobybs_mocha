import { ArrowRight, Building2, TrendingUp, Shield, Users } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Home() {
  const { user, redirectToLogin, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header/Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center">
              <img 
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png" 
                alt="Sobybs Logo" 
                className="h-16 w-auto"
              />
            </div>
            <div className="flex items-center space-x-6">
              <a href="#como-funciona" className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors">
                Como Funciona
              </a>
              <a href="/about" className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors">
                Sobre
              </a>
              <a href="/subscription-plans" className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors">
                Planos
              </a>
              <button 
                onClick={redirectToLogin}
                disabled={isPending}
                className="px-6 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Venda ou Compre Seu Negócio com
              <span className="bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] bg-clip-text text-transparent"> Segurança</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              O marketplace completo para fusões e aquisições de PMEs. Gerencie todo o ciclo de vida da transação com workflow automatizado e máxima proteção de dados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={redirectToLogin}
                disabled={isPending}
                className="px-8 py-4 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Começar Agora</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg border border-gray-200 text-lg font-semibold">
                Saber Mais
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00A9E0] to-[#FFD700] rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#00A9E0]/10 to-[#1CB5E0]/10 rounded-xl">
                  <div className="p-3 bg-[#00A9E0] rounded-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Empresas Listadas</div>
                    <div className="text-2xl font-bold text-gray-900">150+</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFD700]/20 to-[#FFC700]/20 rounded-xl">
                  <div className="p-3 bg-[#FFD700] rounded-lg">
                    <TrendingUp className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Transações Fechadas</div>
                    <div className="text-2xl font-bold text-gray-900">R$ 45M+</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="p-3 bg-gray-600 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Usuários Ativos</div>
                    <div className="text-2xl font-bold text-gray-900">500+</div>
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Por Que Escolher o Sobybs?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tecnologia de ponta e segurança máxima para suas transações de M&A
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Segurança Total
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Proteção de dados sensíveis com Row Level Security. Seus documentos e informações confidenciais ficam protegidos até a autorização.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-gray-900" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Valuation com IA
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Estimativa de valor da empresa utilizando inteligência artificial. Análise de múltiplos e tendências de mercado em segundos.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Workflow Completo
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Gestão do ciclo completo da transação em 8 estágios. Do cadastro ao fechamento, tudo em uma única plataforma.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para Começar?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Cadastre-se agora e tenha acesso à plataforma mais completa de M&A para PMEs do Brasil.
          </p>
          <button 
            onClick={redirectToLogin}
            disabled={isPending}
            className="px-10 py-4 bg-white text-[#00A9E0] rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar Conta Gratuita
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img 
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png" 
                alt="Sobybs Logo" 
                className="h-10 w-auto mb-4"
              />
              <p className="text-sm text-gray-400">
                Sell Or Buy Your Business
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Marketplace</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Valuation IA</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center text-gray-500">
            © 2024 Sobybs. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
