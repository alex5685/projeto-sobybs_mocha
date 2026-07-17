'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from '@/lib/router-shim';
import { useAuth } from '@/lib/auth-shim';
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
} from 'lucide-react';

interface Methodology {
  nome: string;
  valor: number;
  peso: number;
  descricao?: string;
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
  descricao?: string;
}

interface Intangibles {
  valor_marca: number;
  processos: number;
  capital_humano: number;
  total: number;
}

interface ValuationData {
  id: string;
  business_id: string;
  valor_estimado: number;
  valor_minimo: number;
  valor_maximo: number;
  nivel_incerteza_referencia: string;
  score_atratividade: number;
  analise_mercado?: string;
  pontos_fortes?: string[];
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
  const [searchParams] = useSearchParams();
  const shouldRefresh = searchParams.get('refresh') === '1';
  const { user, isPending } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revisionMessage, setRevisionMessage] = useState<string | null>(null);
  const [selectedMethodology, setSelectedMethodology] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [lastUpdatedStr, setLastUpdatedStr] = useState('');

  useEffect(() => {
    if (!isPending && !user) navigate('/');
  }, [user, isPending, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !businessId) return;
      try {
        const planResponse = await fetch('/api/subscriptions/active', { credentials: 'include' });
        if (planResponse.ok) {
          const planData = await planResponse.json();
          if (
            planData.subscription &&
            ['silver', 'gold'].includes(planData.subscription.plan_type)
          ) {
            setActivePlan(planData.subscription);
          } else {
            navigate(`/planos?source=valuation_complete_locked&businessId=${businessId}`);
            return;
          }
        } else {
          navigate(`/planos?source=valuation_complete_locked&businessId=${businessId}`);
          return;
        }

        const valuationUrl = `/api/business/${businessId}/complete-valuation${shouldRefresh ? '?refresh=1' : ''}`;
        const valuationResponse = await fetch(valuationUrl, { credentials: 'include' });
        if (valuationResponse.ok) {
          const data = await valuationResponse.json();
          setValuation(data.valuation);
        } else {
          const errorData = await valuationResponse.json();
          if (errorData.upgrade_required) {
            navigate(`/planos?source=valuation_complete_locked&businessId=${businessId}`);
            return;
          }
          setError(errorData.error || 'Erro ao carregar valuation');
        }
      } catch (err) {
        console.error('Error loading valuation:', err);
        setError('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, businessId, navigate, shouldRefresh]);

  useEffect(() => {
    if (valuation?.last_updated) {
      setLastUpdatedStr(
        new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(valuation.last_updated))
      );
    }
  }, [valuation]);

  const handleManualRefresh = async () => {
    if (!businessId) return;
    setIsRefreshing(true);
    setError(null);
    setRevisionMessage(null);
    try {
      const res = await fetch(`/api/business/${businessId}/complete-valuation?refresh=1`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setValuation(data.valuation);
        setRevisionMessage('Valuation atualizado com os dados mais recentes da empresa.');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao atualizar valuation');
      }
    } catch (err) {
      console.error('Manual refresh error:', err);
      setError('Erro ao atualizar valuation');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!businessId) return;
    setIsGeneratingPDF(true);
    try {
      const response = await fetch(`/api/business/${businessId}/generate-valuation-report`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = `/api/reports/${data.report_id}/download`;
      } else {
        setError('Erro ao gerar relatório');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Erro ao gerar relatório');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!businessId) return;
    setIsRequestingRevision(true);
    setError(null);
    setRevisionMessage(null);
    try {
      const response = await fetch(`/api/business/${businessId}/request-revision`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = (await response.json()) as {
          success: boolean;
          valuation?: ValuationData;
          regenerated?: boolean;
        };
        if (data.regenerated && data.valuation) {
          // Usa o valuation já regenerado retornado pelo endpoint
          setValuation(data.valuation);
          setRevisionMessage('Revisão concluída! Valuation atualizado com os dados mais recentes.');
        } else {
          // Fallback: busca o valuation atualizado manualmente
          const refetch = await fetch(`/api/business/${businessId}/complete-valuation?refresh=1`, {
            credentials: 'include',
          });
          if (refetch.ok) {
            const refetchData = await refetch.json();
            setValuation(refetchData.valuation);
          }
          setRevisionMessage('Revisão solicitada! Valuation atualizado com sucesso.');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao solicitar revisão');
      }
    } catch (err) {
      console.error('Error requesting revision:', err);
      setError('Erro ao solicitar revisão');
    } finally {
      setIsRequestingRevision(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Gerando valuation com IA e pesquisa de mercado...
          </p>
          <p className="text-gray-400 text-sm mt-1">Isso pode levar alguns instantes</p>
        </div>
      </div>
    );
  }

  if (error && !valuation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
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
  const isBronze = planType === 'bronze';
  const isSilver = planType === 'silver';
  const isGold = planType === 'gold';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPlanBadgeColor = () => {
    if (isBronze) return 'bg-amber-100 text-amber-800';
    if (isSilver) return 'bg-gray-200 text-gray-700';
    return 'bg-[#FFD700]/20 text-gray-900';
  };

  const getPlanName = () => {
    if (isBronze) return 'Bronze';
    if (isSilver) return 'Silver';
    return 'Gold';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs Logo"
                className="h-14 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getPlanBadgeColor()}`}
              >
                Plano {getPlanName()}
              </span>
              {/* Manual refresh button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => navigate('/dashboard')}
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Valuation Completo — Fase 2</h1>
          <p className="text-gray-600">
            Análise com IA e pesquisa de mercado • Última atualização:{' '}
            <span suppressHydrationWarning>{lastUpdatedStr}</span>
          </p>
        </div>

        {/* Success message */}
        {revisionMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{revisionMessage}</p>
          </div>
        )}

        {/* Error banner (non-fatal) */}
        {error && valuation && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> Resultados dependem dos dados informados e do setor. Não
            constitui laudo ou garantia de valor.
          </p>
        </div>

        {/* Main Valuation Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Valor Mínimo</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(valuation.valor_minimo)}
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-xl">
              <p className="text-sm text-white/90 mb-2">Valor Estimado</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(valuation.valor_estimado)}
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Valor Máximo</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(valuation.valor_maximo)}
              </p>
            </div>
          </div>

          {/* Score + Range Explanation */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Score Gauge */}
            <div className="p-5 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">Score de Atratividade</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {valuation.score_atratividade}
                    <span className="text-base font-normal text-gray-500">/100</span>
                  </p>
                </div>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    background:
                      valuation.score_atratividade >= 85
                        ? '#16a34a'
                        : valuation.score_atratividade >= 70
                          ? '#2563eb'
                          : valuation.score_atratividade >= 55
                            ? '#d97706'
                            : valuation.score_atratividade >= 40
                              ? '#ea580c'
                              : '#dc2626',
                  }}
                >
                  {valuation.score_atratividade >= 85
                    ? '★★★'
                    : valuation.score_atratividade >= 70
                      ? '★★'
                      : valuation.score_atratividade >= 55
                        ? '★'
                        : '—'}
                </div>
              </div>

              {/* Progress bar with color bands */}
              <div className="relative w-full h-4 rounded-full overflow-hidden bg-gray-200 mb-2">
                <div className="absolute inset-0 flex">
                  <div className="h-full bg-red-500" style={{ width: '40%' }} />
                  <div className="h-full bg-orange-500" style={{ width: '15%' }} />
                  <div className="h-full bg-yellow-400" style={{ width: '15%' }} />
                  <div className="h-full bg-blue-500" style={{ width: '15%' }} />
                  <div className="h-full bg-green-500" style={{ width: '15%' }} />
                </div>
                {/* Needle */}
                <div
                  className="absolute top-0 h-full w-1 bg-white shadow-md rounded-full transition-all"
                  style={{ left: `${Math.min(valuation.score_atratividade, 99)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>40</span>
                <span>55</span>
                <span>70</span>
                <span>85</span>
                <span>100</span>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                {valuation.score_atratividade >= 85
                  ? '🟢 Empresa muito atrativa — faixa de valor estreita e confiável'
                  : valuation.score_atratividade >= 70
                    ? '🔵 Empresa atrativa — boa visibilidade de valor'
                    : valuation.score_atratividade >= 55
                      ? '🟡 Atratividade moderada — incerteza padrão do setor'
                      : valuation.score_atratividade >= 40
                        ? '🟠 Pontos de atenção identificados — faixa mais ampla'
                        : '🔴 Alto nível de risco — faixa de incerteza elevada'}
              </p>
            </div>

            {/* Range explanation */}
            <div className="p-5 bg-indigo-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-indigo-600" />
                <p className="font-semibold text-gray-900">Como o Score afeta a Faixa</p>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                A largura da faixa (Min ↔ Máx) é determinada pelo Score de Atratividade. Quanto
                maior o score, mais estreita e confiável a estimativa.
              </p>
              <div className="space-y-1.5 text-xs">
                {[
                  {
                    label: '85–100',
                    tag: planType === 'gold' ? '±2,5%' : '±5%',
                    color: 'bg-green-100 text-green-800',
                  },
                  {
                    label: '70–84',
                    tag: planType === 'gold' ? '±3,75%' : '±7,5%',
                    color: 'bg-blue-100 text-blue-800',
                  },
                  {
                    label: '55–69',
                    tag: planType === 'gold' ? '±5%' : '±10%',
                    color: 'bg-yellow-100 text-yellow-800',
                  },
                  {
                    label: '40–54',
                    tag: planType === 'gold' ? '±6,75%' : '±13,5%',
                    color: 'bg-orange-100 text-orange-800',
                  },
                  {
                    label: '0–39',
                    tag: planType === 'gold' ? '±8,5%' : '±17%',
                    color: 'bg-red-100 text-red-800',
                  },
                ].map(({ label, tag, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-600">Score {label}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${color}`}>{tag}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-indigo-700 font-semibold mt-3">
                Sua incerteza: {valuation.nivel_incerteza_referencia} (Plano{' '}
                {planType === 'gold' ? 'Gold' : 'Silver'})
              </p>
            </div>
          </div>
        </div>

        {/* AI Market Analysis */}
        {(valuation.analise_mercado ||
          (valuation.pontos_fortes && valuation.pontos_fortes.length > 0)) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Análise de Mercado (IA)</h2>
            </div>
            {valuation.analise_mercado && (
              <div className="p-5 bg-indigo-50 rounded-xl mb-4">
                <p className="text-gray-800 leading-relaxed">{valuation.analise_mercado}</p>
              </div>
            )}
            {valuation.pontos_fortes && valuation.pontos_fortes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pontos Fortes Identificados</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {valuation.pontos_fortes.map((ponto, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{ponto}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Methodologies Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-[#00A9E0]" />
            <h2 className="text-2xl font-bold text-gray-900">
              Metodologias de Valuation {isBronze && '(1 método)'}
              {isSilver && '(3 métodos)'}
              {isGold && '(5 métodos)'}
            </h2>
          </div>

          {valuation.metodologias.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {valuation.metodologias.map((method, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMethodology(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedMethodology === index
                      ? 'bg-[#00A9E0] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            {valuation.metodologias[selectedMethodology]?.descricao && (
              <p className="text-sm text-gray-500 mb-4">
                {valuation.metodologias[selectedMethodology].descricao}
              </p>
            )}
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
                O valor final é calculado através da média ponderada de todas as metodologias
                aplicadas.
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
                        risk.impacto.toLowerCase().includes('alto')
                          ? 'bg-red-100 text-red-800'
                          : risk.impacto.toLowerCase().includes('médio') ||
                              risk.impacto.toLowerCase().includes('medio')
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {risk.impacto}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Probabilidade:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        risk.probabilidade.toLowerCase().includes('alta')
                          ? 'bg-red-100 text-red-800'
                          : risk.probabilidade.toLowerCase().includes('média') ||
                              risk.probabilidade.toLowerCase().includes('media')
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
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
            {valuation.recomendacoes.map((rec, index) => {
              const prioridadeLower = rec.prioridade.toLowerCase();
              const prioridadeColor = prioridadeLower.includes('alta')
                ? 'bg-red-100 text-red-800'
                : prioridadeLower.includes('média') || prioridadeLower.includes('media')
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800';
              return (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#00A9E0] transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{rec.titulo}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${prioridadeColor}`}
                    >
                      {rec.prioridade}
                    </span>
                  </div>
                  {rec.descricao && <p className="text-sm text-gray-600 mb-2">{rec.descricao}</p>}
                  <div className="flex gap-4 text-sm text-gray-500">
                    {rec.impacto_estimado && (
                      <span>
                        📈 Impacto: <strong>{rec.impacto_estimado}</strong>
                      </span>
                    )}
                    {rec.prazo && (
                      <span>
                        ⏱ Prazo: <strong>{rec.prazo}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
                  Baixar Relatório PDF (
                  {isBronze ? '8 páginas' : isSilver ? '15-20 páginas' : '30+ páginas'})
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
                  Gerando revisão com IA...
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
                {isBronze && 'Plano Bronze: 1 revisão a cada 90 dias'}
                {(isSilver || isGold) && 'Seu plano permite revisões ilimitadas enquanto ativo'}
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
                Fazer Upgrade para {isBronze ? 'Silver' : 'Gold'}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
