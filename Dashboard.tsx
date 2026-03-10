import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router-dom";
import { LogOut, Building2, TrendingUp, FileText, Users, Loader2 } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { useEffect, useState } from "react";
import ValuationExpiredModal from "../components/ValuationExpiredModal";
import ConversionBanner from "../components/ConversionBanner";

interface ExpiredValuation {
  id: number;
  business_id: string;
  business_name: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [selectedExpiredValuation, setSelectedExpiredValuation] = useState<ExpiredValuation | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);

  useEffect(() => {
    if (!isLoading && user && !profile) {
      navigate("/profile-setup");
    }
  }, [user, profile, isLoading, navigate]);

  useEffect(() => {
    const checkExpiredValuations = async () => {
      if (!user) return;

      try {
        // Check for active plan
        const planResponse = await fetch("/api/subscriptions/active", {
          credentials: "include",
        });

        if (planResponse.ok) {
          const planData = await planResponse.json();
          setHasActivePlan(!!planData.subscription);
        }

        // Check for expired quick valuations
        const response = await fetch("/api/valuations/quick/expired", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.expired_valuations && data.expired_valuations.length > 0) {
            setSelectedExpiredValuation(data.expired_valuations[0]);
            setShowExpiredModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking expired valuations:", error);
      }
    };

    checkExpiredValuations();
  }, [user]);

  const handleMarkNotified = async () => {
    if (!selectedExpiredValuation) return;

    try {
      await fetch(`/api/valuations/${selectedExpiredValuation.id}/mark-notified`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error marking valuation as notified:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png" 
                alt="Sobybs Logo" 
                className="h-14 w-auto"
              />
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/my-profile")}
                className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors"
              >
                Meu Perfil
              </button>
              <button
                onClick={() => navigate("/about")}
                className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors"
              >
                Sobre
              </button>
              <button
                onClick={() => navigate("/subscription-plans")}
                className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors"
              >
                Planos
              </button>
              <button
                onClick={() => navigate("/faq")}
                className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors"
              >
                FAQ
              </button>
              {profile?.user_type === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                >
                  Admin
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {user.google_user_data.picture && (
                  <img
                    src={user.google_user_data.picture}
                    alt={user.google_user_data.name || user.email}
                    className="w-10 h-10 rounded-full border-2 border-[#00A9E0]"
                  />
                )}
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {user.google_user_data.name || user.email}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-[#00A9E0] hover:bg-gray-100 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Conversion Banner - Show if user doesn't have active plan */}
        {!hasActivePlan && (
          <ConversionBanner />
        )}

        {/* Expired Valuation Modal */}
        {showExpiredModal && selectedExpiredValuation && (
          <ValuationExpiredModal
            businessId={selectedExpiredValuation.business_id}
            businessName={selectedExpiredValuation.business_name}
            valuationId={selectedExpiredValuation.id}
            onClose={() => setShowExpiredModal(false)}
            onMarkNotified={handleMarkNotified}
          />
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bem-vindo ao Sobybs
          </h1>
          <p className="text-xl text-gray-600">
            {profile && (
              <span className="inline-block px-3 py-1 bg-[#00A9E0] text-white rounded-full text-sm font-semibold mr-2">
                {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
              </span>
            )}
            Gerencie seu portfólio e oportunidades
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div 
            onClick={() => navigate("/business-registration")}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cadastrar Empresa</h3>
            <p className="text-sm text-gray-600">Adicione sua empresa ao marketplace</p>
          </div>

          <div 
            onClick={() => navigate("/valuation")}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Valuation IA</h3>
            <p className="text-sm text-gray-600">Estime o valor da sua empresa</p>
          </div>

          <div 
            onClick={() => navigate("/documents")}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Documentos</h3>
            <p className="text-sm text-gray-600">Gerencie seus documentos</p>
          </div>

          <div 
            onClick={() => navigate("/marketplace")}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Marketplace</h3>
            <p className="text-sm text-gray-600">Explore oportunidades</p>
          </div>
        </div>

        {/* Profile Setup Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete seu Perfil</h2>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
            <p className="text-gray-700 mb-4">
              Para começar a usar a plataforma, você precisa selecionar seu tipo de perfil:
            </p>
            <ul className="space-y-2 mb-6 text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#00A9E0] rounded-full"></div>
                <span><strong>Básico:</strong> Acesso limitado ao marketplace</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#00A9E0] rounded-full"></div>
                <span><strong>Comprador:</strong> Explore e avalie empresas disponíveis</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#00A9E0] rounded-full"></div>
                <span><strong>Vendedor:</strong> Liste sua empresa para venda</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#00A9E0] rounded-full"></div>
                <span><strong>Híbrido:</strong> Compre e venda empresas</span>
              </li>
            </ul>
            <button 
              onClick={() => navigate("/profile-setup")}
              className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Configurar Perfil
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
