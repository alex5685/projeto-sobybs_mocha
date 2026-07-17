'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from '@/lib/router-shim';
import { useAuth } from '@/lib/auth-shim';
import { useProfile } from '@/hooks/useProfile';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  AlertCircle,
  Sparkles,
  Crown,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface QuickValuation {
  id: string;
  business_id: string;
  valor_minimo: number;
  valor_maximo: number;
  multiplo_min: number;
  multiplo_max: number;
  metodo: string;
  segmento: string;
  lucro_liquido_mensal_estimado: number;
  lucro_liquido_anual_estimado: number;
  ativos_incluidos: string;
  ai_response?: { contexto_mercado?: string; benchmarks?: string } | null;
  created_at: string;
  expires_at: string;
}

interface Business {
  id: string;
  alias_name: string;
  sector: string;
}

export default function QuickValuationPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { user, isPending: authPending } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const [valuation, setValuation] = useState<QuickValuation | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [incompleteData, setIncompleteData] = useState(false);
  const [expiresStr, setExpiresStr] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Guard to prevent multiple concurrent fetch calls
  const hasFetchedRef = useRef(false);

  // Hydration-safe: only format dates client-side
  useEffect(() => {
    if (valuation?.expires_at) {
      setExpiresStr(
        new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(valuation.expires_at))
      );
    }
  }, [valuation]);

  const fetchValuation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const businessRes = await fetch(`/api/business/${businessId}`);
      if (businessRes.ok) {
        const data = (await businessRes.json()) as {
          business: { business_id: string; alias_name: string; sector: string };
        };
        setBusiness({
          id: data.business.business_id,
          alias_name: data.business.alias_name,
          sector: data.business.sector,
        });
      }

      const valuationRes = await fetch(`/api/business/${businessId}/quick-valuation`, {
        method: 'POST',
        credentials: 'include',
      });
      if (valuationRes.ok) {
        const data = (await valuationRes.json()) as { valuation: QuickValuation };
        setValuation(data.valuation);
      } else if (valuationRes.status === 403) {
        const errorData = (await valuationRes.json()) as {
          upgrade_required?: boolean;
          error?: string;
        };
        if (errorData.upgrade_required) setUpgradeRequired(true);
        else setError(errorData.error || 'Você não tem permissão para acessar esta funcionalidade');
      } else if (valuationRes.status === 400) {
        const errorData = (await valuationRes.json()) as {
          incomplete_data?: boolean;
          error?: string;
        };
        if (errorData.incomplete_data) {
          setIncompleteData(true);
          setError(errorData.error ?? null);
        } else setError(errorData.error || 'Erro ao gerar valuation');
      } else {
        const errorData = (await valuationRes.json()) as { error?: string };
        setError(errorData.error || 'Erro ao gerar valuation');
      }
    } catch (err) {
      console.error('Error fetching valuation:', err);
      setError('Erro ao carregar valuation');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/business/${businessId}/quick-valuation?refresh=1`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = (await res.json()) as { valuation: QuickValuation };
        setValuation(data.valuation);
      } else {
        const errData = (await res.json()) as { error?: string };
        setError(errData.error || 'Erro ao atualizar valuation');
      }
    } catch (err) {
      console.error('Refresh valuation error:', err);
      setError('Erro ao atualizar valuation');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Wait until auth and profile are done loading before redirecting
    if (authPending || profileLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    const allowedTypes = ['vendedor', 'hibrido', 'admin'];
    if (!profile || !allowedTypes.includes(profile.user_type)) {
      setUpgradeRequired(true);
      setIsLoading(false);
      return;
    }
    // Prevent multiple concurrent fetches
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void fetchValuation();
  }, [user, authPending, businessId, profile, profileLoading, navigate, fetchValuation]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Gerando valuation com pesquisa de mercado...</p>
          <p className="text-slate-400 text-sm mt-1">
            A IA está pesquisando benchmarks do seu setor
          </p>
        </div>
      </div>
    );
  }

  if (upgradeRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto mt-12 bg-white border border-amber-200 shadow-lg rounded-2xl overflow-hidden">
          <div className="p-8 text-center">
            <Crown className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Perfil Necessário</h2>
            <p className="text-slate-600 mb-6">
              O Valuation Rápido está disponível apenas para perfis Vendedor, Híbrido ou Admin.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/subscription-plans')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
              >
                Ver Planos
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (incompleteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto mt-12 bg-white border border-orange-200 shadow-lg rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Dados Incompletos</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/business/${businessId}`)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
            >
              Completar Cadastro
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !valuation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto mt-12 bg-white border border-red-200 shadow-lg rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Erro</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" /> Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-600">
              Fase 1 — Valuation Rápido (Gratuito)
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {business && (
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-1">{business.alias_name}</h1>
            <p className="text-slate-500">{business.sector}</p>
          </div>
        )}

        {valuation && (
          <div className="space-y-6">
            {/* Main value card */}
            <div className="bg-white border-2 border-emerald-200 shadow-xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Faixa de Valor Estimado</h2>
                      <p className="text-slate-500 text-sm">
                        Baseado em pesquisa de mercado e múltiplos do setor
                      </p>
                    </div>
                  </div>
                  {/* Refresh button */}
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-300 rounded-xl hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                  </button>
                </div>
              </div>
              <div className="p-8">
                <div className="text-center mb-8">
                  <p className="text-5xl font-bold text-emerald-600 mb-2">
                    {formatCurrency(valuation.valor_minimo)} —{' '}
                    {formatCurrency(valuation.valor_maximo)}
                  </p>
                  <p className="text-slate-400 text-base">
                    Faixa de valor de mercado estimada pela IA
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">Lucro Líquido Mensal</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(valuation.lucro_liquido_mensal_estimado)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">Lucro Líquido Anual</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(valuation.lucro_liquido_anual_estimado)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">Múltiplos do Setor</p>
                    <p className="text-lg font-bold text-slate-900">
                      {valuation.multiplo_min}x – {valuation.multiplo_max}x
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metodologia:</span>
                    <span className="font-semibold text-slate-900">{valuation.metodo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Segmento:</span>
                    <span className="font-semibold text-slate-900">{valuation.segmento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ativos considerados:</span>
                    <span className="font-semibold text-slate-900 text-right max-w-xs">
                      {valuation.ativos_incluidos}
                    </span>
                  </div>
                  {expiresStr && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Validade:
                      </span>
                      <span className="font-semibold text-slate-900" suppressHydrationWarning>
                        {expiresStr}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Market Context */}
            {valuation.ai_response &&
              (valuation.ai_response.contexto_mercado || valuation.ai_response.benchmarks) && (
                <div className="bg-white border border-indigo-100 shadow rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-bold text-slate-900">Contexto de Mercado (IA)</h3>
                  </div>
                  {valuation.ai_response.contexto_mercado && (
                    <p className="text-slate-700 text-sm leading-relaxed mb-3">
                      {valuation.ai_response.contexto_mercado}
                    </p>
                  )}
                  {valuation.ai_response.benchmarks && (
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-indigo-700 mb-1">
                        BENCHMARKS DO SETOR
                      </p>
                      <p className="text-slate-700 text-sm">{valuation.ai_response.benchmarks}</p>
                    </div>
                  )}
                </div>
              )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm">
                Este é um valuation de <strong>Fase 1 (Gratuito)</strong> baseado apenas em dados
                básicos e pesquisa de mercado. Para análise completa com todos os seus dados
                financeiros, contrate o plano <strong>Silver ou Gold</strong>.
              </p>
            </div>

            {/* Premium CTA */}
            <div className="bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] shadow-xl rounded-2xl overflow-hidden">
              <div className="p-8 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-8 h-8 text-white/90" />
                  <h2 className="text-2xl font-bold">Valuation Completo — Fase 2</h2>
                </div>
                <p className="text-white/80 mb-6">
                  Análise profunda da IA com todos os seus dados financeiros. Exclusivo para
                  assinantes Silver e Gold.
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  {[
                    'Múltiplas metodologias: SDE, EBITDA, DCF e Múltiplos de Receita',
                    'RAG com faturamento líquido, lucro, impostos, dívidas e investimentos',
                    'Score de atratividade e análise de riscos detalhada',
                    'Recomendações concretas para aumentar o valor',
                    'Análise de intangíveis: marca, processos e capital humano (Gold)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/90">
                      <span className="text-white font-bold mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      navigate(
                        `/planos?source=valuation_quick&businessId=${businessId}&valuationId=${valuation.id}`
                      )
                    }
                    className="bg-white text-[#00A9E0] px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition"
                  >
                    Ver Planos Silver & Gold
                  </button>
                  <button
                    onClick={() => navigate(`/business/${businessId}`)}
                    className="border-2 border-white/40 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition"
                  >
                    Ver Empresa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
