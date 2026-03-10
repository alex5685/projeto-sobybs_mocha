import { useState } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, X } from "lucide-react";

interface ConversionBannerProps {
  businessId?: string;
  valuationId?: number;
}

export default function ConversionBanner({ businessId, valuationId }: ConversionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("conversion_banner_dismissed") === "true";
  });

  const handleDismiss = () => {
    localStorage.setItem("conversion_banner_dismissed", "true");
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  const planUrl = `/planos?source=valuation_quick_banner${businessId ? `&businessId=${businessId}` : ""}${valuationId ? `&valuationId=${valuationId}` : ""}`;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div className="flex-shrink-0 p-2 bg-[#00A9E0] rounded-lg">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Dica: Desbloqueie o Valuation Completo
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Relatório PDF, análise de riscos e recomendações personalizadas para sua empresa.
          </p>
          <Link
            to={planUrl}
            className="inline-flex items-center gap-2 text-[#00A9E0] font-semibold hover:text-[#0098CC] transition text-sm"
          >
            Desbloquear Valuation Completo
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
