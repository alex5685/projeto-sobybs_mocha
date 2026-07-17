'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Globe,
  Users,
  UserCheck,
  UserX,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Lock,
  Unlock,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DailyView {
  day: string;
  views: number;
  visitors: number;
  auth_users: number;
}

interface PageRow {
  path: string;
  views: number;
  unique_visitors?: number;
  unique_users?: number;
}

interface HourRow {
  hour: number;
  views: number;
  visitors: number;
}

interface SegmentOverview {
  segment: string;
  views: number;
  visitors: number;
}

interface AnalyticsData {
  general: {
    totalViews: number;
    uniqueVisitors: number;
    uniqueUsers: number;
    viewsToday: number;
    viewsYesterday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
    dailyViews: DailyView[];
    topPages: PageRow[];
    hourlyToday: HourRow[];
  };
  segmented: {
    overview: SegmentOverview[];
    topPagesAuth: PageRow[];
    topPagesAnon: PageRow[];
    converted: number;
  };
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${color} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function PageList({ pages, valueLabel }: { pages: PageRow[]; valueLabel: string }) {
  if (!pages.length)
    return (
      <p className="text-gray-400 text-sm text-center py-8 italic">Nenhuma visita registrada</p>
    );
  const max = pages[0]?.views ?? 1;
  return (
    <div className="space-y-2">
      {pages.map((p) => {
        const pct = Math.round((p.views / max) * 100);
        return (
          <div key={p.path} className="flex items-center gap-3 text-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="font-mono text-xs text-gray-700 truncate max-w-[240px]"
                  title={p.path}
                >
                  {p.path}
                </span>
                <span className="font-bold text-gray-900 ml-2 flex-shrink-0">
                  {p.views.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 bg-[#00A9E0] rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="text-xs text-gray-400 w-24 text-right flex-shrink-0">
              {valueLabel === 'únicos' ? (p.unique_visitors ?? p.unique_users ?? 0) : p.views}{' '}
              {valueLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function VisitantesTab() {
  const [view, setView] = useState<'geral' | 'segmentado'>('geral');

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Erro ao carregar analytics');
      return res.json() as Promise<AnalyticsData>;
    },
    staleTime: 60_000, // 1 min
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2
          className="w-8 h-8 text-[#00A9E0]"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 bg-red-50 rounded-xl border border-red-200">
        <Globe className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 font-semibold">Erro ao carregar dados de visitantes</p>
        <p className="text-red-400 text-sm mt-1">
          {error instanceof Error ? error.message : 'Tente novamente'}
        </p>
      </div>
    );
  }

  const { general, segmented } = data;

  const authSeg = segmented.overview.find((s) => s.segment === 'authenticated');
  const anonSeg = segmented.overview.find((s) => s.segment === 'anonymous');
  const totalSegViews = (authSeg?.views ?? 0) + (anonSeg?.views ?? 0);
  const authPct = totalSegViews > 0 ? Math.round(((authSeg?.views ?? 0) / totalSegViews) * 100) : 0;
  const anonPct = 100 - authPct;

  const todayDelta = general.viewsToday - general.viewsYesterday;

  // Build 24-hour grid for today
  const hourlyMap: Record<number, HourRow> = {};
  general.hourlyToday.forEach((h) => (hourlyMap[h.hour] = h));
  const hourlyChart = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}h`,
    views: hourlyMap[i]?.views ?? 0,
    visitors: hourlyMap[i]?.visitors ?? 0,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visitantes & Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">
            Dados de tráfego em tempo real — anônimos e autenticados
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setView('geral')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'geral' ? 'bg-white text-[#00A9E0] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Globe className="w-4 h-4" /> Geral
          </button>
          <button
            onClick={() => setView('segmentado')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'segmentado' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users className="w-4 h-4" /> Segmentado
          </button>
        </div>
      </div>

      {/* ── GERAL VIEW ──────────────────────────────────────────────────────── */}
      {view === 'geral' && (
        <div className="space-y-8">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<Eye className="w-6 h-6 text-[#00A9E0]" />}
              label="Visualizações hoje"
              value={general.viewsToday.toLocaleString('pt-BR')}
              sub={todayDelta >= 0 ? `+${todayDelta} vs ontem` : `${todayDelta} vs ontem`}
              color="bg-blue-50 border-blue-200"
            />
            <KpiCard
              icon={<Users className="w-6 h-6 text-purple-500" />}
              label="Visitantes únicos (30d)"
              value={general.uniqueVisitors.toLocaleString('pt-BR')}
              sub="Por ID de sessão"
              color="bg-purple-50 border-purple-200"
            />
            <KpiCard
              icon={<TrendingUp className="w-6 h-6 text-green-500" />}
              label="Views esta semana"
              value={general.viewsThisWeek.toLocaleString('pt-BR')}
              color="bg-green-50 border-green-200"
            />
            <KpiCard
              icon={<BarChart2 className="w-6 h-6 text-amber-500" />}
              label="Views este mês"
              value={general.viewsThisMonth.toLocaleString('pt-BR')}
              sub={`Total: ${general.totalViews.toLocaleString('pt-BR')}`}
              color="bg-amber-50 border-amber-200"
            />
          </div>

          {/* Today delta note */}
          <div className="flex items-center gap-2 text-sm">
            {todayDelta >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span
              className={
                todayDelta >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'
              }
            >
              {Math.abs(todayDelta)} views {todayDelta >= 0 ? 'a mais' : 'a menos'} que ontem
            </span>
            <span className="text-gray-400">
              (hoje: {general.viewsToday} · ontem: {general.viewsYesterday})
            </span>
          </div>

          {/* Daily views chart (30d) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Visualizações — últimos 30 dias
            </h3>
            {general.dailyViews.length === 0 ? (
              <p className="text-center text-gray-400 py-12 italic">Sem dados ainda</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={general.dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ReTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    name="Visualizações"
                    stroke="#00A9E0"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    name="Visitantes únicos"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Hourly today + Top pages side by side */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hourly chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
                📊 Acessos por hora — hoje
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ReTooltip />
                  <Bar dataKey="views" name="Visualizações" fill="#00A9E0" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top pages */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
                🔥 Páginas mais acessadas (30d)
              </h3>
              <PageList pages={general.topPages} valueLabel="views" />
            </div>
          </div>
        </div>
      )}

      {/* ── SEGMENTADO VIEW ─────────────────────────────────────────────────── */}
      {view === 'segmentado' && (
        <div className="space-y-8">
          {/* Segment KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<UserCheck className="w-6 h-6 text-green-600" />}
              label="Views autenticados (30d)"
              value={(authSeg?.views ?? 0).toLocaleString('pt-BR')}
              sub={`${authSeg?.visitors ?? 0} usuários distintos`}
              color="bg-green-50 border-green-200"
            />
            <KpiCard
              icon={<UserX className="w-6 h-6 text-gray-500" />}
              label="Views anônimos (30d)"
              value={(anonSeg?.views ?? 0).toLocaleString('pt-BR')}
              sub={`${anonSeg?.visitors ?? 0} visitantes distintos`}
              color="bg-gray-50 border-gray-200"
            />
            <KpiCard
              icon={<Lock className="w-6 h-6 text-[#00A9E0]" />}
              label="Usuários logados (total)"
              value={general.uniqueUsers.toLocaleString('pt-BR')}
              sub="Com conta registrada"
              color="bg-blue-50 border-blue-200"
            />
            <KpiCard
              icon={<ArrowUpRight className="w-6 h-6 text-purple-500" />}
              label="Convertidos (anon → auth)"
              value={segmented.converted.toLocaleString('pt-BR')}
              sub="Visitaram anônimos e depois logaram"
              color="bg-purple-50 border-purple-200"
            />
          </div>

          {/* Auth vs Anon ratio bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-5 flex items-center gap-2">
              <Users className="w-4 h-4" /> Distribuição de tráfego (30 dias)
            </h3>
            <div className="space-y-4">
              {/* Visual bar */}
              <div className="flex rounded-full overflow-hidden h-8">
                {authPct > 0 && (
                  <div
                    className="bg-green-400 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${authPct}%` }}
                    title={`Autenticados: ${authPct}%`}
                  >
                    {authPct >= 10 ? `${authPct}%` : ''}
                  </div>
                )}
                {anonPct > 0 && (
                  <div
                    className="bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold"
                    style={{ width: `${anonPct}%` }}
                    title={`Anônimos: ${anonPct}%`}
                  >
                    {anonPct >= 10 ? `${anonPct}%` : ''}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-gray-700">
                    Autenticados — <strong>{authSeg?.views ?? 0}</strong> views ({authPct}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-gray-700">
                    Anônimos — <strong>{anonSeg?.views ?? 0}</strong> views ({anonPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Daily chart with auth breakdown */}
            {general.dailyViews.length > 0 && (
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={general.dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ReTooltip />
                    <Legend />
                    <Bar
                      dataKey="auth_users"
                      name="Autenticados"
                      stackId="a"
                      fill="#4ADE80"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey={(d: { views: number; auth_users: number }) => d.views - d.auth_users}
                      name="Anônimos"
                      stackId="a"
                      fill="#D1D5DB"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top pages split */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Auth top pages */}
            <div className="bg-white rounded-2xl border-2 border-green-200 p-6">
              <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Páginas — usuários autenticados
              </h3>
              <PageList pages={segmented.topPagesAuth} valueLabel="únicos" />
            </div>

            {/* Anon top pages */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Unlock className="w-4 h-4" /> Páginas — visitantes anônimos
              </h3>
              <PageList pages={segmented.topPagesAnon} valueLabel="únicos" />
            </div>
          </div>

          {/* Conversion insight */}
          {segmented.converted > 0 && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5 flex items-start gap-4">
              <ArrowUpRight className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-purple-900">
                  {segmented.converted} visitante{segmented.converted !== 1 ? 's' : ''} convertido
                  {segmented.converted !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  Esses visitantes acessaram páginas de forma anônima em algum momento e
                  posteriormente criaram conta ou fizeram login — uma excelente indicação de que a
                  plataforma está convertendo bem.
                </p>
                {anonSeg && anonSeg.visitors > 0 && (
                  <p className="text-xs text-purple-500 mt-2">
                    Taxa de conversão estimada:{' '}
                    <strong>{((segmented.converted / anonSeg.visitors) * 100).toFixed(1)}%</strong>{' '}
                    dos visitantes anônimos
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
