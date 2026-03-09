import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, ShoppingCart, Briefcase, Repeat, CheckCircle2 } from "lucide-react";

// Perfis disponíveis para seleção pública (Admin não aparece aqui)
const profileTypes = [
  {
    id: "basico",
    name: "Básico",
    icon: Eye,
    color: "from-gray-500 to-gray-600",
    description: "Acesso gratuito e limitado ao marketplace",
    features: [
      "Visualizar anúncios públicos",
      "Explorar o marketplace",
      "Sem custo mensal"
    ],
    isPremium: false
  },
  {
    id: "comprador",
    name: "Comprador",
    icon: ShoppingCart,
    color: "from-blue-500 to-blue-600",
    description: "Para quem busca adquirir empresas",
    features: [
      "Acesso completo aos anúncios",
      "Contato direto com vendedores",
      "Ferramentas de análise financeira",
      "Suporte prioritário"
    ],
    isPremium: true
  },
  {
    id: "vendedor",
    name: "Vendedor",
    icon: Briefcase,
    color: "from-green-500 to-green-600",
    description: "Para empresários que desejam vender seu negócio",
    features: [
      "Cadastro de empresas para venda",
      "Valuation com IA",
      "Upload de documentos seguros",
      "Gestão de propostas",
      "Dashboard de métricas"
    ],
    isPremium: true
  },
  {
    id: "hibrido",
    name: "Híbrido",
    icon: Repeat,
    color: "from-purple-500 to-pink-500",
    description: "Compre e venda empresas na mesma plataforma",
    features: [
      "Todos os benefícios de Comprador",
      "Todos os benefícios de Vendedor",
      "Gestão unificada",
      "Máxima flexibilidade"
    ],
    isPremium: true
  }
];

export default function ProfileSetup() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      // TESTE: Criar perfis diretamente sem pagamento
      // TODO: Quando em produção, descomentar código do Stripe abaixo
      const response = await fetch("/api/profiles/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_type: selectedType,
          subscription_level: selectedType === "basico" ? "none" : "active"
        })
      });

      if (response.ok) {
        navigate("/dashboard");
      } else {
        console.error("Failed to create profile");
        alert("Erro ao criar perfil. Tente novamente.");
      }

      /* CÓDIGO STRIPE - Descomentar para produção
      if (selectedType === "basico") {
        const response = await fetch("/api/profiles/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_type: selectedType,
            subscription_level: "none"
          })
        });

        if (response.ok) {
          navigate("/dashboard");
        } else {
          console.error("Failed to create profile");
        }
      } else {
        // For premium profiles, redirect to Stripe checkout
        const response = await fetch("/api/payments/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile_type: selectedType
          })
        });

        if (response.ok) {
          const data = await response.json();
          window.location.href = data.url;
        } else {
          console.error("Failed to create checkout session");
        }
      }
      */
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <img 
            src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png" 
            alt="Sobybs Logo" 
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Configure seu Perfil
          </h1>
          <p className="text-xl text-gray-600">
            Escolha o tipo de perfil que melhor se adequa às suas necessidades
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Escolha seu perfil</h3>
              <p className="text-sm text-gray-600">
                Todos os perfis incluem acesso a recursos premium da plataforma. 
                Você pode alternar entre perfis a qualquer momento.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Types Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {profileTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`relative bg-white rounded-2xl p-8 text-left transition-all border-2 ${
                  isSelected 
                    ? "border-[#00A9E0] shadow-xl scale-[1.02]" 
                    : "border-gray-200 shadow-lg hover:shadow-xl hover:border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-8 h-8 text-[#00A9E0]" />
                  </div>
                )}
                
                <div className={`w-16 h-16 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {type.name}
                </h3>
                
                {type.isPremium && (
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      R$ {type.id === "hibrido" ? "66" : "33"}/mês
                    </span>
                  </div>
                )}
                
                <p className="text-gray-600 mb-4">
                  {type.description}
                </p>
                
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-[#00A9E0] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={!selectedType || isSubmitting}
            className="px-12 py-4 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            {isSubmitting ? "Configurando..." : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
