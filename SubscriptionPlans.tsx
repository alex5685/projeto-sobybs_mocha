import { Check, ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@getmocha/users-service/react";
import { useState, useEffect } from "react";

interface PlanService {
  id: number;
  plan_name: string;
  service_description: string;
  display_order: number;
  is_active: number;
}

const planConfigs = {
  bronze: {
    name: "Bronze",
    price: 500,
    color: "from-amber-600 to-amber-700",
    badge: "Melhor Custo-Benefício",
    badgeColor: "bg-amber-100 text-amber-800",
    popular: false,
  },
  silver: {
    name: "Silver",
    price: 1800,
    color: "from-gray-400 to-gray-500",
    badge: "Mais Popular",
    badgeColor: "bg-[#00A9E0]/10 text-[#00A9E0]",
    popular: true,
  },
  gold: {
    name: "Gold",
    price: 3000,
    color: "from-[#FFD700] to-[#FFC700]",
    badge: "Completo",
    badgeColor: "bg-[#FFD700]/20 text-gray-900",
    popular: false,
  },
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

  useEffect(() => {
    const loadPlanServices = async () => {
      try {
        const response = await fetch("/api/admin/plan-services/all");
        if (response.ok) {
          const data = await response.json();
          setPlanServices(data.services);
        }
      } catch (error) {
        console.error("Error loading plan services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlanServices();
  }, []);

  useEffect(() => {
    const loadValuationData = async () => {
      const source = searchParams.get("source");
      const valuationId = searchParams.get("valuationId");
      const businessId = searchParams.get("businessId");

      if (source === "valuation_quick") {
        setFromQuickValuation(true);

        // Try to fetch valuation data
        if (valuationId) {
          try {
            const response = await fetch(`/api/valuations/${valuationId}`);
            if (response.ok) {
              const data = await response.json();
              setValuation(data.valuation);
              
              // Track upgrade view
              await fetch(`/api/valuations/${valuationId}/track`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "upgrade_view",
                  source: "valuation_quick",
                  businessId,
                }),
              });
            }
          } catch (error) {
            console.error("Error loading valuation:", error);
          }
        } else if (businessId) {
          // Fallback: get last quick valuation for the business
          try {
            const response = await fetch(`/api/business/${businessId}/quick-valuation`);
            if (response.ok) {
              const data = await response.json();
              setValuation(data.valuation);
            }
          } catch (error) {
            console.error("Error loading quick valuation:", error);
          }
        }
      }
    };

    loadValuationData();
  }, [searchParams]);

  const handleSelectPlan = (planName: string) => {
    if (!user && !isPending) {
      navigate("/");
      return;
    }
    // TODO: Navigate to payment page
    console.log("Selected plan:", planName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center">
              <img
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png"
                alt="Sobybs Logo"
                className="h-16 w-auto cursor-pointer"
                onClick={() => navigate("/")}
              />
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick Valuation Conversion Section */}
        {fromQuickValuation && (
          <div className="bg-gradient-to-r from-[#00A9E0]/10 via-blue-50 to-[#00A9E0]/10 rounded-2xl border-2 border-[#00A9E0] p-8 mb-12 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <TrendingUp className="w-12 h-12 text-[#00A9E0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🎯 Escolha o Valuation Profissional Ideal
                </h2>
                {valuation ? (
                  <>
                    <div className="bg-white rounded-xl p-6 mb-4 shadow-md">
                      <p className="text-lg text-gray-700 mb-2">
                        Seu valuation rápido mostrou:{" "}
                        <span className="font-bold text-[#00A9E0]">
                          R$ {valuation.valor_minimo.toLocaleString("pt-BR")} - R${" "}
                          {valuation.valor_maximo.toLocaleString("pt-BR")}
                        </span>
                      </p>
                      <p className="text-md text-gray-600">
                        Faixa de incerteza:{" "}
                        <span className="font-semibold text-orange-600">
                          R$ {(valuation.valor_maximo - valuation.valor_minimo).toLocaleString("pt-BR")}
                        </span>
                      </p>
                    </div>
                    <p className="text-gray-700 text-lg">
                      Veja como cada plano reduz essa incerteza e aumenta suas chances de vender pelo melhor preço:
                    </p>
                  </>
                ) : (
                  <div className="bg-white rounded-xl p-6 mb-4 shadow-md">
                    <p className="text-lg text-gray-700">
                      Você viu um valuation rápido — desbloqueie o valuation completo para ter uma estimativa
                      precisa e profissional do valor da sua empresa.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Escolha Seu Plano de Consultoria
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Todos os planos têm contratação mínima de 3 meses e incluem suporte especializado para
            venda ou compra do seu negócio
          </p>
          <div className="bg-gradient-to-r from-[#00A9E0]/10 to-blue-50 rounded-xl p-6 max-w-4xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Como Funciona o Modelo de Receita</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left text-sm">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="font-semibold text-[#00A9E0] mb-2">Plano Mensal de Consultoria</p>
                <p className="text-gray-700">Valor fixo mensal que cobre o trabalho de captação e garimpagem de compradores ou vendedores interessados na sua empresa.</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="font-semibold text-green-600 mb-2">Comissão sobre Fechamento</p>
                <p className="text-gray-700">Percentual cobrado apenas quando a venda da empresa é concretizada, calculado sobre o valor final da transação.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {isLoading ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-600">Carregando planos...</p>
            </div>
          ) : (
            Object.entries(planConfigs).map(([planKey, plan]) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl ${
                plan.popular ? "ring-4 ring-[#00A9E0]" : ""
              }`}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className={`bg-gradient-to-r ${plan.color} p-8 text-white`}>
                <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold">R$ {plan.price.toLocaleString("pt-BR")}</span>
                  <span className="text-xl ml-2 opacity-90">/mês</span>
                </div>
                <p className="text-sm mt-2 opacity-90">Mínimo 3 meses</p>
                <p className="text-xs mt-1 font-semibold">
                  Total: R$ {(plan.price * 3).toLocaleString("pt-BR")}
                </p>
              </div>

              {/* Features List */}
              <div className="p-8">
                {/* Valuation Benefits Section */}
                <div className="mb-6 pb-6 border-b-2 border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-[#00A9E0]" />
                    💰 Valuation Completo {planKey === "bronze" ? "Básico" : planKey === "silver" ? "Avançado" : "Premium"}
                  </h4>
                  <ul className="space-y-3">
                    {planKey === "bronze" && (
                      <>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">
                            <strong>Estimativa com menor incerteza (~±15%)</strong>
                            {valuation && (
                              <span className="block text-xs text-gray-600 mt-1">
                                Exemplo: R$ {(valuation.valor_minimo * 1.08).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} - R$ {(valuation.valor_maximo * 0.92).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Relatório PDF 8 páginas</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Análise de risco básica</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">3 cenários de valor</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">1 revisão grátis em 90 dias</span>
                        </li>
                      </>
                    )}
                    {planKey === "silver" && (
                      <>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">
                            <strong>Estimativa com menor incerteza (~±10%)</strong>
                            {valuation && (
                              <span className="block text-xs text-gray-600 mt-1">
                                Exemplo: R$ {(valuation.valor_minimo * 1.05).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} - R$ {(valuation.valor_maximo * 0.95).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Relatório PDF 15-20 páginas</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">3 metodologias aplicadas</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Análise detalhada de riscos</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Plano de ação para valorização</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Dashboard interativo</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Revisões ilimitadas (plano ativo)</span>
                        </li>
                      </>
                    )}
                    {planKey === "gold" && (
                      <>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">
                            <strong>Estimativa com menor incerteza (~±5%)</strong>
                            {valuation && (
                              <span className="block text-xs text-gray-600 mt-1">
                                Exemplo: R$ {(valuation.valor_minimo * 1.025).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} - R$ {(valuation.valor_maximo * 0.975).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Relatório executivo 30+ páginas</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">5 metodologias + análise de intangíveis</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Due diligence preliminar</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Consultoria 1h ao vivo</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Certificado oficial</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">Suporte prioritário</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <ul className="space-y-4 mb-8">
                  {planServices[planKey]?.map((service) => (
                    <li key={service.id} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm leading-relaxed">{service.service_description}</span>
                    </li>
                  ))}
                </ul>

                {/* Disclaimer */}
                <p className="text-xs text-gray-500 mb-6 border-t border-gray-100 pt-4">
                  * Precisão estimada depende da qualidade dos dados informados e do setor. Valuation não constitui laudo oficial.
                </p>

                <button
                  onClick={() => handleSelectPlan(planKey)}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white hover:from-[#0098CC] hover:to-[#00A9E0]"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  <span>
                    {fromQuickValuation
                      ? planKey === "bronze"
                        ? "Desbloquear valuation completo"
                        : planKey === "silver"
                        ? "Desbloquear valuation avançado"
                        : "Desbloquear premium"
                      : `Contratar ${plan.name}`}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                {fromQuickValuation && planKey === "silver" && (
                  <p className="text-center text-sm text-[#00A9E0] font-semibold mt-2">
                    ⭐ Melhor custo-benefício para reduzir incerteza
                  </p>
                )}
              </div>
            </div>
            ))
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Comparação Detalhada dos Planos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Recurso</th>
                  <th className="text-center py-4 px-6 text-gray-700 font-semibold">Bronze</th>
                  <th className="text-center py-4 px-6 text-gray-700 font-semibold">Silver</th>
                  <th className="text-center py-4 px-6 text-gray-700 font-semibold">Gold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-4 px-6 text-gray-700">Anúncios mensais em jornais</td>
                  <td className="text-center py-4 px-6 text-gray-600">2</td>
                  <td className="text-center py-4 px-6 text-gray-600">4</td>
                  <td className="text-center py-4 px-6 text-gray-600">8</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-4 px-6 text-gray-700">Banner em sites parceiros</td>
                  <td className="text-center py-4 px-6 text-gray-400">—</td>
                  <td className="text-center py-4 px-6 text-gray-600">Compartilhado</td>
                  <td className="text-center py-4 px-6 text-gray-600">Exclusivo</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Apresentação da empresa</td>
                  <td className="text-center py-4 px-6 text-gray-600">Básica</td>
                  <td className="text-center py-4 px-6 text-gray-600">Detalhada</td>
                  <td className="text-center py-4 px-6 text-gray-600">Dossiê Exclusivo</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-4 px-6 text-gray-700">Acompanhamento no site</td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Assessoria jurídica e contábil</td>
                  <td className="text-center py-4 px-6 text-gray-600">Pareceres</td>
                  <td className="text-center py-4 px-6 text-gray-600">Assessoria</td>
                  <td className="text-center py-4 px-6 text-gray-600">Completa</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-4 px-6 text-gray-700">Busca de nome negativo</td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Levantamento de garantias</td>
                  <td className="text-center py-4 px-6 text-gray-400">—</td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-4 px-6 text-gray-700">Certidões negativas</td>
                  <td className="text-center py-4 px-6 text-gray-400">—</td>
                  <td className="text-center py-4 px-6 text-gray-400">—</td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Perguntas Frequentes</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-md text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-gray-600 text-sm">
                Todos os planos têm contratação mínima de 3 meses. Após esse período, você pode
                cancelar com 30 dias de antecedência.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Posso mudar de plano?</h3>
              <p className="text-gray-600 text-sm">
                Sim! Você pode fazer upgrade do seu plano a qualquer momento. O valor será ajustado
                proporcionalmente.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Como funciona o pagamento?</h3>
              <p className="text-gray-600 text-sm">
                Aceitamos cartão de crédito, débito em conta e boleto bancário. O pagamento é
                processado mensalmente de forma automática.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Qual plano é recomendado?</h3>
              <p className="text-gray-600 text-sm">
                O plano Silver é o mais popular e oferece excelente custo-benefício. Para negócios
                de maior valor, recomendamos o Gold.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
