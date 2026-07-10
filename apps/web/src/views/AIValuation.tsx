"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-shim";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import type { AIValuationResult } from "../shared/types";

export default function AIValuation() {
  const [isLoading, setIsLoading] = useState(false);
  const [valuation, setValuation] = useState<AIValuationResult | null>(null);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleGenerateValuation = async () => {
    setIsLoading(true);
    setError("");
    setValuation(null);

    try {
      const response = await fetch("/api/business/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao gerar valuation");
      }

      const data = await response.json();
      setValuation(data.valuation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar valuation");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate on mount
    handleGenerateValuation();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar ao Dashboard
          </button>
          
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Valuation com IA</h1>
          </div>
          <p className="text-lg text-gray-600">
            Estimativa de valor da sua empresa gerada por inteligência artificial
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Loader2 className="w-16 h-16 text-[#00A9E0] animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analisando sua empresa...</h2>
            <p className="text-gray-600">
              A IA está processando os dados e calculando o valuation. Isso pode levar alguns segundos.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-start space-x-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao gerar valuation</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleGenerateValuation}
                  className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {valuation && !isLoading && (
          <div className="space-y-6">
            {/* Main Value Card */}
            <div className="bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Valor Estimado</h2>
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <span className="text-sm font-semibold">Confiança: {valuation.confidence_level}</span>
                </div>
              </div>
              <div className="text-5xl font-bold mb-2">{valuation.estimated_value}</div>
              <p className="text-white/90 text-lg">Faixa: {valuation.valuation_range}</p>
            </div>

            {/* Methodology */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-[#00A9E0]" />
                Metodologia
              </h3>
              <p className="text-gray-700">{valuation.methodology}</p>
            </div>

            {/* Key Factors */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fatores Principais</h3>
              <div className="space-y-2">
                {valuation.key_factors.map((factor, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#00A9E0] rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700">{factor}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths and Risks Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
                  Pontos Fortes
                </h3>
                <div className="space-y-3">
                  {valuation.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-2 text-amber-500" />
                  Riscos e Considerações
                </h3>
                <div className="space-y-3">
                  {valuation.risks.map((risk, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h4 className="font-bold text-amber-900 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Aviso Importante
              </h4>
              <p className="text-amber-800 text-sm">
                Esta é uma estimativa automatizada gerada por IA com base nos dados fornecidos. O valor real da empresa pode 
                variar significativamente dependendo de fatores de mercado, análise financeira detalhada, due diligence e 
                negociações. Recomendamos uma avaliação profissional para transações comerciais.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGenerateValuation}
                className="px-6 py-3 bg-white border-2 border-[#00A9E0] text-[#00A9E0] rounded-xl hover:bg-[#00A9E0] hover:text-white transition-all font-semibold"
              >
                Gerar Novo Valuation
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
