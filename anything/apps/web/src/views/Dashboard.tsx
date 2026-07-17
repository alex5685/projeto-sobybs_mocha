'use client';

import {
  LogOut,
  Building2,
  TrendingUp,
  FileText,
  Users,
  Loader2,
  Pencil,
  Eye,
  Plus,
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useEffect, useState } from 'react';
import ValuationExpiredModal from '../components/ValuationExpiredModal';
import SilverGoldUpgradeBanner from '../components/SilverGoldUpgradeBanner';

interface ExpiredValuation {
  id: number;
  business_id: string;
  business_name: string;
  created_at: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface Business {
  id: string;
  alias_name: string | null;
  sector: string | null;
  city: string | null;
  status_workflow: string;
  is_public: number;
  created_at: string;
}

export default function Dashboard() {
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { profile, isLoading } = useProfile();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [selectedExpiredValuation, setSelectedExpiredValuation] = useState<ExpiredValuation | null>(
    null
  );
  const [planType, setPlanType] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);

  const showUpgradeBanner = planType !== 'silver' && planType !== 'gold';

  // Verificar sessão UMA VEZ ao montar — sem loops
  useEffect(() => {
    fetch('/api/session', { credentials: 'include' })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { user: SessionUser };
          setAuthUser(data.user);
        } else {
          window.location.href = '/account/signin';
        }
      })
      .catch(() => {
        window.location.href = '/account/signin';
      })
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const checkExpiredValuations = async () => {
      try {
        const planResponse = await fetch('/api/subscriptions/active', { credentials: 'include' });
        if (planResponse.ok) {
          const planData = (await planResponse.json()) as { plan_type?: string };
          setPlanType(planData.plan_type || null);
        }

        const bizRes = await fetch('/api/business/my-businesses', { credentials: 'include' });
        if (bizRes.ok) {
          const bizData = (await bizRes.json()) as { businesses?: Business[] };
          const bizList = bizData.businesses ?? [];
          setMyBusinesses(bizList);
          if (bizList.length > 0) {
            setBusinessId(bizList[0].id);
          }
        }

        const response = await fetch('/api/valuations/quick/expired', { credentials: 'include' });
        if (response.ok) {
          const data = (await response.json()) as { expired_valuations?: ExpiredValuation[] };
          if (data.expired_valuations && data.expired_valuations.length > 0) {
            setSelectedExpiredValuation(data.expired_valuations[0]);
            setShowExpiredModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking plan/valuations:', error);
      }
    };
    void checkExpiredValuations();
  }, [authUser]);

  const handleMarkNotified = async () => {
    if (!selectedExpiredValuation) return;
    try {
      await fetch(`/api/valuations/${selectedExpiredValuation.id}/mark-notified`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error marking valuation as notified:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  };

  // Enquanto verifica sessão
  if (!authChecked || !authUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando perfil...</p>
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
            <div className="flex items-center space-x-3">
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs Logo"
                className="h-14 w-auto"
              />
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="/dashboard"
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/my-profile"
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                Meu Perfil
              </a>
              <a
                href="/about"
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                Sobre
              </a>
              <a
                href="/subscription-plans"
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                Planos
              </a>
              <a
                href="/faq"
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                FAQ
              </a>
              {profile?.user_type === 'admin' && (
                <a
                  href="/admin"
                  className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                >
                  Admin
                </a>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {authUser.image && (
                  <img
                    src={authUser.image}
                    alt={authUser.name || authUser.email}
                    className="w-10 h-10 rounded-full border-2 border-[#00A9E0]"
                  />
                )}
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {authUser.name || authUser.email}
                  </div>
                  <div className="text-xs text-muted-foreground">{authUser.email}</div>
                </div>
              </div>
              <button
                onClick={() => void handleLogout()}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showUpgradeBanner && (
          <SilverGoldUpgradeBanner businessId={businessId ?? undefined} planType={planType} />
        )}

        {showExpiredModal && selectedExpiredValuation && (
          <ValuationExpiredModal
            businessId={selectedExpiredValuation.business_id}
            businessName={selectedExpiredValuation.business_name}
            valuationId={selectedExpiredValuation.id}
            onClose={() => setShowExpiredModal(false)}
            onMarkNotified={handleMarkNotified}
          />
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Bem-vindo ao Sobybs</h1>
          <p className="text-xl text-muted-foreground">
            {profile && (
              <span className="inline-block px-3 py-1 bg-[#00A9E0] text-white rounded-full text-sm font-semibold mr-2">
                {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
              </span>
            )}
            Gerencie seu portfólio e oportunidades
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <a
            href="/business-registration"
            className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-border cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-[#1CB5E0] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Cadastrar Empresa</h3>
            <p className="text-sm text-muted-foreground">Adicione sua empresa ao marketplace</p>
          </a>

          <a
            href="/valuation"
            className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-border cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Valuation IA</h3>
            <p className="text-sm text-muted-foreground">Estime o valor da sua empresa</p>
          </a>

          <a
            href="/documents"
            className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-border cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-muted rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Documentos</h3>
            <p className="text-sm text-muted-foreground">Gerencie seus documentos</p>
          </a>

          <a
            href="/marketplace"
            className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-border cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Marketplace</h3>
            <p className="text-sm text-muted-foreground">Explore oportunidades</p>
          </a>
        </div>

        {/* Minhas Empresas */}
        {myBusinesses.length > 0 && (
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Minhas Empresas</h2>
              <a
                href="/business-registration"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl font-semibold hover:from-[#0098CC] hover:to-[#00A9E0] transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Nova Empresa
              </a>
            </div>
            <div className="space-y-3">
              {myBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-[#1CB5E0]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {biz.alias_name ?? 'Empresa sem nome'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        {biz.sector && (
                          <span className="text-xs text-muted-foreground">{biz.sector}</span>
                        )}
                        {biz.city && (
                          <span className="text-xs text-muted-foreground">· {biz.city}</span>
                        )}
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${biz.is_public === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {biz.is_public === 1 ? 'Pública' : 'Privada'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a
                      href={`/business/${biz.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </a>
                    <a
                      href={`/business-registration?businessId=${biz.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#00A9E0] text-white rounded-lg text-sm font-medium hover:bg-[#0098CC] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Setup Section */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Complete seu Perfil</h2>
          <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
            <p className="text-foreground mb-4">
              Para começar a usar a plataforma, você precisa selecionar seu tipo de perfil:
            </p>
            <ul className="space-y-2 mb-6 text-muted-foreground">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>
                  <strong>Básico:</strong> Acesso limitado ao marketplace
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>
                  <strong>Comprador:</strong> Explore e avalie empresas disponíveis
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>
                  <strong>Vendedor:</strong> Liste sua empresa para venda
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>
                  <strong>Híbrido:</strong> Compre e venda empresas
                </span>
              </li>
            </ul>
            <a
              href="/profile-setup"
              className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold inline-block"
            >
              Configurar Perfil
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
