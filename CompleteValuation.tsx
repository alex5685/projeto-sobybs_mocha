import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@getmocha/users-service/react";
import {
  Download,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Calendar,
  BarChart3,
  Target,
} from "lucide-react";

interface Methodology {
  nome: string;
  valor: number;
  peso: number;
}

interface Risk {
  categoria: string;
  descricao: string;
  impacto: string;
  probabilidade: string;
}

interface Recommendation {
  titulo: string;
  prioridade: string;
  impacto_estimado: string;
  prazo?: string;
}

interface Intangibles {
  valor_marca: number;
  processos: number;
  capital_humano: number;
  total: number;
}

interface ValuationData {
  id: number;
  business_id: string;
  valor_estimado: number;
  valor_minimo: number;
  valor_maximo: number;
  nivel_incerteza_referencia: number;
  score_atratividade: number;
  metodologias: Methodology[];
  riscos: Risk[];
  recomendacoes: Recommendation[];
  intangiveis: Intangibles | null;
  last_updated: string;
  revisions_available: string;
  revisions_count: number;
}

interface ActivePlan {
  plan_type: string;
  status: string;
}

export default function CompleteValuation() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { user, isPending } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethodology, setSelectedMethodology] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !businessId) return;

      try {
        // Check for active plan
        const planResponse = await fetch("/api/subscriptions/active", {
          credentials: "include",
        });

        if (planResponse.ok) {
          const planData = await planResponse.json();
          if (planData.subscription) {
            setActivePlan(planData.subscription);
          } else {
            // No active plan, redirect to plans page
            navigate(`/planos?source=valuation_complete_locked&businessId=${businessId}`);
            return;
          }
        } else {
          navigate(`/planos?source=valuation_complete_locked&businessId=${businessId}`);
          return;
        }

        // Fetch complete valuation
        const valuationResponse = await fetch(
          `/api/business/${businessId}/complete-valuation`,
          {
            credentials: "include",
          }
        );

        if (valuationResponse.ok) {
          const data = await valuationResponse.json();
          setValuation(data.valuation);
        } else {
          const errorData = await valuationResponse.json();
          setError(errorData.error || "Erro ao carregar valuation");
        }
      } catch (err) {
        console.error("Error loading valuation:", err);
        setError("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, businessId, navigate]);

  const handleGeneratePDF = async () => {
    if (!businessId) return;

    setIsGeneratingPDF(true);
    try {
      const response = await fetch(`/api/business/${businessId}/generate-valuation-report`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Download the report
        window.location.href = `/api/reports/${data.report_id}/download`;
      } else {
        alert("Erro ao gerar relatório");
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Erro ao gerar relatório");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!businessId) return;

    setIsRequestingRevision(true);
    try {
      const response = await fetch(`/api/business/${businessId}/request-revision`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        alert("Revisão solicitada com sucesso! Você receberá uma atualização em breve.");
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao solicitar revisão");
      }
    } catch (err) {
      console.error("Error requesting revision:", err);
      alert("Erro ao solicitar revisão");
    } finally {
      setIsRequestingRevision(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando valuation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate("/dashboard")} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!valuation || !activePlan) {
    return null;
  }

  const planType = activePlan.plan_type;
  const isBronze = planType === "bronze";
  const isSilver = planType === "silver";
  const isGold = planType === "gold";

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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getPlanBadgeColor = () => {
    if (isBronze) return "bg-amber-100 text-amber-800";
    if (isSilver) return "bg-gray-200 text-gray-700";
    return "bg-[#FFD700]/20 text-gray-900";
  };

  const getPlanName = () => {
    if (isBronze) return "Bronze";
    if (isSilver) return "Silver";
    return "Gold";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png"
                alt="Sobybs Logo"
                className="h-14 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPlanBadgeColor()}`}>
                Plano {getPlanName()}
              </span>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => navigate("/dashboard")}>
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Valuation Completo</h1>
          <p className="text-gray-600">
            Análise detalhada de valor da empresa • Última atualização: {formatDate(valuation.last_updated)}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> Resultados dependem dos dados informados e do setor. Não constitui laudo ou
            garantia de valor.
          </p>
        </div>

        {/* Main Valuation Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Valor Mínimo</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valuation.valor_minimo)}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-xl">
              <p className="text-sm text-white/90 mb-2">Valor Estimado</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(valuation.valor_estimado)}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Valor Máximo</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valuation.valor_maximo)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Target className="w-8 h-8 text-[#00A9E0]" />
              <div>
                <p className="text-sm text-gray-600">Nível de Incerteza</p>
                <p className="text-xl font-bold text-gray-900">±{valuation.nivel_incerteza_referencia}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Score de Atratividade</p>
                <p className="text-xl font-bold text-gray-900">{valuation.score_atratividade}/10</p>
              </div>
            </div>
          </div>
        </div>

        {/* Methodologies Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-[#00A9E0]" />
            <h2 className="text-2xl font-bold text-gray-900">
              Metodologias de Valuation {isBronze && "(1 método)"}
              {isSilver && "(3 métodos)"}
              {isGold && "(5 métodos)"}
            </h2>
          </div>

          {valuation.metodologias.length > 1 && (
            <div className="flex gap-2 mb-6">
              {valuation.metodologias.map((method, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMethodology(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedMethodology === index
                      ? "bg-[#00A9E0] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {method.nome}
                </button>
              ))}
            </div>
          )}

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-4">
              {valuation.metodologias[selectedMethodology]?.nome}
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor Calculado:</span>
              <span className="text-2xl font-bold text-[#00A9E0]">
                {formatCurrency(valuation.metodologias[selectedMethodology]?.valor || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Peso na Média:</span>
              <span className="font-semibold text-gray-900">
                {((valuation.metodologias[selectedMethodology]?.peso || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {!isBronze && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                O valor final é calculado através da média ponderada de todas as metodologias aplicadas.
              </p>
            </div>
          )}
        </div>

        {/* Risks Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Análise de Riscos</h2>
          </div>

          <div className="space-y-4">
            {valuation.riscos.map((risk, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-2">
                      {risk.categoria}
                    </span>
                    <p className="font-semibold text-gray-900">{risk.descricao}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Impacto:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        risk.impacto === "alto"
                          ? "bg-red-100 text-red-800"
                          : risk.impacto === "médio" || risk.impacto === "medio"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {risk.impacto}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Probabilidade:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        risk.probabilidade === "alta"
                          ? "bg-red-100 text-red-800"
                          : risk.probabilidade === "média" || risk.probabilidade === "media"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {risk.probabilidade}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Recomendações</h2>
          </div>

          <div className="space-y-4">
            {valuation.recomendacoes.map((rec, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-[#00A9E0] transition">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{rec.titulo}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rec.prioridade === "alta"
                        ? "bg-red-100 text-red-800"
                        : rec.prioridade === "média" || rec.prioridade === "media"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {rec.prioridade}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  {rec.impacto_estimado && (
                    <span>Impacto: <strong>{rec.impacto_estimado}</strong></span>
                  )}
                  {rec.prazo && (
                    <span>Prazo: <strong>{rec.prazo}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intangibles Section (Gold only) */}
        {isGold && valuation.intangiveis && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Análise de Intangíveis</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Valor da Marca</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(valuation.intangiveis.valor_marca)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Processos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(valuation.intangiveis.processos)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Capital Humano</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(valuation.intangiveis.capital_humano)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-lg">
                <p className="text-sm text-white/90 mb-1">Total de Intangíveis</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(valuation.intangiveis.total)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações Disponíveis</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="h-auto py-4 bg-[#00A9E0] hover:bg-[#0098CC] text-white px-6 rounded-lg disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2 inline" />
                  Baixar Relatório PDF ({isBronze ? "8 páginas" : isSilver ? "15-20 páginas" : "30+ páginas"})
                </>
              )}
            </button>

            <button
              onClick={handleRequestRevision}
              disabled={isRequestingRevision}
              className="h-auto py-4 border border-gray-300 rounded-lg hover:bg-gray-50 px-6 disabled:opacity-50"
            >
              {isRequestingRevision ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                  Solicitando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 inline" />
                  Solicitar Revisão ({valuation.revisions_available})
                </>
              )}
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <strong>Revisões solicitadas:</strong> {valuation.revisions_count}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {isBronze && "Plano Bronze: 1 revisão a cada 90 dias"}
                {(isSilver || isGold) && "Seu plano permite revisões ilimitadas enquanto ativo"}
              </p>
            </div>
          </div>

          {!isGold && (
            <div className="mt-6">
              <Link
                to={`/planos?source=valuation_complete_upgrade&businessId=${businessId}`}
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition"
              >
                <ArrowUpRight className="w-5 h-5" />
                Fazer Upgrade para {isBronze ? "Silver" : "Gold"}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
