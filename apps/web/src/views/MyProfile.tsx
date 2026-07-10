'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { useAuth } from '@/lib/auth-shim';
import {
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  Plus,
  Eye,
  Loader2,
  ArrowLeft,
  DollarSign,
  Globe,
  Lock,
  Pencil,
  Check,
  X,
} from 'lucide-react';

interface Business {
  id: string;
  alias_name: string;
  sector: string;
  status_workflow: string;
  is_public: number;
  created_at: string;
  ramo_atividade: string;
  segmento: string;
  faturamento_mensal: string;
  cidade: string;
  pais: string;
}

interface Profile {
  user_type: string;
  full_name: string;
  email: string;
}

export default function MyProfile() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const navigate = useNavigate();
  const { user, logout, refetch } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile
        const profileRes = await fetch('/api/profiles/me');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch businesses
        const businessRes = await fetch('/api/business/my-businesses');
        if (businessRes.ok) {
          const data = await businessRes.json();
          setBusinesses(data.businesses || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        await refetch();
        setEditingName(false);
      } else {
        alert('Erro ao salvar nome');
      }
    } catch (error) {
      console.error('Error saving name:', error);
      alert('Erro ao salvar nome');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const togglePublishStatus = async (businessId: string, currentStatus: number) => {
    setPublishingId(businessId);
    try {
      const response = await fetch(`/api/business/${businessId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: currentStatus === 1 ? 0 : 1 }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setBusinesses((prev) =>
          prev.map((b) => (b.id === businessId ? { ...b, is_public: data.is_public } : b))
        );
      } else {
        alert('Erro ao atualizar status de publicação');
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Erro ao atualizar status de publicação');
    } finally {
      setPublishingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      cadastro: { label: 'Cadastro', color: 'bg-blue-100 text-blue-800' },
      adesao: { label: 'Adesão', color: 'bg-yellow-100 text-yellow-800' },
      negociacao: { label: 'Negociação', color: 'bg-purple-100 text-purple-800' },
      fechado: { label: 'Fechado', color: 'bg-green-100 text-green-800' },
    };

    const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getUserTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      vendedor: 'Vendedor',
      comprador: 'Comprador',
      hibrido: 'Híbrido',
      admin: 'Administrador',
      basico: 'Básico',
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = dateStr.split('T')[0];
      const [year, month, day] = d.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

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

  const isVendedor =
    profile?.user_type === 'vendedor' ||
    profile?.user_type === 'hibrido' ||
    profile?.user_type === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center space-x-3">
              {user && (
                <span className="text-sm font-semibold text-foreground hidden sm:block">
                  {user.name || user.email}
                </span>
              )}
              <button
                onClick={() => void handleLogout()}
                className="px-4 py-2 text-sm font-semibold text-foreground hover:text-primary border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Info */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Name with edit functionality */}
              <div className="flex items-center gap-3 mb-2">
                {editingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="text-3xl font-bold text-foreground border-b-2 border-primary outline-none bg-transparent flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSaveName();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                    />
                    <button
                      onClick={() => void handleSaveName()}
                      disabled={savingName}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                    >
                      {savingName ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="p-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-foreground">
                      {user?.name || user?.email || '—'}
                    </h1>
                    <button
                      onClick={() => {
                        setNewName(user?.name || '');
                        setEditingName(true);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                      title="Editar nome"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{profile?.email || user?.email}</p>
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg font-semibold">
                {getUserTypeLabel(profile?.user_type || '')}
              </span>
            </div>
            {isVendedor && (
              <button
                onClick={() => navigate('/business-registration')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nova Empresa</span>
              </button>
            )}
          </div>
        </div>

        {/* Businesses Section */}
        {isVendedor && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Minhas Empresas</h2>
              <span className="text-muted-foreground">
                {businesses.length}{' '}
                {businesses.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
              </span>
            </div>

            {businesses.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl shadow-xl p-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhuma empresa cadastrada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Comece cadastrando sua primeira empresa para oferecer ao mercado
                </p>
                <button
                  onClick={() => navigate('/business-registration')}
                  className="px-8 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Cadastrar Empresa</span>
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="bg-card border border-border rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {business.alias_name || business.ramo_atividade}
                          </h3>
                          <p className="text-sm text-muted-foreground">{business.segmento}</p>
                        </div>
                        {getStatusBadge(business.status_workflow)}
                      </div>

                      <div className="space-y-3 mb-6">
                        {business.cidade && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2 text-muted-foreground/70" />
                            <span>
                              {business.cidade}, {business.pais || 'Brasil'}
                            </span>
                          </div>
                        )}

                        {business.faturamento_mensal && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="w-4 h-4 mr-2 text-muted-foreground/70" />
                            <span>{business.faturamento_mensal}</span>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground/70" />
                          <span>Cadastrado em {formatDate(business.created_at)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Publication Status Toggle */}
                        <button
                          onClick={() => togglePublishStatus(business.id, business.is_public)}
                          disabled={publishingId === business.id}
                          className={`w-full px-4 py-2 rounded-lg transition-all font-semibold text-sm flex items-center justify-center space-x-2 ${
                            business.is_public === 1
                              ? 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100'
                              : 'bg-secondary text-secondary-foreground border-2 border-border hover:bg-secondary/80'
                          } ${publishingId === business.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {publishingId === business.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Atualizando...</span>
                            </>
                          ) : business.is_public === 1 ? (
                            <>
                              <Globe className="w-4 h-4" />
                              <span>Publicada no Marketplace</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>Clique para Publicar</span>
                            </>
                          )}
                        </button>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => navigate(`/business/${business.id}`)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all font-semibold text-sm flex items-center justify-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Detalhes</span>
                          </button>
                          <button
                            onClick={() => navigate(`/valuation?business=${business.id}`)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold text-sm flex items-center justify-center"
                            title="Valuation IA"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* For Compradores - Show interested businesses placeholder */}
        {!isVendedor && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Empresas de Interesse</h3>
            <p className="text-gray-600 mb-6">
              Em breve você poderá visualizar as empresas que demonstrou interesse
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-8 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              Explorar Marketplace
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
