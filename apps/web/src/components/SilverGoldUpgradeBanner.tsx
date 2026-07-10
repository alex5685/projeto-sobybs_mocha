'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { X, Star, TrendingUp, BarChart3, Shield, Zap, Crown } from 'lucide-react';

interface SilverGoldUpgradeBannerProps {
  businessId?: string;
  planType?: string | null; // null = sem plano, 'bronze' = Phase1
}

export default function SilverGoldUpgradeBanner({
  businessId,
  planType,
}: SilverGoldUpgradeBannerProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = `silver_banner_dismissed_${planType || 'free'}`;
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem(key) === 'true');
    }
  }, [planType]);

  const handleDismiss = () => {
    const key = `silver_banner_dismissed_${planType || 'free'}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, 'true');
    }
    setDismissed(true);
  };

  const handleUpgrade = () => {
    const url = `/planos?source=dashboard_banner${businessId ? `&businessId=${businessId}` : ''}`;
    navigate(url);
  };

  if (!mounted || dismissed) return null;

  const isBronze = planType === 'bronze';

  return (
    <div className="relative mb-8 rounded-2xl overflow-hidden border border-[#00A9E0]/30 shadow-xl bg-gradient-to-br from-[#001f3f] via-[#003366] to-[#00264d]">
      {/* Decorative glow blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#00A9E0] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500 opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition z-10"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#00A9E0]/20 border border-[#00A9E0]/40 rounded-full">
                <Star className="w-3.5 h-3.5 text-[#00A9E0] fill-[#00A9E0]" />
                <span className="text-[#00A9E0] text-xs font-bold tracking-wide uppercase">
                  Mais Escolhido
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white/80 text-xs font-semibold">Plano Silver</span>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
              {isBronze
                ? 'Faça upgrade para o Silver e desbloqueie o Valuation Completo com IA'
                : 'Seu Valuation Rápido está pronto — agora vá além com a Fase 2'}
            </h2>
            <p className="text-white/60 text-base mb-5">
              {isBronze
                ? 'Com o plano Bronze você vê a faixa estimada. O Silver entrega análise profunda com IA, múltiplas metodologias, riscos e recomendações práticas para valorizar mais sua empresa.'
                : 'O Valuation Rápido te deu uma faixa inicial. O Valuation Completo usa IA com pesquisa de mercado real para calcular o valor com até 5 metodologias e identificar o que fazer para aumentar o preço de venda.'}
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  icon: <BarChart3 className="w-4 h-4 text-[#00A9E0]" />,
                  label: '3–5 metodologias de valuation (SDE, EBITDA, Receita, DCF)',
                },
                {
                  icon: <TrendingUp className="w-4 h-4 text-green-400" />,
                  label: 'IA pesquisa múltiplos de M&A em tempo real no Brasil',
                },
                {
                  icon: <Shield className="w-4 h-4 text-purple-400" />,
                  label: 'Análise de riscos específicos do seu negócio',
                },
                {
                  icon: <Zap className="w-4 h-4 text-amber-400" />,
                  label: 'Recomendações práticas para aumentar o valor da empresa',
                },
              ].map(({ icon, label }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="mt-0.5 flex-shrink-0">{icon}</div>
                  <span className="text-white/75 text-sm leading-snug">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={handleUpgrade}
                className="px-7 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] hover:from-[#0098CC] hover:to-[#00A9E0] text-white font-bold rounded-xl shadow-lg shadow-[#00A9E0]/30 transition-all text-sm"
              >
                Assinar Silver agora →
              </button>
              <button
                onClick={() =>
                  navigate(
                    `/planos?source=dashboard_banner${businessId ? `&businessId=${businessId}` : ''}`
                  )
                }
                className="text-white/50 hover:text-white/80 text-sm transition underline underline-offset-2"
              >
                Ver todos os planos
              </button>
            </div>
          </div>

          {/* Price card */}
          <div className="md:w-52 flex-shrink-0">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Plano Silver</p>
              <div className="text-white font-bold text-3xl mb-0.5">Silver</div>
              <p className="text-[#00A9E0] text-sm font-medium mb-4">O mais procurado ⭐</p>
              <div className="space-y-1.5 text-left">
                {[
                  'Valuation Completo IA',
                  'Revisões ilimitadas',
                  'Análise de riscos',
                  'Score de atratividade',
                  'Recomendações práticas',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#00A9E0]/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00A9E0]" />
                    </div>
                    <span className="text-white/70 text-xs">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="mt-4 text-white/30 text-xs">
          {isBronze
            ? 'Plano Silver inclui tudo do Bronze + Valuation Completo com IA e revisões ilimitadas.'
            : 'O plano Silver é o mais contratado pelos vendedores da plataforma. Cancele quando quiser.'}
        </p>
      </div>
    </div>
  );
}
