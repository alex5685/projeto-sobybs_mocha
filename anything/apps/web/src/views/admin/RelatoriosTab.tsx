'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Trophy,
  Download,
  FileText,
  TrendingUp,
  CreditCard,
  Package,
  BarChart2,
  User,
  Building2,
  Star,
} from 'lucide-react';

interface ClientRank {
  id: string;
  name: string;
  email: string;
  subscription_level: string;
  num_lancamentos: number;
  total_receita: string;
  total_despesa: string;
  ultimo_lancamento: string | null;
}

interface BusinessRank {
  id: string;
  alias_name: string;
  sector: string;
  city: string;
  status_workflow: string;
  owner_name: string;
  owner_email: string;
  num_lancamentos: number;
  total_receita: string;
  total_despesa: string;
  ultimo_lancamento: string | null;
}

interface RankingResponse {
  clientRanking: ClientRank[];
  businessRanking: BusinessRank[];
  grandTotal: number;
}

type ReportType = 'financeiro' | 'funil' | 'assinaturas' | 'planos' | 'consolidado';

const REPORTS: Array<{
  type: ReportType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  includes: string[];
}> = [
  {
    type: 'consolidado',
    label: 'Relatório Consolidado',
    desc: 'Visão geral completa de todos os módulos num único PDF',
    icon: <Star className="w-6 h-6" />,
    color: 'from-[#00A9E0] to-[#0098CC]',
    border: 'border-[#00A9E0]',
    includes: ['Resumo executivo', 'Funil', 'Financeiro', 'Top clientes'],
  },
  {
    type: 'financeiro',
    label: 'Financeiro',
    desc: 'DRE, lançamentos, top clientes e evolução de receita/despesa',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-600',
    border: 'border-green-200',
    includes: ['DRE mensal', 'Evolução 6 meses', 'Top 20 clientes', 'Todos os lançamentos'],
  },
  {
    type: 'funil',
    label: 'Funil de Conversão',
    desc: 'Empresas por estágio, taxas de conversão e perfil de usuários',
    icon: <BarChart2 className="w-6 h-6" />,
    color: 'from-purple-500 to-violet-600',
    border: 'border-purple-200',
    includes: ['Estágios do funil', 'Taxa de conversão', 'Perfil de usuários', 'Lista de empresas'],
  },
  {
    type: 'assinaturas',
    label: 'Assinaturas',
    desc: 'MRR, churn, planos ativos e listagem completa de assinantes',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-600',
    border: 'border-blue-200',
    includes: ['MRR total', 'Resumo por plano', 'Lista completa de assinantes'],
  },
  {
    type: 'planos',
    label: 'Planos e Serviços',
    desc: 'Serviços incluídos por plano, comparativo detalhado e FAQ',
    icon: <Package className="w-6 h-6" />,
    color: 'from-amber-500 to-orange-600',
    border: 'border-amber-200',
    includes: ['Serviços Bronze/Silver/Gold', 'Tabela comparativa', 'FAQ cadastrado'],
  },
];

