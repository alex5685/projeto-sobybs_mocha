import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

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
  pais: string;
  possui_imoveis: number;
  possui_frota: number;
}

const SEGMENTOS = ["Todos", "Serviços", "Indústria", "Comércio", "Tecnologia"];

export default function Marketplace() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("Todos");
  const [selectedCity, setSelectedCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [businesses, searchTerm, selectedSegment, selectedCity]);

  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/business/marketplace");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBusinesses = () => {
    let filtered = [...businesses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.alias_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.ramo_atividade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.segmento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by segment
    if (selectedSegment !== "Todos") {
      filtered = filtered.filter((b) => b.segmento === selectedSegment);
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter((b) =>
        b.cidade?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    setFilteredBusinesses(filtered);
  };

  const getAvailableCities = () => {
    const cities = businesses
      .map((b) => b.cidade)
      .filter((city) => city)
      .filter((city, index, self) => self.indexOf(city) === index)
      .sort();
    return cities;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando empresas...</p>
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
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar ao Dashboard
              </button>
              <img
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png"
                alt="Sobybs"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
                <p className="text-sm text-gray-600">Encontre a empresa perfeita para você</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, ramo, segmento ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Segmento</label>
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                >
                  {SEGMENTOS.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cidade</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
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
          <p className="text-gray-600">
            {filteredBusinesses.length === 0
              ? "Nenhuma empresa encontrada"
              : `${filteredBusinesses.length} ${
                  filteredBusinesses.length === 1 ? "empresa encontrada" : "empresas encontradas"
                }`}
          </p>
        </div>

        {/* Business Cards Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {businesses.length === 0
                ? "Nenhuma empresa disponível no momento"
                : "Nenhuma empresa encontrada com os filtros selecionados"}
            </h3>
            <p className="text-gray-600 mb-6">
              {businesses.length === 0
                ? "Volte em breve para ver as oportunidades disponíveis"
                : "Tente ajustar os filtros ou fazer uma nova busca"}
            </p>
            {searchTerm || selectedSegment !== "Todos" || selectedCity ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSegment("Todos");
                  setSelectedCity("");
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold"
              >
                Limpar Filtros
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-100 group cursor-pointer"
                onClick={() => navigate(`/business/${business.id}`)}
              >
                {/* Card Header with gradient */}
                <div className="h-32 bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] relative overflow-hidden">
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center space-x-2 text-white">
                      {business.segmento === "Serviços" && <Briefcase className="w-5 h-5" />}
                      {business.segmento === "Comércio" && <Store className="w-5 h-5" />}
                      {business.segmento === "Indústria" && <Building2 className="w-5 h-5" />}
                      {business.segmento === "Tecnologia" && <TrendingUp className="w-5 h-5" />}
                      {!["Serviços", "Comércio", "Indústria", "Tecnologia"].includes(
                        business.segmento
                      ) && <Building2 className="w-5 h-5" />}
                      <span className="text-sm font-semibold">{business.segmento}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#00A9E0] transition-colors line-clamp-2">
                    {business.alias_name || business.ramo_atividade}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{business.ramo_atividade}</p>

                  <div className="space-y-3 mb-6">
                    {business.cidade && (
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="w-4 h-4 mr-2 text-[#00A9E0]" />
                        <span>
                          {business.cidade}, {business.pais || "Brasil"}
                        </span>
                      </div>
                    )}

                    {business.faturamento_mensal && (
                      <div className="flex items-center text-sm text-gray-700">
                        <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                        <span className="font-semibold">{business.faturamento_mensal}</span>
                      </div>
                    )}

                    {business.num_funcionarios && (
                      <div className="flex items-center text-sm text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-purple-600" />
                        <span>{business.num_funcionarios} funcionários</span>
                      </div>
                    )}

                    {business.tempo_atuacao && (
                      <div className="flex items-center text-sm text-gray-700">
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

                  <button className="w-full px-4 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all font-semibold shadow-lg hover:shadow-xl">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
