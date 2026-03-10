import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@getmocha/users-service/react";
import { useProfile } from "@/react-app/hooks/useProfile";
import { ArrowLeft, TrendingUp, Calendar, AlertCircle, Sparkles, Crown } from "lucide-react";

interface QuickValuation {
  id: number;
  business_id: string;
  valor_minimo: number;
  valor_maximo: number;
  multiplo_min: number;
  multiplo_max: number;
  metodo: string;
  segmento: string;
  lucro_liquido_mensal_estimado: number;
  lucro_liquido_anual_estimado: number;
  ativos_incluidos: number;
  created_at: string;
  expires_at: string;
}

interface Business {
  id: string;
  alias_name: string;
  sector: string;
}

export default function QuickValuation() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  
  const [valuation, setValuation] = useState<QuickValuation | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [incompleteData, setIncompleteData] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (profileLoading) {
      return;
    }

    // Check if user has required profile
    const allowedTypes = ["vendedor", "hibrido", "admin"];
    if (!profile || !allowedTypes.includes(profile.user_type)) {
      setUpgradeRequired(true);
      setIsLoading(false);
      return;
    }

    fetchValuation();
  }, [user, businessId, profile, profileLoading]);

  const fetchValuation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch business info
      const businessRes = await fetch(`/api/business/${businessId}`);
      if (businessRes.ok) {
        const data = await businessRes.json();
        setBusiness({
          id: data.business.business_id,
          alias_name: data.business.alias_name,
          sector: data.business.sector
        });
      }

      // Generate/fetch valuation
      const valuationRes = await fetch(`/api/business/${businessId}/quick-valuation`, {
        method: "POST",
      });

      if (valuationRes.ok) {
        const data = await valuationRes.json();
        setValuation(data.valuation);
      } else if (valuationRes.status === 403) {
        const errorData = await valuationRes.json();
        if (errorData.upgrade_required) {
          setUpgradeRequired(true);
        } else {
          setError(errorData.error || "Você não tem permissão para acessar esta funcionalidade");
        }
      } else if (valuationRes.status === 400) {
        const errorData = await valuationRes.json();
        if (errorData.incomplete_data) {
          setIncompleteData(true);
          setError(errorData.error);
        } else {
          setError(errorData.error || "Erro ao gerar valuation");
        }
      } else {
        const errorData = await valuationRes.json();
        setError(errorData.error || "Erro ao gerar valuation");
      }
    } catch (error) {
      console.error("Error fetching valuation:", error);
      setError("Erro ao carregar valuation");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Gerando valuation...</p>
        </div>
      </div>
    );
  }

  if (upgradeRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white border border-amber-200 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Upgrade Necessário</h2>
              <p className="text-slate-600 mb-4">
                O Valuation Rápido está disponível apenas para perfis Vendedor, Híbrido ou Admin
              </p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <p className="text-slate-600 text-center">
                Faça upgrade do seu plano para ter acesso ao Valuation Rápido gratuito e outras funcionalidades exclusivas.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => navigate("/subscription-plans")} 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Ver Planos
                </button>
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (incompleteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white border border-orange-200 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Dados Incompletos</h2>
              <p className="text-slate-600 mb-4">
                Precisamos de mais informações para gerar o valuation
              </p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-orange-900 text-sm">{error}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => navigate(`/business/${businessId}`)} 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Completar Cadastro
                </button>
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !valuation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white border border-red-200 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Erro</h2>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-900 text-sm">{error}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-600">Valuation Rápido (Gratuito)</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Business Info */}
        {business && (
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{business.alias_name}</h1>
            <p className="text-slate-600">{business.sector}</p>
          </div>
        )}

        {valuation && (
          <>
            {/* Main Valuation Card */}
            <div className="mb-6 border-2 border-emerald-200 shadow-xl rounded-lg overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Faixa de Valor Estimado</h2>
                    <p className="text-slate-600">Baseado em múltiplos de lucro e ativos</p>
                  </div>
                </div>
              </div>
              <div className="pt-8 pb-8 px-6">
                <div className="text-center mb-8">
                  <p className="text-5xl font-bold text-emerald-600 mb-2">
                    {formatCurrency(valuation.valor_minimo)} - {formatCurrency(valuation.valor_maximo)}
                  </p>
                  <p className="text-slate-500 text-lg">Valor de mercado estimado</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-600 mb-1">Lucro Líquido Mensal</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(valuation.lucro_liquido_mensal_estimado)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-600 mb-1">Lucro Líquido Anual</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(valuation.lucro_liquido_anual_estimado)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-600 mb-1">Ativos Incluídos</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(valuation.ativos_incluidos)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Metodologia:</span>
                    <span className="font-medium text-slate-900">{valuation.metodo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Segmento:</span>
                    <span className="font-medium text-slate-900">{valuation.segmento}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Múltiplo Aplicado:</span>
                    <span className="font-medium text-slate-900">{valuation.multiplo_min}x - {valuation.multiplo_max}x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Validade Comercial:
                    </span>
                    <span className="font-medium text-slate-900">{formatDate(valuation.expires_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="mb-6 border border-amber-200 bg-amber-50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-900 text-sm">
                Este é um valuation rápido e gratuito baseado em dados básicos. Para uma análise completa e detalhada com IA, 
                considere o <strong>Valuation Premium</strong>.
              </p>
            </div>

            {/* Upgrade CTA */}
            <div className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Quer mais detalhes?</h2>
                </div>
                <p className="text-slate-600 text-base mb-4">
                  O Valuation Premium oferece análise completa com IA
                </p>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Análise profunda de todos os dados financeiros e operacionais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Comparação com empresas similares do mercado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Relatório detalhado com pontos fortes e riscos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Recomendações para aumentar o valor da empresa</span>
                  </li>
                </ul>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => navigate(`/planos?source=valuation_quick&businessId=${businessId}&valuationId=${valuation.id}`)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex-1"
                  >
                    Contratar Valuation Premium
                  </button>
                  <button 
                    onClick={() => navigate(`/business/${businessId}`)}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Ver Empresa
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
