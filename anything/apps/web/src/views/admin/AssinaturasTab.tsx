'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  ChevronDown,
  Users,
} from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: string;
  status: string;
  monthly_value: number;
  starts_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  user_type: string;
}

interface SubscriptionSummary {
  status: string;
  count: number;
  mrr: number;
}

interface ExpiringSubscription {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: string;
  expires_at: string;
}

interface SubsResponse {
  subscriptions: Subscription[];
  summary: SubscriptionSummary[];
  churnRate: string;
  cancelledThisMonth: number;
  expiringCount: number;
  expiring: ExpiringSubscription[];
}

function planBadge(plan: string) {
  const colors: Record<string, string> = {
    bronze: 'bg-amber-100 text-amber-800',
    silver: 'bg-gray-100 text-gray-700',
    gold: 'bg-yellow-100 text-yellow-800',
  };
  const emojis: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
  const c = colors[plan?.toLowerCase()] ?? 'bg-blue-100 text-blue-800';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${c}`}
    >
      {emojis[plan?.toLowerCase()] ?? ''} {plan}
    </span>
  );
}

function statusBadge(status: string) {
  if (status === 'active')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" /> Ativo
      </span>
    );
  if (status === 'cancelled')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" /> Cancelado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
      <Clock className="w-3 h-3" /> {status}
    </span>
  );
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  const parts = (d.split('T')[0] ?? d).split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function AssinaturasTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, refetch } = useQuery<SubsResponse>({
    queryKey: ['admin-subscriptions', statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/subscriptions-list?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar assinaturas');
      return res.json() as Promise<SubsResponse>;
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string; expires_at?: string }) => {
      const res = await fetch('/api/admin/subscriptions-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
    },
    onSuccess: () => {
      toast.success('Assinatura atualizada!');
      void queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    },
    onError: () => toast.error('Erro ao atualizar assinatura'),
  });

  const reactivate = (sub: Subscription) => {
    patchMutation.mutate({ id: sub.id, status: 'active' });
  };

  const summary = data?.summary ?? [];
  const activeSubs = summary.find((s) => s.status === 'active');
  const cancelledSubs = summary.find((s) => s.status === 'cancelled');
  const mrr = Number(activeSubs?.mrr ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assinaturas</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie assinaturas ativas, expiradas e churn
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              MRR
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeSubs?.count ?? 0}</div>
          <div className="text-xs text-gray-500">Ativas</div>
          <div className="text-sm font-semibold text-green-700 mt-1">
            R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{cancelledSubs?.count ?? 0}</div>
          <div className="text-xs text-gray-500">Canceladas</div>
          <div className="text-sm font-semibold text-red-600 mt-1">
            {data?.cancelledThisMonth ?? 0} este mês
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.expiringCount ?? 0}</div>
          <div className="text-xs text-gray-500">A expirar em 10 dias</div>
          <div className="text-xs text-orange-600 font-semibold mt-1">Requer atenção</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.churnRate ?? '0.0'}%</div>
          <div className="text-xs text-gray-500">Churn Rate (mês)</div>
          <div className="text-xs text-purple-600 mt-1">Meta: &lt; 5%</div>
        </div>
      </div>

      {/* Expiring Alerts */}
      {(data?.expiring?.length ?? 0) > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-orange-800">
              {data!.expiring.length} assinatura{data!.expiring.length > 1 ? 's' : ''} expirando em
              breve
            </h3>
          </div>
          <div className="space-y-2">
            {data!.expiring.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{sub.user_name}</p>
                  <p className="text-xs text-gray-500 truncate">{sub.user_email}</p>
                </div>
                {planBadge(sub.plan_type)}
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600">
                    Expira: {fmtDate(sub.expires_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00A9E0]"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00A9E0] bg-white"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="cancelled">Cancelados</option>
            <option value="expired">Expirados</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={() => setSearch(searchInput)}
          className="px-5 py-2.5 bg-[#00A9E0] text-white rounded-xl text-sm font-medium hover:bg-[#0098CC] transition-colors"
        >
          Buscar
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A9E0] animate-spin" />
        </div>
      ) : (data?.subscriptions?.length ?? 0) === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">Nenhuma assinatura encontrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Usuário</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Plano</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Valor/mês</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Início</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Expira</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data!.subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{sub.user_name}</p>
                    <p className="text-xs text-gray-500">{sub.user_email}</p>
                  </td>
                  <td className="py-3 px-4">{planBadge(sub.plan_type)}</td>
                  <td className="py-3 px-4">{statusBadge(sub.status)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-800">
                    {Number(sub.monthly_value) > 0
                      ? `R$ ${Number(sub.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500">{fmtDate(sub.starts_at)}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{fmtDate(sub.expires_at)}</td>
                  <td className="py-3 px-4 text-center">
                    {sub.status === 'active' ? (
                      <button
                        onClick={() => {
                          if (confirm(`Cancelar assinatura de ${sub.user_name}?`))
                            patchMutation.mutate({ id: sub.id, status: 'cancelled' });
                        }}
                        disabled={patchMutation.isPending}
                        className="text-xs px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    ) : sub.status === 'cancelled' ? (
                      <button
                        onClick={() => reactivate(sub)}
                        disabled={patchMutation.isPending}
                        className="text-xs px-3 py-1.5 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50"
                      >
                        Reativar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Churn Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Avisos de renovação:</strong> Clientes com assinaturas expirando em até 10 dias
        aparecem automaticamente na seção de alertas acima. O churn rate é calculado sobre o total
        de assinaturas no início do mês corrente.
      </div>
    </div>
  );
}
