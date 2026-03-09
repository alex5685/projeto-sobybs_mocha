import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@getmocha/users-service/react";
import { useProfile } from "../hooks/useProfile";
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
} from "lucide-react";

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

  useEffect(() => {
    fetchBusiness();
  }, [id]);

  const fetchBusiness = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [businessRes, imagesRes] = await Promise.all([
        fetch(`/api/business/${id}`),
        fetch(`/api/business/${id}/images`)
      ]);

      if (businessRes.ok) {
        const data = await businessRes.json();
        setBusiness(data.business);
      } else if (businessRes.status === 404) {
        setError("Empresa não encontrada");
      } else if (businessRes.status === 403) {
        setError("Você não tem permissão para visualizar esta empresa");
      } else {
        const errorData = await businessRes.json().catch(() => ({}));
        setError(errorData.error || "Erro ao carregar informações da empresa");
      }

      if (imagesRes.ok) {
        const data = await imagesRes.json();
        setImages(data.images);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
      setError("Erro ao carregar informações da empresa");
    } finally {
      setIsLoading(false);
    }
  };

  const canManageImages = user && business && (
    business.owner_id === user.id || profile?.user_type === "admin"
  );

  const getImageUrl = (storageKey: string) => {
    return `/api/files/${storageKey}`;
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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{error || "Erro"}</h2>
          <button
            onClick={() => navigate("/marketplace")}
            className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold"
          >
            Voltar ao Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <img
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png"
                alt="Sobybs"
                className="h-10 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {business.alias_name || business.ramo_atividade}
              </h1>
              <p className="text-xl opacity-90">{business.ramo_atividade}</p>
              <div className="flex items-center space-x-4 mt-4">
                <span className="px-4 py-2 bg-white bg-opacity-20 rounded-lg font-semibold">
                  {business.segmento}
                </span>
                {business.cidade && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {business.cidade}, {business.pais || "Brasil"}
                  </span>
                )}
              </div>
            </div>
            <Building2 className="w-16 h-16 opacity-50" />
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
                        src={getImageUrl(image.storage_key)}
                        alt={image.file_name}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          console.error("Error loading image:", image.storage_key);
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImagem não encontrada%3C/text%3E%3C/svg%3E";
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
                {business.tempo_atuacao && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-[#00A9E0] mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Tempo de Atuação</p>
                      <p className="font-semibold text-gray-900">{business.tempo_atuacao}</p>
                    </div>
                  </div>
                )}
                {business.faturamento_mensal && (
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Faturamento Mensal</p>
                      <p className="font-semibold text-gray-900">{business.faturamento_mensal}</p>
                    </div>
                  </div>
                )}
                {business.despesas_fixas && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Despesas Fixas</p>
                      <p className="font-semibold text-gray-900">{business.despesas_fixas}</p>
                    </div>
                  </div>
                )}
                {business.num_funcionarios && (
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Funcionários</p>
                      <p className="font-semibold text-gray-900">{business.num_funcionarios}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ativos */}
            {(business.possui_imoveis === 1 || business.possui_frota === 1) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Ativos</h2>
                <div className="space-y-4">
                  {business.possui_imoveis === 1 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <HomeIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Imóveis</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {business.qtd_imoveis && (
                          <div>
                            <p className="text-gray-600">Quantidade</p>
                            <p className="font-semibold">{business.qtd_imoveis}</p>
                          </div>
                        )}
                        {business.valor_imoveis && (
                          <div>
                            <p className="text-gray-600">Valor Estimado</p>
                            <p className="font-semibold">{business.valor_imoveis}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {business.possui_frota === 1 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Truck className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Frota de Veículos</h3>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        {business.tipo_frota && (
                          <div>
                            <p className="text-gray-600">Tipo</p>
                            <p className="font-semibold">{business.tipo_frota}</p>
                          </div>
                        )}
                        {business.qtd_veiculos && (
                          <div>
                            <p className="text-gray-600">Quantidade</p>
                            <p className="font-semibold">{business.qtd_veiculos}</p>
                          </div>
                        )}
                        {business.valor_frota && (
                          <div>
                            <p className="text-gray-600">Valor Estimado</p>
                            <p className="font-semibold">{business.valor_frota}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Localização */}
            {(business.rua || business.bairro || business.cidade) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-[#00A9E0]" />
                  Localização
                </h2>
                <div className="space-y-2 text-gray-700">
                  {business.rua && (
                    <p>
                      {business.rua}
                      {business.numero && `, ${business.numero}`}
                      {business.complemento && ` - ${business.complemento}`}
                    </p>
                  )}
                  {business.bairro && <p>{business.bairro}</p>}
                  {business.cidade && (
                    <p className="font-semibold">
                      {business.cidade}, {business.pais || "Brasil"}
                    </p>
                  )}
                  {business.cep && <p className="text-sm text-gray-600">CEP: {business.cep}</p>}
                </div>
              </div>
            )}

            {/* Marketing */}
            {business.utiliza_midia === 1 && business.tipos_midia && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-[#00A9E0]" />
                  Marketing & Divulgação
                </h2>
                <div className="flex flex-wrap gap-2">
                  {business.tipos_midia.split(",").map((tipo, index) => (
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
            {(business.valuation_vendedor || business.motivacao_venda) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Parecer do Vendedor</h2>
                <div className="space-y-4">
                  {business.valuation_vendedor && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Avaliação do Negócio</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {business.valuation_vendedor}
                      </p>
                    </div>
                  )}
                  {business.motivacao_venda && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Motivação para Venda</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{business.motivacao_venda}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Interessado?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Entre em contato para obter mais informações sobre esta oportunidade.
              </p>
              <button className="w-full px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold">
                Entrar em Contato
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full mt-3 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
              >
                Voltar ao Dashboard
              </button>
            </div>

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
    </div>
  );
}
