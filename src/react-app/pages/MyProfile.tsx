import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@getmocha/users-service/react";
import {
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  Plus,
  Eye,
  Loader2,
  ArrowLeft,
  DollarSign,
  Globe,
  Lock,
} from "lucide-react";

interface Business {
  id: string;
  alias_name: string;
  sector: string;
  status_workflow: string;
  is_public: number;
  created_at: string;
  ramo_atividade: string;
  segmento: string;
  faturamento_mensal: string;
  cidade: string;
  pais: string;
}

interface Profile {
  user_type: string;
  full_name: string;
  email: string;
}

export default function MyProfile() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile
        const profileRes = await fetch("/api/profiles/me");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch businesses
        const businessRes = await fetch("/api/business/my-businesses");
        if (businessRes.ok) {
          const data = await businessRes.json();
          setBusinesses(data.businesses || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const togglePublishStatus = async (businessId: string, currentStatus: number) => {
    setPublishingId(businessId);
    try {
      const response = await fetch(`/api/business/${businessId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: currentStatus === 1 ? 0 : 1 }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === businessId ? { ...b, is_public: data.is_public } : b
          )
        );
      } else {
        alert("Erro ao atualizar status de publicação");
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("Erro ao atualizar status de publicação");
    } finally {
      setPublishingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      cadastro: { label: "Cadastro", color: "bg-blue-100 text-blue-800" },
      adesao: { label: "Adesão", color: "bg-yellow-100 text-yellow-800" },
      negociacao: { label: "Negociação", color: "bg-purple-100 text-purple-800" },
      fechado: { label: "Fechado", color: "bg-green-100 text-green-800" },
    };

    const config = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getUserTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      vendedor: "Vendedor",
      comprador: "Comprador",
      hibrido: "Híbrido",
      admin: "Administrador",
      basico: "Básico",
    };
    return typeMap[type] || type;
  };

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

  const isVendedor = profile?.user_type === "vendedor" || profile?.user_type === "hibrido" || profile?.user_type === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <img
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png"
                alt="Sobybs"
                className="h-10 w-auto"
              />
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile?.full_name}</h1>
              <p className="text-gray-600 mb-4">{profile?.email}</p>
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg font-semibold">
                {getUserTypeLabel(profile?.user_type || "")}
              </span>
            </div>
            {isVendedor && (
              <button
                onClick={() => navigate("/business-registration")}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nova Empresa</span>
              </button>
            )}
          </div>
        </div>

        {/* Businesses Section */}
        {isVendedor && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Minhas Empresas</h2>
              <span className="text-gray-600">
                {businesses.length} {businesses.length === 1 ? "empresa cadastrada" : "empresas cadastradas"}
              </span>
            </div>

            {businesses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhuma empresa cadastrada
                </h3>
                <p className="text-gray-600 mb-6">
                  Comece cadastrando sua primeira empresa para oferecer ao mercado
                </p>
                <button
                  onClick={() => navigate("/business-registration")}
                  className="px-8 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Cadastrar Empresa</span>
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-100 group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#00A9E0] transition-colors">
                            {business.alias_name || business.ramo_atividade}
                          </h3>
                          <p className="text-sm text-gray-600">{business.segmento}</p>
                        </div>
                        {getStatusBadge(business.status_workflow)}
                      </div>

                      <div className="space-y-3 mb-6">
                        {business.cidade && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span>
                              {business.cidade}, {business.pais || "Brasil"}
                            </span>
                          </div>
                        )}

                        {business.faturamento_mensal && (
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{business.faturamento_mensal}</span>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>
                            Cadastrado em {new Date(business.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Publication Status Toggle */}
                        <button
                          onClick={() => togglePublishStatus(business.id, business.is_public)}
                          disabled={publishingId === business.id}
                          className={`w-full px-4 py-2 rounded-lg transition-all font-semibold text-sm flex items-center justify-center space-x-2 ${
                            business.is_public === 1
                              ? "bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100"
                              : "bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100"
                          } ${publishingId === business.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {publishingId === business.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Atualizando...</span>
                            </>
                          ) : business.is_public === 1 ? (
                            <>
                              <Globe className="w-4 h-4" />
                              <span>Publicada no Marketplace</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>Clique para Publicar</span>
                            </>
                          )}
                        </button>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => navigate(`/business/${business.id}`)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all font-semibold text-sm flex items-center justify-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Detalhes</span>
                          </button>
                          <button
                            onClick={() => navigate(`/valuation?business=${business.id}`)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold text-sm flex items-center justify-center"
                            title="Valuation IA"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* For Compradores - Show interested businesses placeholder */}
        {!isVendedor && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Empresas de Interesse</h3>
            <p className="text-gray-600 mb-6">
              Em breve você poderá visualizar as empresas que demonstrou interesse
            </p>
            <button
              onClick={() => navigate("/marketplace")}
              className="px-8 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              Explorar Marketplace
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
