'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  X,
  BarChart2,
  User,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FinancialEntry {
  id: string;
  entry_date: string;
  entry_type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  reference_month: string;
  notes: string | null;
  client_name: string | null;
  client_email: string | null;
  business_name: string | null;
}

interface DRE {
  month: string;
  receita: number;
  despesa: number;
  margem: number;
  margemPct: string;
  byCategory: Record<string, { receita: number; despesa: number }>;
}

interface MonthlySummary {
  reference_month: string;
  entry_type: string;
  total: number;
}

interface FinancialResponse {
  entries: FinancialEntry[];
  dre: DRE;
  monthlySummary: MonthlySummary[];
  availableMonths: string[];
}

interface ClientOption {
  id: string;
  name: string;
  email: string;
  user_type: string;
  subscription_level: string;
}

interface BusinessOption {
  id: string;
  alias_name: string;
  sector: string;
  city: string;
  owner_name: string;
  owner_email: string;
}

const CATEGORIES = [
  { key: '', label: 'Todas as categorias' },
  { key: 'assinatura', label: '📆 Assinatura' },
  { key: 'comissao', label: '💰 Comissão' },
  { key: 'operacional', label: '⚙️ Operacional' },
  { key: 'marketing', label: '📣 Marketing' },
  { key: 'tecnologia', label: '💻 Tecnologia' },
  { key: 'pessoal', label: '👥 Pessoal' },
  { key: 'outros', label: '📎 Outros' },
];

