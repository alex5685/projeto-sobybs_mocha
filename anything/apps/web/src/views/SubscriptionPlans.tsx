'use client';

import {
  Check,
  ArrowRight,
  TrendingUp,
  Shield,
  FileSearch,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useNavigate, useSearchParams } from '@/lib/router-shim';
import { useAuth } from '@/lib/auth-shim';
import { useState, useEffect } from 'react';

interface PlanService {
  id: number;
  plan_name: string;
  service_description: string;
  display_order: number;
  is_active: number;
}

// Parse category prefix from service description
const CATEGORIES = {
  due_diligence: '[Due Diligence do Comprador]',
  documentacao: '[Documentação da Empresa]',
};

function parseServiceCategory(desc: string): { category: string; label: string; text: string } {
  if (desc.startsWith(CATEGORIES.due_diligence)) {
    return {
      category: 'due_diligence',
      label: 'Due Diligence do Comprador',
      text: desc.replace(CATEGORIES.due_diligence, '').trim(),
    };
  }
  if (desc.startsWith(CATEGORIES.documentacao)) {
    return {
      category: 'documentacao',
      label: 'Documentação da Empresa',
      text: desc.replace(CATEGORIES.documentacao, '').trim(),
    };
  }
  return { category: 'geral', label: 'Serviços Gerais', text: desc };
}

function groupServices(services: PlanService[]) {
  const groups: Record<string, { label: string; items: string[] }> = {
    geral: { label: 'Serviços Gerais', items: [] },
    due_diligence: { label: 'Due Diligence do Comprador (CPF/CNPJ)', items: [] },
    documentacao: { label: 'Documentação da Empresa', items: [] },
  };
  for (const s of services) {
    const { category, text } = parseServiceCategory(s.service_description);
    groups[category].items.push(text);
  }
  return groups;
}

const defaultPlanConfigs = {
  bronze: {
    name: 'Bronze',
    price: 500,
    color: 'from-amber-600 to-amber-700',
    badge: 'Melhor Custo-Benefício',
    badgeColor: 'bg-amber-100 text-amber-800',
    popular: false,
    emoji: '🥉',
    certidoesLevel: 'Básico',
    certidoesColor: 'text-amber-700',
    certidoesBg: 'bg-amber-50',
  },
  silver: {
    name: 'Silver',
    price: 1800,
    color: 'from-gray-400 to-gray-500',
    badge: 'Mais Popular',
    badgeColor: 'bg-[#00A9E0]/10 text-[#00A9E0]',
    popular: true,
    emoji: '🥈',
    certidoesLevel: 'Intermediário',
    certidoesColor: 'text-gray-600',
    certidoesBg: 'bg-gray-50',
  },
  gold: {
    name: 'Gold',
    price: 3000,
    color: 'from-[#FFD700] to-[#FFC700]',
    badge: 'Completo',
    badgeColor: 'bg-[#FFD700]/20 text-gray-900',
    popular: false,
    emoji: '🥇',
    certidoesLevel: 'Completo',
    certidoesColor: 'text-yellow-700',
    certidoesBg: 'bg-yellow-50',
  },
};

const categoryIcons: Record<string, React.ReactNode> = {
  geral: <Building2 className="w-4 h-4" />,
  due_diligence: <FileSearch className="w-4 h-4" />,
  documentacao: <Shield className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  geral:
    'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700',
  due_diligence:
    'text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700',
  documentacao:
    'text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700',
};

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

