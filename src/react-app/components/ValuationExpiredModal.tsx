import { Link } from "react-router-dom";
import { Clock, TrendingUp, X } from "lucide-react";

interface ValuationExpiredModalProps {
  businessId: string;
  businessName: string;
  valuationId: number;
  onClose: () => void;
  onMarkNotified: () => void;
}

export default function ValuationExpiredModal({
  businessId,
  businessName,
  valuationId,
  onClose,
  onMarkNotified,
}: ValuationExpiredModalProps) {
  const handleViewPlans = () => {
    onMarkNotified();
  };

  const handleNewEstimate = () => {
    onMarkNotified();
    window.location.href = `/valuation-rapido/${businessId}`;
  };

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
          <div className="p-3 bg-amber-100 rounded-full">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sua estimativa expirou!</h2>
        </div>

        <p className="text-gray-700 mb-6">
          O mercado muda rápido. Sua última estimativa de valuation da empresa{" "}
          <span className="font-semibold">{businessName}</span> foi há 7 dias.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Fazer nova estimativa grátis</h3>
              <p className="text-sm text-gray-600">
                Atualize sua estimativa com os dados mais recentes do mercado
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Contratar valuation sempre atualizado
              </h3>
              <p className="text-sm text-gray-600">
                Planos a partir de R$ 500/mês com revisões e análise completa
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleNewEstimate}
            className="flex-1 px-6 py-3 border border-[#00A9E0] text-[#00A9E0] rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            Nova Estimativa
          </button>
          <Link
            to={`/planos?source=valuation_expired&businessId=${businessId}&valuationId=${valuationId}`}
            onClick={handleViewPlans}
            className="flex-1 px-6 py-3 bg-[#00A9E0] text-white rounded-xl font-semibold hover:bg-[#0098CC] transition text-center flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Ver Planos
          </Link>
        </div>
      </div>
    </div>
  );
}
