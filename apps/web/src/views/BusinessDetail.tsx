'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@/lib/router-shim';
import { useAuth } from '@/lib/auth-shim';
import { useProfile } from '../hooks/useProfile';
import {
  Building2,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Home as HomeIcon,
  Truck,
  Calendar,
  FileText,
  AlertCircle,
  ImageIcon,
  Pencil,
  Zap,
  BarChart3,
  Lock,
  Crown,
  Clock,
  X,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';

interface Business {
  id: string;
  owner_id: string;
  alias_name: string;
  sector: string;
  status_workflow: string;
  is_public: number;
  created_at: string;
  ramo_atividade: string;
  segmento: string;
  tempo_atuacao: string;
  faturamento_mensal: string;
  despesas_fixas: string;
  num_funcionarios: string;
  possui_imoveis: number;
  qtd_imoveis: string;
  valor_imoveis: string;
  possui_frota: number;
  tipo_frota: string;
  qtd_veiculos: string;
  valor_frota: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  utiliza_midia: number;
  tipos_midia: string;
  divida_impostos: number;
  valor_divida_impostos: string;
  divida_particular: number;
  valor_divida_particular: string;
  valuation_vendedor: string;
  motivacao_venda: string;
}

interface BusinessImage {
  id: string;
  storage_key: string;
  file_name: string;
  file_url: string;
  is_primary: number;
  display_order: number;
}

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [business, setBusiness] = useState<Business | null>(null);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  // Interest flow for non-owners
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestValuation, setInterestValuation] = useState<{
    valor_minimo: number;
    valor_maximo: number;
  } | null>(null);

  // Visit scheduling state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitMessage, setVisitMessage] = useState('');
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [visitRequest, setVisitRequest] = useState<{
    id: string;
    status: string;
    preferred_date: string;
    preferred_time?: string;
    address_released: number;
  } | null>(null);
  const [visitAddress, setVisitAddress] = useState<{
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
  } | null>(null);
  const [ownerVisitCount, setOwnerVisitCount] = useState(0);
  const [minVisitDate, setMinVisitDate] = useState('');

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMinVisitDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const fetchBusiness = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [businessRes, imagesRes, subRes] = await Promise.all([
        fetch(`/api/business/${id}`),
        fetch(`/api/business/${id}/images`),
        fetch('/api/subscriptions/active', { credentials: 'include' }),
      ]);

      if (businessRes.ok) {
        const data = (await businessRes.json()) as { business: Business };
        setBusiness(data.business);
      } else if (businessRes.status === 404) {
        setError('Empresa não encontrada');
      } else if (businessRes.status === 403) {
        setError('Você não tem permissão para visualizar esta empresa');
      } else {
        const errorData = (await businessRes.json().catch(() => ({}))) as { error?: string };
        setError(errorData.error || 'Erro ao carregar informações da empresa');
      }

      if (imagesRes.ok) {
        const data = (await imagesRes.json()) as { images: BusinessImage[] };
        setImages(data.images);
      }

      if (subRes.ok) {
        const sd = (await subRes.json()) as { has_active_plan?: boolean; plan_type?: string };
        setHasActivePlan(sd.has_active_plan ?? false);
        setPlanType(sd.plan_type ?? null);
      }
    } catch (error) {
      console.error('Error fetching business:', error);
      setError('Erro ao carregar informações da empresa');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchBusiness();
  }, [fetchBusiness]);

  const isOwner = !!(
    user &&
    business &&
    (business.owner_id === user.id || profile?.user_type === 'admin')
  );
  const canManageImages = isOwner;
  const isSilverOrGold = hasActivePlan && (planType === 'silver' || planType === 'gold');
  // Bronze+ can see valuation value after expressing interest
  const hasPaidPlan = hasActivePlan && planType !== null;

  const handleExpressInterest = async () => {
    if (!hasPaidPlan) {
      navigate(`/planos?source=interesse_empresa&businessId=${id}`);
      return;
    }
    setInterestLoading(true);
    setHasExpressedInterest(true);
    try {
      const res = await fetch(`/api/business/${id}/quick-valuation`, { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as {
          valuation: { valor_minimo: number; valor_maximo: number };
        };
        setInterestValuation({
          valor_minimo: data.valuation.valor_minimo,
          valor_maximo: data.valuation.valor_maximo,
        });
      }
    } catch (err) {
      console.error('Error fetching interest valuation:', err);
    } finally {
      setInterestLoading(false);
    }
  };

  // Load buyer's existing visit request for this business (if any)
  useEffect(() => {
    if (!user || !business) return;

    const loadVisitData = async () => {
      try {
        const res = await fetch(`/api/business/${business.id}/visit-requests`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          visit_requests: Array<{
            id: string;
            status: string;
            preferred_date: string;
            preferred_time?: string;
            address_released: number;
          }>;
        };

        if (isOwner) {
          const pending = data.visit_requests.filter((r) => r.status === 'pending').length;
          setOwnerVisitCount(pending);
        } else {
          const mine = data.visit_requests[0];
          if (mine) {
            setVisitRequest(mine);
            // If already confirmed, fetch the address
            if (mine.address_released === 1 || mine.status === 'confirmed') {
              const addrRes = await fetch(`/api/visit-requests/${mine.id}`, {
                credentials: 'include',
              });
              if (addrRes.ok) {
                const addrData = (await addrRes.json()) as {
                  full_address?: Record<string, string> | null;
                };
                if (addrData.full_address) {
                  setVisitAddress(
                    addrData.full_address as {
                      cep?: string;
                      rua?: string;
                      numero?: string;
                      complemento?: string;
                      bairro?: string;
                      cidade?: string;
                      estado?: string;
                      pais?: string;
                    }
                  );
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading visit data:', err);
      }
    };
    void loadVisitData();
  }, [user, business, isOwner]);

  const handleScheduleVisit = async () => {
    if (!visitDate || !business) return;
    setVisitSubmitting(true);
    try {
      const res = await fetch(`/api/business/${business.id}/visit-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_date: visitDate,
          preferred_time: visitTime || undefined,
          message: visitMessage || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        alert(err.error || 'Erro ao agendar visita');
        return;
      }
      const data = (await res.json()) as {
        visit_request: {
          id: string;
          status: string;
          preferred_date: string;
          preferred_time?: string;
          address_released: number;
        };
      };
      setVisitRequest(data.visit_request);
      setShowVisitModal(false);
    } catch (err) {
      console.error('Error scheduling visit:', err);
      alert('Erro ao enviar solicitação de visita');
    } finally {
      setVisitSubmitting(false);
    }
  };

  const handleCancelVisit = async () => {
    if (!visitRequest) return;
    if (!confirm('Deseja cancelar sua solicitação de visita?')) return;
    try {
      const res = await fetch(`/api/visit-requests/${visitRequest.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        setVisitRequest(null);
        setVisitAddress(null);
      }
    } catch (err) {
      console.error('Error cancelling visit:', err);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  /** Safely format a YYYY-MM-DD date string to DD/MM/YYYY without new Date() */
  const formatDateBR = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const getImageUrl = (image: BusinessImage) => {
    if (image.file_url) return image.file_url;
    if (image.storage_key) return `https://ucarecdn.com/${image.storage_key}/`;
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{error || 'Erro'}</h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold"
          >
            Voltar ao Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
            {/* Quick edit button in header for owner */}
            {isOwner && (
              <button
                onClick={() => navigate('/business-registration')}
                className="flex items-center gap-2 px-4 py-2 bg-[#00A9E0] text-white rounded-xl hover:bg-[#0098CC] transition-colors font-semibold text-sm"
              >
                <Pencil className="w-4 h-4" />
                Editar Cadastro
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {business!.alias_name || business!.ramo_atividade}
              </h1>
              <p className="text-xl opacity-90">{business!.ramo_atividade}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="px-4 py-2 bg-white bg-opacity-20 rounded-lg font-semibold">
                  {business!.segmento}
                </span>
                {business!.cidade && (
                  <span className="flex items-center gap-1 px-3 py-2 bg-white bg-opacity-20 rounded-lg text-sm font-medium">
                    <MapPin className="w-4 h-4" />
                    {business!.cidade}
                    {business!.estado ? `/${business!.estado}` : ''}
                  </span>
                )}
              </div>
            </div>
            <Building2 className="w-16 h-16 opacity-50 hidden sm:block" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Images Section */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Fotos da Empresa</h2>
                  {canManageImages && (
                    <button
                      onClick={() => navigate(`/business/${id}/images`)}
                      className="px-4 py-2 bg-[#00A9E0] text-white rounded-lg hover:bg-[#0098CC] transition-colors font-semibold flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Gerenciar Imagens
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {images.slice(0, 6).map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={getImageUrl(image)}
                        alt={image.file_name}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImagem não encontrada%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      {image.is_primary === 1 && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-gray-900 rounded text-xs font-semibold">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {images.length > 6 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => navigate(`/business/${id}/images`)}
                      className="text-[#00A9E0] hover:underline font-semibold"
                    >
                      Ver todas as {images.length} imagens
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add Images CTA for owners/admins with no images */}
            {canManageImages && images.length === 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-8 border-2 border-dashed border-blue-200">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Adicione fotos da empresa
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Empresas com fotos atraem mais interesse de compradores
                  </p>
                  <button
                    onClick={() => navigate(`/business/${id}/images`)}
                    className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold inline-flex items-center gap-2"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Gerenciar Imagens
                  </button>
                </div>
              </div>
            )}

            {/* Informações Básicas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações Básicas</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {business!.tempo_atuacao && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-[#00A9E0] mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Tempo de Atuação</p>
                      <p className="font-semibold text-gray-900">{business!.tempo_atuacao}</p>
                    </div>
                  </div>
                )}
                {business!.faturamento_mensal && (
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Faturamento Mensal</p>
                      <p className="font-semibold text-gray-900">{business!.faturamento_mensal}</p>
                    </div>
                  </div>
                )}
                {business!.despesas_fixas && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Despesas Fixas</p>
                      <p className="font-semibold text-gray-900">{business!.despesas_fixas}</p>
                    </div>
                  </div>
                )}
                {business!.num_funcionarios && (
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Funcionários</p>
                      <p className="font-semibold text-gray-900">{business!.num_funcionarios}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ativos */}
            {(business!.possui_imoveis === 1 || business!.possui_frota === 1) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Ativos</h2>
                <div className="space-y-4">
                  {business!.possui_imoveis === 1 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <HomeIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Imóveis</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {business!.qtd_imoveis && (
                          <div>
                            <p className="text-gray-600">Quantidade</p>
                            <p className="font-semibold">{business!.qtd_imoveis}</p>
                          </div>
                        )}
                        {business!.valor_imoveis && (
                          <div>
                            <p className="text-gray-600">Valor Estimado</p>
                            <p className="font-semibold">{business!.valor_imoveis}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {business!.possui_frota === 1 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Truck className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Frota de Veículos</h3>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        {business!.tipo_frota && (
                          <div>
                            <p className="text-gray-600">Tipo</p>
                            <p className="font-semibold">{business!.tipo_frota}</p>
                          </div>
                        )}
                        {business!.qtd_veiculos && (
                          <div>
                            <p className="text-gray-600">Quantidade</p>
                            <p className="font-semibold">{business!.qtd_veiculos}</p>
                          </div>
                        )}
                        {business!.valor_frota && (
                          <div>
                            <p className="text-gray-600">Valor Estimado</p>
                            <p className="font-semibold">{business!.valor_frota}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Localização */}
            {(business!.rua || business!.bairro || business!.cidade) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-[#00A9E0]" />
                  Localização
                </h2>
                <div className="space-y-2 text-gray-700">
                  {isOwner ? (
                    <>
                      {business!.rua && (
                        <p>
                          {business!.rua}
                          {business!.numero && `, ${business!.numero}`}
                          {business!.complemento && ` - ${business!.complemento}`}
                        </p>
                      )}
                      {business!.bairro && <p>{business!.bairro}</p>}
                      {business!.cidade && (
                        <p className="font-semibold">
                          {business!.cidade}
                          {business!.estado ? `/${business!.estado}` : ''},{' '}
                          {business!.pais || 'Brasil'}
                        </p>
                      )}
                      {business!.cep && (
                        <p className="text-sm text-gray-600">CEP: {business!.cep}</p>
                      )}
                    </>
                  ) : (
                    <>
                      {business!.cidade && (
                        <p className="font-semibold text-lg">
                          {business!.cidade}
                          {business!.estado ? `/${business!.estado}` : ''},{' '}
                          {business!.pais || 'Brasil'}
                        </p>
                      )}
                      <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <Lock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-700">
                          O endereço completo será disponibilizado ao comprador interessado no
                          momento de agendamento de visita ao estabelecimento.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Marketing */}
            {business!.utiliza_midia === 1 && business!.tipos_midia && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-[#00A9E0]" />
                  Marketing & Divulgação
                </h2>
                <div className="flex flex-wrap gap-2">
                  {business!.tipos_midia.split(',').map((tipo, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-semibold rounded-full"
                    >
                      {tipo.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Parecer do Vendedor */}
            {(business!.valuation_vendedor || business!.motivacao_venda) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Parecer do Vendedor</h2>
                <div className="space-y-4">
                  {business!.valuation_vendedor && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Avaliação do Negócio</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {business!.valuation_vendedor}
                      </p>
                    </div>
                  )}
                  {business!.motivacao_venda && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Motivação para Venda</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {business!.motivacao_venda}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* ── Owner Actions Panel ── */}
            {isOwner && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#00A9E0]/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#00A9E0]" />
                  Gerenciar Empresa
                </h3>

                {/* Edit & Images */}
                <div className="space-y-3 mb-5">
                  <button
                    onClick={() => navigate('/business-registration')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[#00A9E0] text-white rounded-xl hover:bg-[#0098CC] transition-colors font-semibold"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar Cadastro
                  </button>
                  <button
                    onClick={() => navigate(`/business/${id}/images`)}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-[#00A9E0] text-[#00A9E0] rounded-xl hover:bg-blue-50 transition-colors font-semibold"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Gerenciar Fotos
                  </button>
                  <button
                    onClick={() => navigate(`/business/${id}/visitas`)}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors font-semibold relative"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Visitas Agendadas
                    {ownerVisitCount > 0 && (
                      <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {ownerVisitCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Valuation Phases */}
                <div className="border-t border-gray-100 pt-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Fases de Valuation
                  </p>
                  <div className="space-y-3">
                    {/* Fase 1 — Gratuito */}
                    <button
                      onClick={() => navigate(`/valuation-rapido/${id}`)}
                      className="w-full flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-600 transition-colors">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Fase 1 — Valuation Rápido</p>
                        <p className="text-xs text-gray-500 mt-0.5">Estimativa gratuita por IA</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                          Gratuito
                        </span>
                      </div>
                    </button>

                    {/* Fase 2 — Silver/Gold */}
                    {isSilverOrGold ? (
                      <button
                        onClick={() => navigate(`/empresa/${id}/valuation-completo`)}
                        className="w-full flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            Fase 2 — Valuation Completo
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Análise profunda com múltiplas metodologias
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase">
                            {planType}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="w-full flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl opacity-80">
                        <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Lock className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-700 text-sm">
                            Fase 2 — Valuation Completo
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Análise profunda com múltiplas metodologias
                          </p>
                          <button
                            onClick={() =>
                              navigate(`/planos?source=valuation_fase2&businessId=${id}`)
                            }
                            className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white text-xs font-bold rounded-full hover:from-[#0098CC] hover:to-[#00A9E0] transition-all"
                          >
                            <Crown className="w-3 h-3" />
                            Contratar Silver / Gold
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Card — visible to non-owners */}
            {!isOwner && (
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                {!hasExpressedInterest ? (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Interessado nesta empresa?
                    </h3>
                    <p className="text-sm text-gray-600 mb-5">
                      Clique abaixo para revelar a faixa de valor estimada e entrar em contato com o
                      vendedor.
                    </p>
                    <button
                      onClick={() => void handleExpressInterest()}
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Tenho Interesse
                    </button>
                    {!hasPaidPlan && (
                      <p className="text-xs text-gray-400 mt-3 text-center">
                        Requer plano Bronze, Silver ou Gold para ver o valor
                      </p>
                    )}
                  </>
                ) : interestLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 text-[#00A9E0] animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Buscando valor estimado...</p>
                  </div>
                ) : interestValuation ? (
                  <>
                    <div className="text-center mb-5 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                        Valor Estimado pela IA
                      </p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatCurrency(interestValuation.valor_minimo)}
                      </p>
                      <p className="text-sm text-gray-500 my-1">até</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatCurrency(interestValuation.valor_maximo)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Estimativa baseada em dados do mercado e múltiplos do setor
                      </p>
                    </div>

                    {/* Visit Request Status / CTA */}
                    {visitRequest && visitRequest.status !== 'cancelled' ? (
                      <div className="mb-4">
                        {visitRequest.status === 'pending' && (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              <p className="font-semibold text-yellow-800 text-sm">
                                Visita Pendente
                              </p>
                            </div>
                            <p className="text-xs text-yellow-700">
                              Sua solicitação foi enviada para{' '}
                              {formatDateBR(visitRequest.preferred_date)}
                              {visitRequest.preferred_time
                                ? ` às ${visitRequest.preferred_time}`
                                : ''}
                              . Aguardando confirmação do vendedor.
                            </p>
                            <button
                              onClick={() => void handleCancelVisit()}
                              className="mt-2 text-xs text-red-600 hover:underline"
                            >
                              Cancelar solicitação
                            </button>
                          </div>
                        )}
                        {visitRequest.status === 'confirmed' && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <p className="font-semibold text-green-800 text-sm">
                                Visita Confirmada!
                              </p>
                            </div>
                            <p className="text-xs text-green-700 mb-2">
                              {formatDateBR(visitRequest.preferred_date)}
                              {visitRequest.preferred_time
                                ? ` às ${visitRequest.preferred_time}`
                                : ''}
                            </p>
                            {visitAddress && (
                              <div className="mt-2 p-3 bg-white rounded-lg border border-green-200 text-sm">
                                <p className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-green-600" /> Endereço
                                  Completo
                                </p>
                                {visitAddress.rua && (
                                  <p className="text-gray-700">
                                    {visitAddress.rua}
                                    {visitAddress.numero ? `, ${visitAddress.numero}` : ''}
                                    {visitAddress.complemento
                                      ? ` - ${visitAddress.complemento}`
                                      : ''}
                                  </p>
                                )}
                                {visitAddress.bairro && (
                                  <p className="text-gray-700">{visitAddress.bairro}</p>
                                )}
                                {visitAddress.cidade && (
                                  <p className="text-gray-700 font-medium">
                                    {visitAddress.cidade}
                                    {visitAddress.estado ? `/${visitAddress.estado}` : ''},{' '}
                                    {visitAddress.pais || 'Brasil'}
                                  </p>
                                )}
                                {visitAddress.cep && (
                                  <p className="text-gray-500 text-xs">CEP: {visitAddress.cep}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {visitRequest.status === 'rejected' && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-3">
                            <p className="font-semibold text-red-800 text-sm">
                              Visita não disponível
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              O vendedor não pôde confirmar a visita nesta data.
                            </p>
                            <button
                              onClick={() => {
                                setVisitRequest(null);
                                setShowVisitModal(true);
                              }}
                              className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                            >
                              Tentar outra data
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4">
                        <button
                          onClick={() => setShowVisitModal(true)}
                          className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg font-semibold flex items-center justify-center gap-2"
                        >
                          <CalendarCheck className="w-5 h-5" />
                          Agendar Visita
                        </button>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          O endereço completo é liberado após confirmação do vendedor
                        </p>
                      </div>
                    )}

                    <h3 className="text-base font-bold text-gray-900 mb-2">Quer saber mais?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Entre em contato com o vendedor para mais informações sobre esta oportunidade.
                    </p>
                    <button className="w-full px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold">
                      Entrar em Contato
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-5 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <Crown className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-900 mb-1">
                        Valor disponível para assinantes
                      </p>
                      <p className="text-xs text-gray-600">
                        Contrate um plano Bronze, Silver ou Gold para ver a faixa de valor estimado.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/planos?source=interesse_empresa&businessId=${id}`)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg font-semibold flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Ver Planos
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate('/marketplace')}
                  className="w-full mt-3 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Voltar ao Marketplace
                </button>
              </div>
            )}

            {/* Back to dashboard for owner */}
            {isOwner && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
              >
                Voltar ao Dashboard
              </button>
            )}

            {/* Informações Financeiras */}
            {(business.divida_impostos === 1 || business.divida_particular === 1) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informações Financeiras</h3>
                <div className="space-y-3 text-sm">
                  {business.divida_impostos === 1 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="font-semibold text-gray-900 mb-1">Dívidas de Impostos</p>
                      {business.valor_divida_impostos && (
                        <p className="text-gray-700">{business.valor_divida_impostos}</p>
                      )}
                    </div>
                  )}
                  {business.divida_particular === 1 && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="font-semibold text-gray-900 mb-1">Dívidas Particulares</p>
                      {business.valor_divida_particular && (
                        <p className="text-gray-700">{business.valor_divida_particular}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Visit Scheduling Modal ── */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                Agendar Visita
              </h3>
              <button
                onClick={() => setShowVisitModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              Informe sua disponibilidade. O endereço completo será liberado após a confirmação do
              vendedor.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data preferida <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  min={minVisitDate}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário preferido
                </label>
                <select
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Sem preferência</option>
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem ao vendedor
                </label>
                <textarea
                  value={visitMessage}
                  onChange={(e) => setVisitMessage(e.target.value)}
                  placeholder="Ex: Tenho interesse na operação, gostaria de conhecer o ponto..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowVisitModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleScheduleVisit()}
                disabled={visitSubmitting || !visitDate}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {visitSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CalendarCheck className="w-4 h-4" />
                )}
                {visitSubmitting ? 'Enviando...' : 'Solicitar Visita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