interface ComparisonRow {
  id: number;
  section: string;
  row_type: string;
  label: string;
  bronze_value: string;
  silver_value: string;
  gold_value: string;
  display_order: number;
  is_active: number;
}

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user, isPending } = useAuth();
  const [searchParams] = useSearchParams();
  const [planServices, setPlanServices] = useState<Record<string, PlanService[]>>({
    bronze: [],
    silver: [],
    gold: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [valuation, setValuation] = useState<QuickValuation | null>(null);
  const [fromQuickValuation, setFromQuickValuation] = useState(false);
  const [planConfigs, setPlanConfigs] = useState(defaultPlanConfigs);
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([]);
  const [faqs, setFaqs] = useState<{ id: number; question: string; answer: string }[]>([]);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  useEffect(() => {
    const loadPlanPrices = async () => {
      try {
        const response = await fetch('/api/plans/prices');
        if (response.ok) {
          const data = (await response.json()) as {
            prices: { bronze: number; silver: number; gold: number };
          };
          setPlanConfigs((prev) => ({
            ...prev,
            bronze: { ...prev.bronze, price: data.prices.bronze },
            silver: { ...prev.silver, price: data.prices.silver },
            gold: { ...prev.gold, price: data.prices.gold },
          }));
        }
      } catch (error) {
        console.error('Error loading plan prices:', error);
      }
    };
    loadPlanPrices();
  }, []);

  useEffect(() => {
    const loadPlanServices = async () => {
      try {
        const response = await fetch('/api/admin/plan-services/all');
        if (response.ok) {
          const data = (await response.json()) as { services: Record<string, PlanService[]> };
          setPlanServices(data.services);
        }
      } catch (error) {
        console.error('Error loading plan services:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlanServices();
  }, []);

  useEffect(() => {
    const loadValuationData = async () => {
      const source = searchParams.get('source');
      const valuationId = searchParams.get('valuationId');
      const businessId = searchParams.get('businessId');
      if (source === 'valuation_quick') {
        setFromQuickValuation(true);
        if (valuationId) {
          try {
            const response = await fetch(`/api/valuations/${valuationId}`);
            if (response.ok) {
              const data = (await response.json()) as { valuation: QuickValuation };
              setValuation(data.valuation);
              await fetch(`/api/valuations/${valuationId}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'upgrade_view',
                  source: 'valuation_quick',
                  businessId,
                }),
              });
            }
          } catch (error) {
            console.error('Error loading valuation:', error);
          }
        } else if (businessId) {
          try {
            const response = await fetch(`/api/business/${businessId}/quick-valuation`);
            if (response.ok) {
              const data = (await response.json()) as { valuation: QuickValuation };
              setValuation(data.valuation);
            }
          } catch (error) {
            console.error('Error loading quick valuation:', error);
          }
        }
      }
    };
    loadValuationData();
  }, [searchParams]);

  useEffect(() => {
    const loadComparisonRows = async () => {
      try {
        const res = await fetch('/api/admin/comparison-rows');
        if (res.ok) {
          const data = (await res.json()) as { rows: ComparisonRow[] };
          setComparisonRows(data.rows.filter((r) => r.is_active));
        }
      } catch (err) {
        console.error('Error loading comparison rows:', err);
      }
    };
    loadComparisonRows();
  }, []);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const res = await fetch('/api/admin/faqs/all');
        if (res.ok) {
          const data = await res.json();
          setFaqs(data.faqs ?? []);
        }
      } catch (err) {
        console.error('Error loading FAQs:', err);
      }
    };
    loadFaqs();
  }, []);

  const handleSelectPlan = (planName: string) => {
    if (!user && !isPending) {
      navigate('/');
      return;
    }
    console.log('Selected plan:', planName);
  };

  // Helper to render a cell value
  const renderCell = (value: string, rowType: string, plan: 'bronze' | 'silver' | 'gold') => {
    if (rowType === 'level') {
      if (!value) return <span className="text-muted-foreground/40">—</span>;
      const badgeClasses = {
        bronze: 'bg-amber-100 text-amber-800',
        silver: 'bg-gray-100 text-gray-700',
        gold: 'bg-yellow-100 text-yellow-800',
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClasses[plan]}`}>
          {value}
        </span>
      );
    }
    if (value === 'check') return <Check className="w-4 h-4 text-green-500 mx-auto" />;
    if (!value) return <span className="text-muted-foreground/40">—</span>;
    return <span className="text-muted-foreground">{value}</span>;
  };

  const geralRows = comparisonRows.filter((r) => r.section === 'geral');
  const certidoesRows = comparisonRows.filter((r) => r.section === 'certidoes');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center">
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs Logo"
                className="h-16 w-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-foreground hover:text-primary font-medium transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick Valuation Banner */}
        {fromQuickValuation && (
          <div className="bg-primary/10 rounded-2xl border-2 border-primary p-8 mb-12 shadow-lg">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-12 h-12 text-primary flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  🎯 Escolha o Valuation Profissional Ideal
                </h2>
                {valuation ? (
                  <>
                    <div className="bg-card border border-border rounded-xl p-6 mb-4 shadow-md">
                      <p className="text-lg text-foreground mb-2">
                        Seu valuation rápido mostrou:{' '}
                        <span className="font-bold text-primary">
                          R$ {valuation.valor_minimo.toLocaleString('pt-BR')} - R${' '}
                          {valuation.valor_maximo.toLocaleString('pt-BR')}
                        </span>
                      </p>
                      <p className="text-md text-muted-foreground">
                        Faixa de incerteza:{' '}
                        <span className="font-semibold text-orange-600">
                          R${' '}
                          {(valuation.valor_maximo - valuation.valor_minimo).toLocaleString(
                            'pt-BR'
                          )}
                        </span>
                      </p>
                    </div>
                    <p className="text-foreground text-lg">
                      Veja como cada plano reduz essa incerteza e aumenta suas chances de vender
                      pelo melhor preço:
                    </p>
                  </>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-6 mb-4 shadow-md">
                    <p className="text-lg text-foreground">
                      Você viu um valuation rápido — desbloqueie o valuation completo para ter uma
                      estimativa precisa e profissional do valor da sua empresa.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Escolha Seu Plano de Consultoria
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Todos os planos têm contratação mínima de 3 meses e incluem suporte especializado para
            venda ou compra do seu negócio
          </p>
          <div className="bg-primary/10 rounded-xl p-6 max-w-4xl mx-auto">
            <h3 className="font-semibold text-foreground mb-3">
              Como Funciona o Modelo de Receita
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-left text-sm">
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <p className="font-semibold text-primary mb-2">Plano Mensal de Consultoria</p>
                <p className="text-muted-foreground">
                  Valor fixo mensal que cobre o trabalho de captação e garimpagem de compradores ou
                  vendedores interessados na sua empresa.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <p className="font-semibold text-green-600 mb-2">Comissão sobre Fechamento</p>
                <p className="text-muted-foreground">
                  Percentual cobrado apenas quando a venda da empresa é concretizada, calculado
                  sobre o valor final da transação.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {isLoading ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-muted-foreground">Carregando planos...</p>
            </div>
          ) : (
            Object.entries(planConfigs).map(([planKey, plan]) => {
              return (
                <div
                  key={plan.name}
                  className={`relative bg-card border border-border rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl flex flex-col ${plan.popular ? 'ring-4 ring-primary' : ''}`}
                >
                  {plan.badge && (
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.badgeColor}`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className={`bg-gradient-to-r ${plan.color} p-8 text-white`}>
                    <h3 className="text-3xl font-bold mb-2">
                      {plan.emoji} {plan.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold">
                        R$ {plan.price.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xl ml-2 opacity-90">/mês</span>
                    </div>
                    <p className="text-sm mt-2 opacity-90">Mínimo 3 meses</p>
                    <p className="text-xs mt-1 font-semibold">
                      Total: R$ {(plan.price * 3).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Dynamic services from DB — managed entirely via admin panel */}
                    {planServices[planKey as keyof typeof planServices]?.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhum serviço cadastrado ainda.
                      </p>
                    ) : (
                      (['geral', 'due_diligence', 'documentacao'] as const).map((cat) => {
                        const group = groupServices(
                          planServices[planKey as keyof typeof planServices] ?? []
                        )[cat];
                        if (!group || group.items.length === 0) return null;
                        return (
                          <div key={cat} className="mb-4">
                            <div
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold mb-2 w-fit ${categoryColors[cat]}`}
                            >
                              {categoryIcons[cat]}
                              {cat === 'geral'
                                ? 'Serviços Gerais'
                                : cat === 'due_diligence'
                                  ? 'Due Diligence do Comprador'
                                  : 'Documentação da Empresa'}
                            </div>
                            <ul className="space-y-2">
                              {group.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-foreground text-sm leading-relaxed">
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })
                    )}

                    <p className="text-xs text-muted-foreground mt-auto pt-4 border-t border-border mb-5">
                      * Precisão estimada depende da qualidade dos dados informados e do setor.
                    </p>

                    <button
                      onClick={() => handleSelectPlan(planKey)}
                      className={`w-full py-4 rounded-xl font-semibold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 ${plan.popular ? 'bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white hover:from-[#0098CC] hover:to-[#00A9E0]' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'}`}
                    >
                      <span>
                        {fromQuickValuation
                          ? planKey === 'bronze'
                            ? 'Desbloquear valuation completo'
                            : planKey === 'silver'
                              ? 'Desbloquear valuation avançado'
                              : 'Desbloquear premium'
                          : `Contratar ${plan.name}`}
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    {fromQuickValuation && planKey === 'silver' && (
                      <p className="text-center text-sm text-primary font-semibold mt-2">
                        ⭐ Melhor custo-benefício
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2 text-center">
            Comparação Detalhada dos Planos
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Veja exatamente o que cada plano oferece
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-4 px-4 text-foreground font-semibold w-1/2">
                    Recurso
                  </th>
                  <th className="text-center py-4 px-4 text-amber-700 font-bold">🥉 Bronze</th>
                  <th className="text-center py-4 px-4 text-gray-600 font-bold">🥈 Silver</th>
                  <th className="text-center py-4 px-4 text-yellow-600 font-bold">🥇 Gold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* === SERVIÇOS GERAIS === */}
                {geralRows.length > 0 && (
                  <tr className="bg-blue-100 dark:bg-blue-900/40">
                    <td
                      colSpan={4}
                      className="py-3 px-4 font-bold text-blue-800 dark:text-blue-200"
                    >
                      <Building2 className="w-4 h-4 inline mr-1" /> Serviços Gerais
                    </td>
                  </tr>
                )}
                {geralRows.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 1 ? 'bg-secondary/30' : ''}>
                    <td className="py-3 px-4 text-foreground pl-6">{row.label}</td>
                    <td className="text-center py-3 px-4">
                      {renderCell(row.bronze_value, row.row_type, 'bronze')}
                    </td>
                    <td className="text-center py-3 px-4">
                      {renderCell(row.silver_value, row.row_type, 'silver')}
                    </td>
                    <td className="text-center py-3 px-4">
                      {renderCell(row.gold_value, row.row_type, 'gold')}
                    </td>
                  </tr>
                ))}

                {/* === DUE DILIGENCE + DOCUMENTAÇÃO === */}
                {certidoesRows.length > 0 && (
                  <tr className="bg-purple-100 dark:bg-purple-900/40">
                    <td
                      colSpan={4}
                      className="py-3 px-4 font-bold text-purple-800 dark:text-purple-200"
                    >
                      <FileSearch className="w-4 h-4 inline mr-1" /> Due Diligence do Comprador
                      (CPF/CNPJ) &amp; Documentação da Empresa
                    </td>
                  </tr>
                )}
                {certidoesRows.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 1 ? 'bg-secondary/30' : ''}>
                    <td
                      className={`py-3 px-4 pl-6 ${row.row_type === 'level' ? 'font-semibold text-foreground' : 'text-foreground'}`}
                    >
                      {row.label}
                    </td>
                    <td className="text-center py-3 px-4">
                      {renderCell(row.bronze_value, row.row_type, 'bronze')}
                    </td>
                    <td className="text-center py-3 px-4">
                      {renderCell(row.silver_value, row.row_type, 'silver')}
                    </td>
                    <td className="text-center py-3 px-4">
                      {renderCell(row.gold_value, row.row_type, 'gold')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">Perguntas Frequentes</h2>
          {faqs.length > 0 ? (
            <div className="max-w-4xl mx-auto space-y-4 text-left">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-card border border-border rounded-xl shadow-md overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-secondary transition-colors"
                  >
                    <h3 className="font-semibold text-foreground pr-4">{faq.question}</h3>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${openFaqId === faq.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaqId === faq.id && (
                    <div className="px-6 pb-5 pt-2">
                      <div className="border-t border-border pt-4">
                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Fallback hardcoded content shown only when no FAQs exist in DB */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-md text-left">
                <h3 className="font-semibold text-foreground mb-2">
                  Posso cancelar a qualquer momento?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Todos os planos têm contratação mínima de 3 meses. Após esse período, você pode
                  cancelar com 30 dias de antecedência.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-md text-left">
                <h3 className="font-semibold text-foreground mb-2">Posso mudar de plano?</h3>
                <p className="text-muted-foreground text-sm">
                  Sim! Você pode fazer upgrade do seu plano a qualquer momento. O valor será
                  ajustado proporcionalmente.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-md text-left">
                <h3 className="font-semibold text-foreground mb-2">Como funciona o pagamento?</h3>
                <p className="text-muted-foreground text-sm">
                  Aceitamos cartão de crédito, débito em conta e boleto bancário. O pagamento é
                  processado mensalmente de forma automática.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-md text-left">
                <h3 className="font-semibold text-foreground mb-2">Qual plano é recomendado?</h3>
                <p className="text-muted-foreground text-sm">
                  O plano Silver é o mais popular e oferece excelente custo-benefício. Para negócios
                  de maior valor, recomendamos o Gold.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
