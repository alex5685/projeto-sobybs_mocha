"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-shim";
import { useAuth } from "@/lib/auth-shim";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        
        // Check if user has a profile
        const profileResponse = await fetch("/api/profiles/me");
        const profileData = await profileResponse.json();
        
        if (profileData) {
          navigate("/dashboard");
        } else {
          navigate("/profile-setup");
        }
      } catch (err) {
        console.error("Failed to exchange code for session token:", err);
        setError("Falha ao fazer login. Por favor, tente novamente.");
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Autenticar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold"
          >
            Voltar à Página Inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 text-[#00A9E0] animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Autenticando...</h2>
        <p className="text-gray-600">Estamos processando seu login. Aguarde um momento.</p>
      </div>
    </div>
  );
}
