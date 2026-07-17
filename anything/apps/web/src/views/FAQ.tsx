"use client";

import { HelpCircle, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router-shim';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  display_order: number;
  is_active: number;
}

export default function FAQPage() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const loadFaqs = async () => {
    try {
      setIsLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/faqs/all?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('FAQs loaded from API:', data.faqs);
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();

    // Reload FAQs when window gains focus (e.g., returning from admin panel)
    const handleFocus = () => {
      loadFaqs();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const toggleFaq = (id: number) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando perguntas frequentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center">
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs Logo"
                className="h-16 w-auto cursor-pointer"
                onClick={() => navigate("/")}
              />
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-foreground hover:text-primary font-medium transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-5xl font-bold mb-6 tracking-tight">
              Perguntas Frequentes
            </h1>
            <p className="text-xl max-w-3xl mx-auto opacity-90 leading-relaxed">
              Encontre respostas para as dúvidas mais comuns sobre a Sobybs
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Refresh Button and Debug Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-muted-foreground">
            Total de perguntas: {faqs.length} | Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
          <button
            onClick={loadFaqs}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
        {faqs.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 shadow-lg text-center">
            <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Nenhuma pergunta frequente disponível
            </h3>
            <p className="text-muted-foreground">
              Estamos preparando conteúdo para ajudá-lo. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-card rounded-xl shadow-md hover:shadow-lg transition-shadow border border-border overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-secondary transition-colors"
                >
                  <h3 className="text-lg font-bold text-foreground pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 flex-shrink-0 transition-transform ${
                      openFaqId === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqId === faq.id && (
                  <div className="px-6 pb-5 pt-2">
                    <div className="border-t border-border pt-4">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Still have questions section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-3">
            Ainda tem dúvidas?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Entre em contato com nossa equipe. Estamos aqui para ajudar!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/about"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Fale Conosco
            </a>
            <a
              href="/subscription-plans"
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white/20"
            >
              Ver Planos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
