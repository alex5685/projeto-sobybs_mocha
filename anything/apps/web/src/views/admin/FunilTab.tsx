'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowDown, Users, Building2, CheckCircle, TrendingUp } from 'lucide-react';

interface FunnelStage {
  stage: string;
  count: number;
}

interface StatsResponse {
  stats: {
    funnelData: FunnelStage[];
    totalUsers: number;
    totalBusinesses: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    usersByType: Array<{ user_type: string; count: number }>;
  };
}

const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }
> = {
  cadastro: {
    label: 'Cadastro',
    color: 'text-blue-700',
    bg: 'bg-blue-500',
    icon: <Users className="w-5 h-5" />,
    desc: 'Empresas em processo de cadastro inicial',
  },
  analise: {
    label: 'Em Análise',
    color: 'text-purple-700',
    bg: 'bg-purple-500',
    icon: <TrendingUp className="w-5 h-5" />,
    desc: 'Aguardando análise e valuation',
  },
  publicado: {
    label: 'Publicadas',
    color: 'text-cyan-700',
    bg: 'bg-cyan-500',
    icon: <Building2 className="w-5 h-5" />,
    desc: 'Disponíveis no marketplace',
  },
  negociacao: {
    label: 'Em Negociação',
    color: 'text-orange-700',
    bg: 'bg-orange-500',
    icon: <TrendingUp className="w-5 h-5" />,
    desc: 'Em processo de negociação com compradores',
  },
  fechado: {
    label: 'Fechados',
    color: 'text-green-700',
    bg: 'bg-green-500',
    icon: <CheckCircle className="w-5 h-5" />,
    desc: 'Venda concluída com sucesso',
  },
};

const STAGE_ORDER = ['cadastro', 'analise', 'publicado', 'negociacao', 'fechado'];

