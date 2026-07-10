"use client";

import { Link } from "@/lib/router-shim";
import { Lock, CheckCircle2, X } from "lucide-react";

interface PremiumModalProps {
  businessId?: string;
  valuationId?: number;
  onClose: () => void;
  feature?: string;
}

export default function PremiumModal({
  businessId,
  valuationId,
  onClose,
  feature = "relatório PDF completo",
}: PremiumModalProps) {
  const benefits = [
    "Relatório PDF 8 páginas",
    "Análise de riscos",
    "3 cenários de valor",
    "1 revisão grátis em 90 dias",
  ];

  const planUrl = `/planos?source=premium_modal${businessId ? `&businessId=${businessId}` : ""}${valuationId ? `&valuationId=${valuationId}` : ""}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-full">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Conteúdo Premium</h2>
        </div>

        <p className="text-gray-700 mb-6">
          O {feature} está disponível apenas no Valuation Profissional.
        </p>

        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Com o plano Bronze você tem:</h3>
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-2xl font-bold text-[#00A9E0]">
              Tudo por R$ 500/mês
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to={planUrl}
            className="w-full px-6 py-3 bg-[#00A9E0] text-white rounded-xl font-semibold hover:bg-[#0098CC] transition text-center"
          >
            Assinar Bronze - R$ 500/mês
          </Link>
          <Link
            to={planUrl}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition text-center"
          >
            Ver Todos os Planos
          </Link>
        </div>
      </div>
    </div>
  );
}
