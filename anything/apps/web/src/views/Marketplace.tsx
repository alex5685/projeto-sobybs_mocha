'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { useAuth } from '@/lib/auth-shim';
import { useProfile } from '../hooks/useProfile';
import {
  Building2,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Search,
  Filter,
  ArrowLeft,
  Loader2,
  Store,
  Briefcase,
  Home as HomeIcon,
  Lock,
} from 'lucide-react';

interface Business {
  id: string;
  alias_name: string;
  sector: string;
  status_workflow: string;
  created_at: string;
  ramo_atividade: string;
  segmento: string;
  tempo_atuacao: string;
  faturamento_mensal: string;
  num_funcionarios: string;
  cidade: string;
  estado: string;
  pais: string;
  possui_imoveis: number;
  possui_frota: number;
}

const SEGMENTOS = ['Todos', 'Serviços', 'Indústria', 'Comércio', 'Tecnologia'];

export default function Marketplace() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('Todos');
  const [selectedCity, setSelectedCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  // Basic users cannot access business details or see faturamento
  const isBasic = !profile || profile.user_type === 'basico';

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/business/marketplace');
      if (response.ok) {
        const data = (await response.json()) as { businesses: Business[] };
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBusinesses();
  }, [fetchBusinesses]);

  const filterBusinesses = useCallback(() => {
    let filtered = [...businesses];

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.alias_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.ramo_atividade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.segmento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSegment !== 'Todos') {
      filtered = filtered.filter((b) => b.segmento === selectedSegment);
    }

    if (selectedCity) {
      filtered = filtered.filter((b) =>
        b.cidade?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    setFilteredBusinesses(filtered);
  }, [businesses, searchTerm, selectedSegment, selectedCity]);

  useEffect(() => {
    filterBusinesses();
  }, [filterBusinesses]);

  const getAvailableCities = () => {
    return businesses
      .map((b) => b.cidade)
      .filter(Boolean)
      .filter((city, index, self) => self.indexOf(city) === index)
      .sort();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar ao Dashboard
              </button>
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">Marketplace</h1>
                <p className="text-sm text-muted-foreground">
                  Encontre a empresa perfeita para você
                </p>
              </div>
            </div>
            {user && (
              <div className="hidden sm:flex items-center space-x-2 text-sm font-semibold text-foreground">
                <span>{user.given_name || user.name || user.email}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, ramo, segmento ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Segmento</label>
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  {SEGMENTOS.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Cidade</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option value="">Todas as cidades</option>
                  {getAvailableCities().map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredBusinesses.length === 0
              ? 'Nenhuma empresa encontrada'
              : `${filteredBusinesses.length} ${
                  filteredBusinesses.length === 1 ? 'empresa encontrada' : 'empresas encontradas'
                }`}
          </p>
        </div>

        {/* Business Cards Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-xl p-12 text-center">
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {businesses.length === 0
                ? 'Nenhuma empresa disponível no momento'
                : 'Nenhuma empresa encontrada com os filtros selecionados'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {businesses.length === 0
                ? 'Volte em breve para ver as oportunidades disponíveis'
                : 'Tente ajustar os filtros ou fazer uma nova busca'}
            </p>
            {(searchTerm || selectedSegment !== 'Todos' || selectedCity) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSegment('Todos');
                  setSelectedCity('');
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <div
                key={business.id}
                className={`bg-card rounded-xl shadow-lg transition-all overflow-hidden border border-border group ${
                  isBasic ? 'cursor-default' : 'hover:shadow-2xl cursor-pointer'
                }`}
                onClick={isBasic ? undefined : () => navigate(`/business/${business.id}`)}
              >
                {/* Card Header */}
                <div className="h-32 bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] relative overflow-hidden">
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center space-x-2 text-white">
                      {business.segmento === 'Serviços' && <Briefcase className="w-5 h-5" />}
                      {business.segmento === 'Comércio' && <Store className="w-5 h-5" />}
                      {business.segmento === 'Indústria' && <Building2 className="w-5 h-5" />}
                      {business.segmento === 'Tecnologia' && <TrendingUp className="w-5 h-5" />}
                      {!['Serviços', 'Comércio', 'Indústria', 'Tecnologia'].includes(
                        business.segmento
                      ) && <Building2 className="w-5 h-5" />}
                      <span className="text-sm font-semibold">{business.segmento}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {`Empresa da área de ${business.segmento || business.ramo_atividade || 'N/D'}, ${[business.cidade, business.estado].filter(Boolean).join('/') || 'Local não informado'}`}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{business.ramo_atividade}</p>

                  <div className="space-y-3 mb-6">
                    {business.cidade && (
                      <div className="flex items-center text-sm text-foreground">
                        <MapPin className="w-4 h-4 mr-2 text-primary" />
                        <span>
                          {business.cidade}
                          {business.estado ? `/${business.estado}` : ''},{' '}
                          {business.pais || 'Brasil'}
                        </span>
                      </div>
                    )}

                    {/* Faturamento Mensal — visível apenas para não-básicos */}
                    {!isBasic && business.faturamento_mensal && (
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                        <span className="text-muted-foreground mr-1">Faturamento Mensal:</span>
                        <span className="font-semibold">{business.faturamento_mensal}</span>
                      </div>
                    )}

                    {business.num_funcionarios && (
                      <div className="flex items-center text-sm text-foreground">
                        <Users className="w-4 h-4 mr-2 text-purple-600" />
                        <span>{business.num_funcionarios} funcionários</span>
                      </div>
                    )}

                    {business.tempo_atuacao && (
                      <div className="flex items-center text-sm text-foreground">
                        <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                        <span>{business.tempo_atuacao}</span>
                      </div>
                    )}
                  </div>

                  {/* Assets Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {business.possui_imoveis === 1 && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                        <HomeIcon className="w-3 h-3" />
                        <span>Imóveis</span>
                      </span>
                    )}
                    {business.possui_frota === 1 && (
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                        <Building2 className="w-3 h-3" />
                        <span>Frota</span>
                      </span>
                    )}
                  </div>

                  {/* Ver Detalhes — bloqueado para básicos */}
                  {isBasic ? (
                    <div className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed select-none border border-gray-200">
                      <Lock className="w-4 h-4" />
                      <span>Disponível para assinantes</span>
                    </div>
                  ) : (
                    <button
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all font-semibold shadow-lg hover:shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/business/${business.id}`);
                      }}
                    >
                      Ver Detalhes
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