export default function FunilTab() {
  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ['admin-stats-funnel'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Erro ao carregar stats');
      return res.json() as Promise<StatsResponse>;
    },
  });

  const funnelData = data?.stats?.funnelData ?? [];
  const totalBiz = funnelData.reduce((sum, s) => sum + s.count, 0);

  // Sort by our preferred order, then any unknown stages
  const sorted = [
    ...STAGE_ORDER.map((key) => ({
      stage: key,
      count: funnelData.find((f) => f.stage === key)?.count ?? 0,
    })),
    ...funnelData.filter((f) => !STAGE_ORDER.includes(f.stage)),
  ].filter((s) => s.count > 0 || STAGE_ORDER.includes(s.stage));

  const maxCount = Math.max(...sorted.map((s) => s.count), 1);

  // Conversion rates
  const topCount = sorted[0]?.count ?? 0;
  const conversionByStage = sorted.map((s, i) => {
    const prevCount = i === 0 ? topCount : (sorted[i - 1]?.count ?? 1);
    const rate = prevCount > 0 ? ((s.count / prevCount) * 100).toFixed(0) : '0';
    const overallRate = topCount > 0 ? ((s.count / topCount) * 100).toFixed(0) : '0';
    return { ...s, rate, overallRate };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-[#00A9E0] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Funil de Conversão</h2>
        <p className="text-gray-500 text-sm mt-1">
          Empresas distribuídas por estágio no pipeline de vendas
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Empresas',
            value: totalBiz,
            icon: <Building2 className="w-5 h-5 text-blue-600" />,
            color: 'from-blue-50 to-cyan-50 border-blue-100',
          },
          {
            label: 'Usuários',
            value: data?.stats?.totalUsers ?? 0,
            icon: <Users className="w-5 h-5 text-purple-600" />,
            color: 'from-purple-50 to-pink-50 border-purple-100',
          },
          {
            label: 'Assinaturas Ativas',
            value: data?.stats?.activeSubscriptions ?? 0,
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            color: 'from-green-50 to-emerald-50 border-green-100',
          },
          {
            label: 'Taxa Global',
            value: sorted.find((s) => s.stage === 'fechado')?.count ?? 0,
            suffix: `/ ${totalBiz} fechados`,
            icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
            color: 'from-orange-50 to-yellow-50 border-orange-100',
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-xl p-4 border`}>
            <div className="mb-2">{kpi.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-xs text-gray-500">{kpi.label}</div>
            {'suffix' in kpi && kpi.suffix && (
              <div className="text-xs text-gray-400 mt-0.5">{kpi.suffix}</div>
            )}
          </div>
        ))}
      </div>

      {/* Visual Funnel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-6">
          Funil Visual — Empresas por Estágio
        </h3>
        <div className="space-y-3">
          {conversionByStage.map((stage, idx) => {
            const conf = STAGE_CONFIG[stage.stage] ?? {
              label: stage.stage,
              color: 'text-gray-700',
              bg: 'bg-gray-400',
              icon: <Building2 className="w-5 h-5" />,
              desc: '',
            };
            const widthPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            return (
              <div key={stage.stage}>
                {idx > 0 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown className="w-4 h-4 text-gray-300" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  {/* Stage label */}
                  <div className="w-28 flex-shrink-0 text-right">
                    <div className={`text-sm font-bold ${conf.color}`}>{conf.label}</div>
                    <div className="text-xs text-gray-400">{stage.overallRate}% do total</div>
                  </div>
                  {/* Bar */}
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-full h-10 relative overflow-hidden">
                      <div
                        className={`h-full ${conf.bg} rounded-full flex items-center justify-end pr-3 transition-all`}
                        style={{ width: `${Math.max(widthPct, 4)}%` }}
                      >
                        <span className="text-white text-sm font-bold">{stage.count}</span>
                      </div>
                    </div>
                  </div>
                  {/* Conversion rate */}
                  {idx > 0 && (
                    <div className="w-20 flex-shrink-0 text-center">
                      <div className="text-xs font-bold text-gray-600">{stage.rate}%</div>
                      <div className="text-xs text-gray-400">conversão</div>
                    </div>
                  )}
                  {idx === 0 && <div className="w-20 flex-shrink-0" />}
                </div>
                {/* Description */}
                <div className="ml-32 text-xs text-gray-400 mt-0.5">{conf.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-5 font-semibold text-gray-600">Estágio</th>
              <th className="text-center py-3 px-5 font-semibold text-gray-600">Empresas</th>
              <th className="text-center py-3 px-5 font-semibold text-gray-600">% do Total</th>
              <th className="text-center py-3 px-5 font-semibold text-gray-600">
                Conv. Etapa Anterior
              </th>
              <th className="text-left py-3 px-5 font-semibold text-gray-600">Descrição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {conversionByStage.map((stage, idx) => {
              const conf = STAGE_CONFIG[stage.stage] ?? {
                label: stage.stage,
                color: 'text-gray-700',
                bg: 'bg-gray-400',
                icon: null,
                desc: '—',
              };
              return (
                <tr key={stage.stage} className="hover:bg-gray-50">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${conf.bg}`} />
                      <span className={`font-semibold ${conf.color}`}>{conf.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-center font-bold text-gray-900">{stage.count}</td>
                  <td className="py-3 px-5 text-center">
                    <span className="text-gray-600">{stage.overallRate}%</span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    {idx === 0 ? (
                      <span className="text-gray-400 text-xs">Topo do funil</span>
                    ) : (
                      <span
                        className={`font-semibold ${Number(stage.rate) >= 50 ? 'text-green-600' : Number(stage.rate) >= 25 ? 'text-orange-500' : 'text-red-500'}`}
                      >
                        {stage.rate}%
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-gray-500 text-xs">{conf.desc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Users by type */}
      {(data?.stats?.usersByType?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Perfis de Usuários</h3>
          <div className="flex flex-wrap gap-3">
            {data!.stats.usersByType.map((t) => (
              <div
                key={t.user_type}
                className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 text-center min-w-[100px]"
              >
                <div className="text-xl font-bold text-gray-900">{t.count}</div>
                <div className="text-xs text-gray-500 capitalize">{t.user_type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Nota:</strong> O funil é baseado no campo{' '}
        <code className="bg-white px-1 rounded text-xs">status_workflow</code> das empresas
        cadastradas. Para integração com GA4 (sessões e comportamento de usuário), consulte o painel
        do Google Analytics.
      </div>
    </div>
  );
}