function fmtR(val: number) {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  if (!d) return '';
  const parts = (d.split('T')[0] ?? d).split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function buildChartData(summary: MonthlySummary[]) {
  const map: Record<string, { month: string; receita: number; despesa: number }> = {};
  for (const row of summary) {
    if (!map[row.reference_month])
      map[row.reference_month] = { month: row.reference_month, receita: 0, despesa: 0 };
    if (row.entry_type === 'receita') map[row.reference_month].receita += Number(row.total);
    if (row.entry_type === 'despesa') map[row.reference_month].despesa += Number(row.total);
  }
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

export default function FinanceiroTab() {
  const queryClient = useQueryClient();
  const [entryType, setEntryType] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refMonth, setRefMonth] = useState('');
  const [clientUserId, setClientUserId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    entry_date: '',
    entry_type: 'receita',
    category: 'assinatura',
    description: '',
    amount: '',
    notes: '',
    client_user_id: '',
    business_id: '',
  });

  const { data, isLoading } = useQuery<FinancialResponse>({
    queryKey: [
      'admin-financial',
      entryType,
      category,
      startDate,
      endDate,
      refMonth,
      clientUserId,
      businessId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entryType) params.set('entry_type', entryType);
      if (category) params.set('category', category);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (refMonth) params.set('reference_month', refMonth);
      if (clientUserId) params.set('client_user_id', clientUserId);
      if (businessId) params.set('business_id', businessId);
      const res = await fetch(`/api/admin/financial?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar dados financeiros');
      return res.json() as Promise<FinancialResponse>;
    },
  });

  const { data: segData } = useQuery<{ clients: ClientOption[]; businesses: BusinessOption[] }>({
    queryKey: ['admin-clients-businesses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/clients-businesses');
      if (!res.ok) throw new Error('Erro ao carregar clientes/empresas');
      return res.json() as Promise<{ clients: ClientOption[]; businesses: BusinessOption[] }>;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount) || 0,
          client_user_id: form.client_user_id || undefined,
          business_id: form.business_id || undefined,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
    },
    onSuccess: () => {
      toast.success('Lançamento adicionado!');
      setShowModal(false);
      setForm({
        entry_date: '',
        entry_type: 'receita',
        category: 'assinatura',
        description: '',
        amount: '',
        notes: '',
        client_user_id: '',
        business_id: '',
      });
      void queryClient.invalidateQueries({ queryKey: ['admin-financial'] });
    },
    onError: () => toast.error('Erro ao salvar lançamento'),
  });

  const dre = data?.dre;
  const chartData = buildChartData(data?.monthlySummary ?? []);

  const forecastMrr = dre ? Math.max(dre.receita, 0) : 0;
  const forecastItems = [
    { label: '+1 Mês', value: forecastMrr },
    { label: '+3 Meses', value: forecastMrr * 3 },
    { label: '+6 Meses', value: forecastMrr * 6 },
    { label: '+12 Meses', value: forecastMrr * 12 },
  ];

  const selectedClient = segData?.clients.find((c) => c.id === clientUserId);
  const selectedBusiness = segData?.businesses.find((b) => b.id === businessId);

  const hasSegFilter = !!clientUserId || !!businessId;
  const hasAnyFilter =
    entryType || category || startDate || endDate || refMonth || clientUserId || businessId;

  const clearAll = () => {
    setEntryType('');
    setCategory('');
    setStartDate('');
    setEndDate('');
    setRefMonth('');
    setClientUserId('');
    setBusinessId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financeiro</h2>
          <p className="text-gray-500 text-sm mt-1">
            DRE, extrato de lançamentos e previsão de faturamento
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00A9E0] text-white rounded-xl text-sm font-semibold hover:bg-[#0098CC] transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      {/* Segmentation Banner */}
      {hasSegFilter && (
        <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          {selectedClient && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#00A9E0]/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-[#00A9E0]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  Visão por Cliente
                </p>
                <p className="font-bold text-gray-900 truncate">{selectedClient.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedClient.email} · {selectedClient.subscription_level ?? 'sem plano'}
                </p>
              </div>
            </div>
          )}
          {selectedBusiness && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">
                  Visão por Empresa
                </p>
                <p className="font-bold text-gray-900 truncate">
                  {selectedBusiness.alias_name ?? 'Empresa sem nome'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedBusiness.owner_name} · {selectedBusiness.sector ?? 'sem setor'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setClientUserId('');
              setBusinessId('');
            }}
            className="ml-auto shrink-0 p-1.5 hover:bg-blue-100 rounded-lg text-blue-400"
            title="Remover segmentação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DRE Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Receita</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{fmtR(dre?.receita ?? 0)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {hasSegFilter ? 'Total filtrado' : 'Este mês'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm font-semibold text-red-600">Despesas</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{fmtR(dre?.despesa ?? 0)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {hasSegFilter ? 'Total filtrado' : 'Este mês'}
          </div>
        </div>
        <div
          className={`rounded-xl p-5 border ${(dre?.margem ?? 0) >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-100'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Margem Líquida</span>
          </div>
          <div
            className={`text-2xl font-bold ${(dre?.margem ?? 0) >= 0 ? 'text-blue-700' : 'text-red-600'}`}
          >
            {fmtR(dre?.margem ?? 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{dre?.margemPct ?? '0.0'}% da receita</div>
        </div>
      </div>

      {/* Forecast Cards */}
      {!hasSegFilter && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Previsão de Faturamento (baseado na receita do mês)
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {forecastItems.map((f) => (
              <div
                key={f.label}
                className="bg-white rounded-xl border border-gray-200 p-4 text-center"
              >
                <div className="text-xs font-bold text-gray-400 mb-1">{f.label}</div>
                <div className="text-lg font-bold text-gray-900">{fmtR(f.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {chartData.length > 0 && !hasSegFilter && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">
            Receita vs Despesas — Últimos 12 Meses
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  fmtR(value),
                  name === 'receita' ? 'Receita' : 'Despesas',
                ]}
              />
              <Legend
                formatter={(value: string) => (value === 'receita' ? 'Receita' : 'Despesas')}
              />
              <Bar dataKey="receita" fill="#00A9E0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Filtros & Segmentação
        </p>
        {/* Segmentation row */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-600 block mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Cliente / Perfil
            </label>
            <select
              value={clientUserId}
              onChange={(e) => {
                setClientUserId(e.target.value);
                if (e.target.value) setBusinessId('');
              }}
              className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] bg-white"
            >
              <option value="">Todos os clientes</option>
              {segData?.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-600 block mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Empresa
            </label>
            <select
              value={businessId}
              onChange={(e) => {
                setBusinessId(e.target.value);
                if (e.target.value) setClientUserId('');
              }}
              className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] bg-white"
            >
              <option value="">Todas as empresas</option>
              {segData?.businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.alias_name ?? 'Empresa'} — {b.owner_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Regular filters row */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Tipo</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] bg-white"
            >
              <option value="">Todos</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Data Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Data Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
            />
          </div>
          {hasAnyFilter && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <X className="w-3.5 h-3.5" /> Limpar tudo
            </button>
          )}
        </div>
      </div>

      {/* Entries Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#00A9E0] animate-spin" />
        </div>
      ) : (data?.entries?.length ?? 0) === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">Nenhum lançamento encontrado</p>
          <p className="text-gray-400 text-sm">Adicione entradas ou ajuste os filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Descrição</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Categoria</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  Cliente / Empresa
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data!.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {fmtDate(entry.entry_date)}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{entry.description}</p>
                    {entry.notes && <p className="text-xs text-gray-400">{entry.notes}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 capitalize">
                      {entry.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {entry.client_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#00A9E0]" /> {entry.client_name}
                      </span>
                    )}
                    {entry.business_name && (
                      <span className="flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-purple-500" /> {entry.business_name}
                      </span>
                    )}
                    {!entry.client_name && !entry.business_name && '—'}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-bold whitespace-nowrap ${entry.entry_type === 'receita' ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {entry.entry_type === 'receita' ? '+' : '−'} {fmtR(Number(entry.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">Novo Lançamento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={form.entry_type}
                    onChange={(e) => setForm({ ...form, entry_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
                  >
                    {CATEGORIES.slice(1).map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
                  placeholder="Ex: Assinatura Gold – João Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data *</label>
                  <input
                    type="date"
                    value={form.entry_date}
                    onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
                  />
                </div>
              </div>

              {/* Segmentation fields */}
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Vincular a (opcional)
                </p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#00A9E0]" /> Cliente / Perfil
                  </label>
                  <select
                    value={form.client_user_id}
                    onChange={(e) => setForm({ ...form, client_user_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
                  >
                    <option value="">Nenhum</option>
                    {segData?.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" /> Empresa
                  </label>
                  <select
                    value={form.business_id}
                    onChange={(e) => setForm({ ...form, business_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0]"
                  >
                    <option value="">Nenhuma</option>
                    {segData?.businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.alias_name ?? 'Empresa'} — {b.owner_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] resize-none"
                  placeholder="Informações adicionais (opcional)"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={
                  addMutation.isPending || !form.description || !form.amount || !form.entry_date
                }
                className="flex-1 px-4 py-2.5 bg-[#00A9E0] text-white rounded-xl text-sm font-semibold hover:bg-[#0098CC] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
