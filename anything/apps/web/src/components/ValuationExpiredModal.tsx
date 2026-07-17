"use client";

import { Link } from "@/lib/router-shim";
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
      <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full p-8 relative border border-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/20 rounded-full">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Sua estimativa expirou!</h2>
        </div>

        <p className="text-muted-foreground mb-6">
          O mercado muda rápido. Sua última estimativa de valuation da empresa{" "}
          <span className="font-semibold text-foreground">{businessName}</span> foi há 7 dias.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Fazer nova estimativa grátis</h3>
              <p className="text-sm text-muted-foreground">
                Atualize sua estimativa com os dados mais recentes do mercado
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Contratar valuation sempre atualizado
              </h3>
              <p className="text-sm text-muted-foreground">
                Planos a partir de R$ 500/mês com revisões e análise completa
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleNewEstimate}
            className="flex-1 px-6 py-3 border border-border text-foreground rounded-xl font-semibold hover:bg-secondary transition"
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