function fmtR(val: number) {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  const parts = (d.split('T')[0] ?? d).split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RelatoriosTab() {
  const [loadingReport, setLoadingReport] = useState<ReportType | null>(null);
  const [rankView, setRankView] = useState<'clientes' | 'empresas'>('clientes');

  const { data: rankData, isLoading: rankLoading } = useQuery<RankingResponse>({
    queryKey: ['admin-ranking'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ranking');
      if (!res.ok) throw new Error('Erro ao carregar ranking');
      return res.json() as Promise<RankingResponse>;
    },
  });

  const generateReport = async (type: ReportType) => {
    setLoadingReport(type);
    try {
      const res = await fetch(`/api/admin/reports?type=${type}`);
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Erro ao gerar relatório');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Read filename from server Content-Disposition header
      const contentDisp = res.headers.get('Content-Disposition') ?? '';
      const match = contentDisp.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `relatorio-${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Relatório PDF gerado e baixado!');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setLoadingReport(null);
    }
  };

  const grandTotal = rankData?.grandTotal ?? 0;
  const clients = rankData?.clientRanking ?? [];
  const businesses = rankData?.businessRanking ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Relatórios & Ranking</h2>
        <p className="text-gray-500 text-sm mt-1">
          Gere relatórios em PDF e visualize o ranking de clientes e empresas por receita
        </p>
      </div>

      {/* Report Cards */}
      <div>
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Gerar Relatórios (PDF)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {REPORTS.map((report) => {
            const isLoading = loadingReport === report.type;
            return (
              <div
                key={report.type}
                className={`bg-white rounded-2xl border-2 ${report.border} p-5 flex flex-col gap-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center text-white flex-shrink-0`}
                  >
                    {report.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight">
                      {report.label}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{report.desc}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {report.includes.map((item) => (
                    <span
                      key={item}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => generateReport(report.type)}
                  disabled={!!loadingReport}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${report.color} hover:opacity-90 disabled:opacity-50 transition-opacity`}
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className="w-4 h-4"
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Baixar PDF
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Os PDFs são gerados com dados em tempo real · Compatíveis com Adobe Reader, Chrome e todos
          os visualizadores de PDF
        </p>
      </div>

      {/* Ranking */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" /> Ranking por Receita
          </h3>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setRankView('clientes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rankView === 'clientes' ? 'bg-white text-[#00A9E0] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User className="w-3.5 h-3.5" /> Clientes
            </button>
            <button
              onClick={() => setRankView('empresas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rankView === 'empresas' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Building2 className="w-3.5 h-3.5" /> Empresas
            </button>
          </div>
        </div>

        {rankLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              className="w-8 h-8 text-[#00A9E0]"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
        ) : rankView === 'clientes' ? (
          clients.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">
                Nenhum cliente com lançamentos vinculados
              </p>
              <p className="text-gray-400 text-sm">
                Vincule lançamentos financeiros a clientes para ver o ranking
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {clients.slice(0, 3).map((c, i) => {
                    const rank = i + 1;
                    const pct =
                      grandTotal > 0
                        ? ((Number(c.total_receita) / grandTotal) * 100).toFixed(1)
                        : '0';
                    const podiumBg = [
                      'from-yellow-50 to-amber-50 border-yellow-200',
                      'from-gray-50 to-slate-50 border-gray-200',
                      'from-orange-50 to-amber-50 border-orange-200',
                    ][i];
                    return (
                      <div
                        key={c.id}
                        className={`bg-gradient-to-br ${podiumBg} rounded-2xl border-2 p-4 text-center`}
                      >
                        <div className="text-3xl mb-2">{MEDAL[rank]}</div>
                        <p className="font-bold text-gray-900 text-sm truncate">{c.name ?? '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{c.email}</p>
                        <div className="mt-3">
                          <div className="text-base font-black text-gray-900">
                            {fmtR(Number(c.total_receita))}
                          </div>
                          <div className="text-xs text-gray-400">{pct}% do total</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 w-12">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Cliente</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">
                        Plano
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">
                        Receita Total
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">
                        % do Total
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">
                        Lançamentos
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">
                        Último
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clients.map((c, i) => {
                      const rank = i + 1;
                      const pct =
                        grandTotal > 0
                          ? ((Number(c.total_receita) / grandTotal) * 100).toFixed(1)
                          : '0';
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span
                              className={`font-black text-sm ${rank <= 3 ? 'text-yellow-600' : 'text-gray-400'}`}
                            >
                              {MEDAL[rank] ?? `#${rank}`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900">{c.name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{c.email}</p>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full capitalize">
                              {c.subscription_level ?? 'sem plano'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">
                            {fmtR(Number(c.total_receita))}
                          </td>
                          <td className="py-3 px-4 text-right hidden md:table-cell">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 bg-[#00A9E0] rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{pct}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-500 hidden lg:table-cell">
                            {c.num_lancamentos}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-400 text-xs hidden lg:table-cell">
                            {fmtDate(c.ultimo_lancamento)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : businesses.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">
              Nenhuma empresa com lançamentos vinculados
            </p>
            <p className="text-gray-400 text-sm">
              Vincule lançamentos a empresas para ver o ranking
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {businesses.slice(0, 3).map((b, i) => {
                  const rank = i + 1;
                  const pct =
                    grandTotal > 0
                      ? ((Number(b.total_receita) / grandTotal) * 100).toFixed(1)
                      : '0';
                  const podiumBg = [
                    'from-yellow-50 to-amber-50 border-yellow-200',
                    'from-gray-50 to-slate-50 border-gray-200',
                    'from-orange-50 to-amber-50 border-orange-200',
                  ][i];
                  return (
                    <div
                      key={b.id}
                      className={`bg-gradient-to-br ${podiumBg} rounded-2xl border-2 p-4 text-center`}
                    >
                      <div className="text-3xl mb-2">{MEDAL[rank]}</div>
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {b.alias_name ?? 'Empresa'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{b.owner_name}</p>
                      <div className="mt-3">
                        <div className="text-base font-black text-gray-900">
                          {fmtR(Number(b.total_receita))}
                        </div>
                        <div className="text-xs text-gray-400">{pct}% do total</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-12">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Empresa</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">
                      Proprietário
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">
                      Receita Total
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">
                      % do Total
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">
                      Etapa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {businesses.map((b, i) => {
                    const rank = i + 1;
                    const pct =
                      grandTotal > 0
                        ? ((Number(b.total_receita) / grandTotal) * 100).toFixed(1)
                        : '0';
                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span
                            className={`font-black text-sm ${rank <= 3 ? 'text-yellow-600' : 'text-gray-400'}`}
                          >
                            {MEDAL[rank] ?? `#${rank}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{b.alias_name ?? 'Empresa'}</p>
                          <p className="text-xs text-gray-400">{b.sector ?? b.city ?? '—'}</p>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell text-xs text-gray-500">
                          {b.owner_name}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-green-600">
                          {fmtR(Number(b.total_receita))}
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 bg-purple-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center hidden lg:table-cell">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                            {b.status_workflow ?? '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
