'use client';

import { useState } from 'react';
import { Eye, ShoppingCart, Briefcase, Repeat, CheckCircle2 } from 'lucide-react';

// Perfis disponíveis para seleção pública (Admin não aparece aqui)
const profileTypes = [
  {
    id: 'basico',
    name: 'Básico',
    icon: Eye,
    color: 'from-gray-500 to-gray-600',
    description: 'Acesso gratuito e limitado ao marketplace',
    features: ['Visualizar anúncios públicos', 'Explorar o marketplace', 'Sem custo mensal'],
    isPremium: false,
  },
  {
    id: 'comprador',
    name: 'Comprador',
    icon: ShoppingCart,
    color: 'from-blue-500 to-blue-600',
    description: 'Para quem busca adquirir empresas',
    features: [
      'Acesso completo aos anúncios',
      'Contato direto com vendedores',
      'Ferramentas de análise financeira',
      'Suporte prioritário',
    ],
    isPremium: true,
  },
  {
    id: 'vendedor',
    name: 'Vendedor',
    icon: Briefcase,
    color: 'from-green-500 to-green-600',
    description: 'Para empresários que desejam vender seu negócio',
    features: [
      'Cadastro de empresas para venda',
      'Valuation com IA',
      'Upload de documentos seguros',
      'Gestão de propostas',
      'Dashboard de métricas',
    ],
    isPremium: true,
  },
  {
    id: 'hibrido',
    name: 'Híbrido',
    icon: Repeat,
    color: 'from-purple-500 to-pink-500',
    description: 'Compre e venda empresas na mesma plataforma',
    features: [
      'Todos os benefícios de Comprador',
      'Todos os benefícios de Vendedor',
      'Gestão unificada',
      'Máxima flexibilidade',
    ],
    isPremium: true,
  },
];

export default function ProfileSetup() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/profiles/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_type: selectedType,
          subscription_level: selectedType === 'basico' ? 'none' : 'active',
        }),
      });

      if (response.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = (await response.json()) as { error?: string };
        alert(data.error || 'Erro ao criar perfil. Tente novamente.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <img
            src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
            alt="Sobybs Logo"
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-foreground mb-3">Configure seu Perfil</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Escolha o tipo de perfil que melhor se adequa às suas necessidades
          </p>
          <a href="/dashboard" className="text-primary hover:text-primary/80 font-medium underline">
            ← Voltar ao Dashboard
          </a>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Como funciona?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong>Básico:</strong> Gratuito - apenas visualizar empresas à venda no
                  marketplace
                </li>
                <li>
                  <strong>Comprador:</strong> R$ 33/mês - acesso completo para encontrar e comprar
                  empresas
                </li>
                <li>
                  <strong>Vendedor:</strong> R$ 33/mês - ferramentas completas para vender sua
                  empresa (valuation, documentos, anúncios)
                </li>
                <li>
                  <strong>Híbrido:</strong> R$ 66/mês - compre E venda empresas com todos os
                  recursos
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-3 italic">
                Você pode alterar seu perfil a qualquer momento no Dashboard
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
                className={`relative bg-card rounded-2xl p-8 text-left transition-all border-2 ${
                  isSelected
                    ? 'border-primary shadow-xl scale-[1.02]'
                    : 'border-border shadow-lg hover:shadow-xl hover:border-border/60'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                )}

                <div
                  className={`w-16 h-16 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-2">{type.name}</h3>

                {type.isPremium && (
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      R$ {type.id === 'hibrido' ? '66' : '33'}/mês
                    </span>
                  </div>
                )}

                <p className="text-muted-foreground mb-4">{type.description}</p>

                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
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
            {isSubmitting ? 'Configurando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
