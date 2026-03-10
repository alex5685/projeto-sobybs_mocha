import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@getmocha/users-service/react";
import { AlertCircle, Save, ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react";

interface BusinessFormData {
  // Campos 2-9: Caracterização da empresa
  ramo_atividade: string;
  segmento: string;
  tempo_atuacao: string;
  faturamento_mensal: string;
  despesas_fixas: string;
  num_funcionarios: string;
  possui_imoveis: boolean;
  qtd_imoveis: string;
  valor_imoveis: string;
  possui_frota: boolean;
  tipo_frota: string;
  qtd_veiculos: string;
  valor_frota: string;

  // Campos 10-15: Localização
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  pais: string;

  // Campos 16-18: Mercado e Propaganda
  utiliza_midia: boolean;
  tipos_midia: string[];

  // Campos 17-20: Fiscal e Endividamento
  divida_impostos: boolean;
  valor_divida_impostos: string;
  divida_particular: boolean;
  valor_divida_particular: string;

  // Campos 21-22: Análise do Vendedor
  valuation_vendedor: string;
  motivacao_venda: string;

  // Campos 23-27: Campos para Compradores
  capital_aquisicao: string;
  prazo_maximo: string;
  objetivos_compra: string;
  experiencia_empreendedor: string;
  dedicacao_tempo: string;

  // Campos Premium: Valuation Profissional
  receita_recorrente: string;
  concentracao_clientes: string;
  tendencia_crescimento: string;
  contratos_longo_prazo: string;
  dependencia_proprietario: string;
}

const RAMOS_ATIVIDADE = [
  "Alimentação",
  "Comércio Varejista",
  "Serviços",
  "Indústria",
  "Tecnologia",
  "Saúde",
  "Educação",
  "Construção",
  "Logística",
  "Outros",
];

const SEGMENTOS = ["Serviços", "Indústria", "Comércio", "Tecnologia"];

const TEMPO_ATUACAO = [
  "Menos de 1 ano",
  "1 a 3 anos",
  "3 a 5 anos",
  "5 a 10 anos",
  "10 a 20 anos",
  "Mais de 20 anos",
];

const FATURAMENTO_MENSAL = [
  "Até R$ 50.000",
  "R$ 50.001 a R$ 100.000",
  "R$ 100.001 a R$ 250.000",
  "R$ 250.001 a R$ 500.000",
  "R$ 500.001 a R$ 1.000.000",
  "Acima de R$ 1.000.000",
];

const DESPESAS_FIXAS = [
  "Até R$ 20.000",
  "R$ 20.001 a R$ 50.000",
  "R$ 50.001 a R$ 100.000",
  "R$ 100.001 a R$ 250.000",
  "Acima de R$ 250.000",
];

const NUM_FUNCIONARIOS = [
  "1 a 5",
  "6 a 10",
  "11 a 20",
  "21 a 50",
  "51 a 100",
  "Acima de 100",
];

const QTD_IMOVEIS = ["1", "2", "3 a 5", "6 a 10", "Acima de 10"];

const VALOR_IMOVEIS = [
  "Até R$ 500.000",
  "R$ 500.001 a R$ 1.000.000",
  "R$ 1.000.001 a R$ 2.000.000",
  "R$ 2.000.001 a R$ 5.000.000",
  "Acima de R$ 5.000.000",
];

const TIPO_FROTA = ["Mista", "Caminhões", "Carros", "Motos"];

const VALOR_FROTA = [
  "Até R$ 100.000",
  "R$ 100.001 a R$ 250.000",
  "R$ 250.001 a R$ 500.000",
  "R$ 500.001 a R$ 1.000.000",
  "Acima de R$ 1.000.000",
];

const TIPOS_MIDIA = [
  "Jornais",
  "Revistas",
  "Internet",
  "TV",
  "Rádio",
  "Panfletos",
  "Redes Sociais",
  "Google Ads",
  "Outros",
];

const VALOR_DIVIDA = [
  "Até R$ 50.000",
  "R$ 50.001 a R$ 100.000",
  "R$ 100.001 a R$ 250.000",
  "R$ 250.001 a R$ 500.000",
  "R$ 500.001 a R$ 1.000.000",
  "Acima de R$ 1.000.000",
];

const CAPITAL_AQUISICAO = [
  "Até R$ 100.000",
  "R$ 100.001 a R$ 250.000",
  "R$ 250.001 a R$ 500.000",
  "R$ 500.001 a R$ 1.000.000",
  "R$ 1.000.001 a R$ 2.000.000",
  "Acima de R$ 2.000.000",
];

const RECEITA_RECORRENTE = [
  "0-25%",
  "25-50%",
  "50-75%",
  "75-100%",
  "Não se aplica",
];

const CONCENTRACAO_CLIENTES = [
  "Menos de 20%",
  "20-40%",
  "40-60%",
  "Mais de 60%",
];

const TENDENCIA_CRESCIMENTO = [
  "Cresceu mais de 20%",
  "Cresceu 0-20%",
  "Estável (+/- 5%)",
  "Decresceu",
];

const CONTRATOS_LONGO_PRAZO = [
  "Sim, representam mais de 50% da receita",
  "Sim, representam 20-50% da receita",
  "Sim, representam menos de 20%",
  "Não possui",
];

const DEPENDENCIA_PROPRIETARIO = [
  "Funciona indefinidamente sem mim",
  "Funciona mais de 6 meses",
  "Funciona de 1 a 6 meses",
  "Funciona menos de 1 mês",
];

export default function BusinessRegistration() {
  const [userType, setUserType] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BusinessFormData>({
    ramo_atividade: "",
    segmento: "",
    tempo_atuacao: "",
    faturamento_mensal: "",
    despesas_fixas: "",
    num_funcionarios: "",
    possui_imoveis: false,
    qtd_imoveis: "",
    valor_imoveis: "",
    possui_frota: false,
    tipo_frota: "",
    qtd_veiculos: "",
    valor_frota: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    pais: "Brasil",
    utiliza_midia: false,
    tipos_midia: [],
    divida_impostos: false,
    valor_divida_impostos: "",
    divida_particular: false,
    valor_divida_particular: "",
    valuation_vendedor: "",
    motivacao_venda: "",
    capital_aquisicao: "",
    prazo_maximo: "",
    objetivos_compra: "",
    experiencia_empreendedor: "",
    dedicacao_tempo: "",
    receita_recorrente: "",
    concentracao_clientes: "",
    tendencia_crescimento: "",
    contratos_longo_prazo: "",
    dependencia_proprietario: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [planType, setPlanType] = useState<string | null>(null);
  const navigate = useNavigate();
  const { } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await fetch("/api/profiles/me");
        if (response.ok) {
          const data = await response.json();
          if (!data.user_type) {
            navigate("/profile-setup");
            return;
          }
          if (data.user_type === "basico") {
            navigate("/profile-setup");
            return;
          }
          setUserType(data.user_type || "");
        } else {
          navigate("/profile-setup");
        }

        // Fetch user's business if exists
        const businessRes = await fetch("/api/business/my-businesses");
        if (businessRes.ok) {
          const businessData = await businessRes.json();
          if (businessData.businesses && businessData.businesses.length > 0) {
            setBusinessId(businessData.businesses[0].id);
          }
        }

        // Check subscription status
        const subscriptionRes = await fetch("/api/subscriptions/active");
        if (subscriptionRes.ok) {
          const subscriptionData = await subscriptionRes.json();
          setHasActivePlan(subscriptionData.has_active_plan || false);
          setPlanType(subscriptionData.plan_type || null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        navigate("/dashboard");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleInputChange = (field: keyof BusinessFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMidiaToggle = (midia: string) => {
    setFormData((prev) => {
      const tipos = prev.tipos_midia.includes(midia)
        ? prev.tipos_midia.filter((t) => t !== midia)
        : [...prev.tipos_midia, midia];
      return { ...prev, tipos_midia: tipos };
    });
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };

  const isAdmin = userType === "admin";
  const isVendedor = userType === "vendedor" || userType === "hibrido" || isAdmin;
  const isComprador = userType === "comprador" || userType === "hibrido" || isAdmin;

  // Build the step flow based on user type
  const getStepFlow = () => {
    const steps: string[] = [];
    
    if (isVendedor) {
      steps.push("caracterizacao"); // Step 1 for vendedor
    }
    
    steps.push("localizacao"); // Always present
    
    if (isVendedor) {
      steps.push("mercado"); // Step 3 for vendedor
      steps.push("fiscal"); // Step 4 for vendedor
      steps.push("vendedor"); // Step 5 for vendedor
    }
    
    if (isComprador) {
      steps.push("comprador"); // Last step for comprador
    }
    
    return steps;
  };

  const stepFlow = getStepFlow();
  const totalSteps = stepFlow.length;
  const currentStepKey = stepFlow[currentStep - 1];

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStepKey === "caracterizacao") {
      if (!formData.ramo_atividade) newErrors.ramo_atividade = "Campo obrigatório";
      if (!formData.segmento) newErrors.segmento = "Campo obrigatório";
      if (!formData.tempo_atuacao) newErrors.tempo_atuacao = "Campo obrigatório";
      if (!formData.faturamento_mensal) newErrors.faturamento_mensal = "Campo obrigatório";
      if (!formData.despesas_fixas) newErrors.despesas_fixas = "Campo obrigatório";
      if (!formData.num_funcionarios) newErrors.num_funcionarios = "Campo obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/business/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessId(data.businessId);
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Erro ao salvar dados da empresa" });
      }
    } catch (error) {
      console.error("Error saving business data:", error);
      setErrors({ submit: "Erro ao salvar dados da empresa" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!isVendedor && !isComprador && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Perfil Necessário</h2>
          <p className="text-gray-600 mb-6">
            Para cadastrar uma empresa, você precisa ter um perfil de Vendedor, Comprador, Híbrido ou Admin.
          </p>
          <button
            onClick={() => navigate("/profile-setup")}
            className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold"
          >
            Configurar Perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar ao Dashboard
          </button>
          
          {businessId && isVendedor && (
            <button
              onClick={() => navigate(`/business/${businessId}/images`)}
              className="px-4 py-2 bg-[#00A9E0] text-white rounded-lg hover:bg-[#0098CC] transition-colors font-semibold flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Gerenciar Fotos
            </button>
          )}
        </div>
        <div className="text-center mb-8">
          <img
            src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png"
            alt="Sobybs Logo"
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Cadastro da Empresa</h1>
          <p className="text-lg text-gray-600">
            Etapa {currentStep} de {totalSteps}
          </p>
        </div>

        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step: Caracterização da Empresa */}
          {currentStepKey === "caracterizacao" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Caracterização da Empresa</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ramo de Atividade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ramo_atividade}
                    onChange={(e) => handleInputChange("ramo_atividade", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent ${
                      errors.ramo_atividade ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {RAMOS_ATIVIDADE.map((ramo) => (
                      <option key={ramo} value={ramo}>
                        {ramo}
                      </option>
                    ))}
                  </select>
                  {errors.ramo_atividade && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.ramo_atividade}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Segmento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.segmento}
                    onChange={(e) => handleInputChange("segmento", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent ${
                      errors.segmento ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {SEGMENTOS.map((seg) => (
                      <option key={seg} value={seg}>
                        {seg}
                      </option>
                    ))}
                  </select>
                  {errors.segmento && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.segmento}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tempo de Atuação no Mercado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tempo_atuacao}
                    onChange={(e) => handleInputChange("tempo_atuacao", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent ${
                      errors.tempo_atuacao ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {TEMPO_ATUACAO.map((tempo) => (
                      <option key={tempo} value={tempo}>
                        {tempo}
                      </option>
                    ))}
                  </select>
                  {errors.tempo_atuacao && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.tempo_atuacao}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Faturamento Bruto Mensal <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.faturamento_mensal}
                    onChange={(e) => handleInputChange("faturamento_mensal", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent ${
                      errors.faturamento_mensal ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {FATURAMENTO_MENSAL.map((fat) => (
                      <option key={fat} value={fat}>
                        {fat}
                      </option>
                    ))}
                  </select>
                  {errors.faturamento_mensal && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.faturamento_mensal}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Despesas Fixas Mensais <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.despesas_fixas}
                    onChange={(e) => handleInputChange("despesas_fixas", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent ${
                      errors.despesas_fixas ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {DESPESAS_FIXAS.map((desp) => (
                      <option key={desp} value={desp}>
                        {desp}
                      </option>
                    ))}
                  </select>
                  {errors.despesas_fixas && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.despesas_fixas}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Funcionários <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.num_funcionarios}
                    onChange={(e) => handleInputChange("num_funcionarios", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent ${
                      errors.num_funcionarios ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {NUM_FUNCIONARIOS.map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                  {errors.num_funcionarios && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.num_funcionarios}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.possui_imoveis}
                      onChange={(e) => handleInputChange("possui_imoveis", e.target.checked)}
                      className="w-5 h-5 text-[#00A9E0] border-gray-300 rounded focus:ring-[#00A9E0]"
                    />
                    <span className="text-sm font-semibold text-gray-700">A empresa possui imóveis?</span>
                  </label>
                </div>

                {formData.possui_imoveis && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quantos imóveis?</label>
                      <select
                        value={formData.qtd_imoveis}
                        onChange={(e) => handleInputChange("qtd_imoveis", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {QTD_IMOVEIS.map((qtd) => (
                          <option key={qtd} value={qtd}>
                            {qtd}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valor total dos imóveis
                      </label>
                      <select
                        value={formData.valor_imoveis}
                        onChange={(e) => handleInputChange("valor_imoveis", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {VALOR_IMOVEIS.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-6 mt-6">
                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.possui_frota}
                      onChange={(e) => handleInputChange("possui_frota", e.target.checked)}
                      className="w-5 h-5 text-[#00A9E0] border-gray-300 rounded focus:ring-[#00A9E0]"
                    />
                    <span className="text-sm font-semibold text-gray-700">A empresa possui frota?</span>
                  </label>
                </div>

                {formData.possui_frota && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de frota</label>
                      <select
                        value={formData.tipo_frota}
                        onChange={(e) => handleInputChange("tipo_frota", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {TIPO_FROTA.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quantos veículos?</label>
                      <input
                        type="number"
                        value={formData.qtd_veiculos}
                        onChange={(e) => handleInputChange("qtd_veiculos", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valor da frota (quitados)
                      </label>
                      <select
                        value={formData.valor_frota}
                        onChange={(e) => handleInputChange("valor_frota", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {VALOR_FROTA.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Localização */}
          {currentStepKey === "localizacao" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dados de Localização</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CEP</label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => {
                      const formatted = formatCEP(e.target.value);
                      handleInputChange("cep", formatted);
                      if (formatted.replace(/\D/g, "").length === 8) {
                        fetchAddressByCEP(formatted);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rua</label>
                  <input
                    type="text"
                    value={formData.rua}
                    onChange={(e) => handleInputChange("rua", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Nome da rua"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Complemento</label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => handleInputChange("complemento", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Sala, Andar, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bairro</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange("bairro", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Nome do bairro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Nome da cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">País</label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => handleInputChange("pais", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Brasil"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Informações de Mercado & Propaganda */}
          {currentStepKey === "mercado" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações de Mercado & Propaganda</h2>

              <div className="mb-6">
                <label className="flex items-center space-x-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={formData.utiliza_midia}
                    onChange={(e) => handleInputChange("utiliza_midia", e.target.checked)}
                    className="w-5 h-5 text-[#00A9E0] border-gray-300 rounded focus:ring-[#00A9E0]"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    A empresa utiliza algum tipo de mídia para divulgar produtos e serviços?
                  </span>
                </label>

                {formData.utiliza_midia && (
                  <div className="mt-4 pl-8">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Selecione os tipos de mídia:</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {TIPOS_MIDIA.map((midia) => (
                        <label key={midia} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.tipos_midia.includes(midia)}
                            onChange={() => handleMidiaToggle(midia)}
                            className="w-4 h-4 text-[#00A9E0] border-gray-300 rounded focus:ring-[#00A9E0]"
                          />
                          <span className="text-sm text-gray-700">{midia}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Informações Fiscais e Endividamento */}
          {currentStepKey === "fiscal" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações Fiscais e Endividamento</h2>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.divida_impostos}
                      onChange={(e) => handleInputChange("divida_impostos", e.target.checked)}
                      className="w-5 h-5 text-[#00A9E0] border-gray-300 rounded focus:ring-[#00A9E0]"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      A empresa tem dívida referente a impostos federais, estaduais ou municipais?
                    </span>
                  </label>

                  {formData.divida_impostos && (
                    <div className="pl-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Qual o valor total da dívida?
                      </label>
                      <select
                        value={formData.valor_divida_impostos}
                        onChange={(e) => handleInputChange("valor_divida_impostos", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {VALOR_DIVIDA.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <label className="flex items-center space-x-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.divida_particular}
                      onChange={(e) => handleInputChange("divida_particular", e.target.checked)}
                      className="w-5 h-5 text-[#00A9E0] border-gray-300 rounded focus:ring-[#00A9E0]"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      A empresa possui dívidas particulares (leasing, CDC, financiamentos, etc.) e/ou empréstimos?
                    </span>
                  </label>

                  {formData.divida_particular && (
                    <div className="pl-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Qual o valor total?
                      </label>
                      <select
                        value={formData.valor_divida_particular}
                        onChange={(e) => handleInputChange("valor_divida_particular", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {VALOR_DIVIDA.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step: Dados para Valuation Profissional (Premium) */}
          {currentStepKey === "fiscal" && (
            <div className="mt-8 border-t-2 pt-8">
              <div className={`relative ${!hasActivePlan ? 'pointer-events-none' : ''}`}>
                {/* Overlay for locked state */}
                {!hasActivePlan && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-xl flex items-center justify-center">
                    <div className="bg-white border-2 border-[#00A9E0] rounded-xl p-8 max-w-md text-center shadow-xl">
                      <div className="mb-4">
                        <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full text-sm font-bold">
                          🔒 Disponível nos planos Bronze, Silver e Gold
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Desbloqueie Análises Avançadas
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Preencha esses dados para reduzir incerteza e obter um Valuation Completo mais preciso
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const url = businessId 
                            ? `/planos?source=valuation_fields_locked&businessId=${businessId}`
                            : `/planos?source=valuation_fields_locked`;
                          window.open(url, '_blank');
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold"
                      >
                        Ver planos com Valuation
                      </button>
                    </div>
                  </div>
                )}

                {/* Header with badge */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Dados para Valuation Profissional (Opcional)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Esses dados reduzem incerteza e liberam análises avançadas no Valuation Completo.
                    </p>
                  </div>
                  {hasActivePlan && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold whitespace-nowrap">
                      ✓ Incluído no seu plano: {planType?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Premium fields */}
                <div className="space-y-6 opacity-30" style={hasActivePlan ? {opacity: 1} : {}}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Qual percentual da receita é recorrente (contratos, assinaturas)?
                    </label>
                    <select
                      value={formData.receita_recorrente}
                      onChange={(e) => handleInputChange("receita_recorrente", e.target.value)}
                      disabled={!hasActivePlan}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecione...</option>
                      {RECEITA_RECORRENTE.map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Os 3 maiores clientes representam quanto da receita total?
                    </label>
                    <select
                      value={formData.concentracao_clientes}
                      onChange={(e) => handleInputChange("concentracao_clientes", e.target.value)}
                      disabled={!hasActivePlan}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecione...</option>
                      {CONCENTRACAO_CLIENTES.map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Como foi o faturamento nos últimos 12 meses?
                    </label>
                    <select
                      value={formData.tendencia_crescimento}
                      onChange={(e) => handleInputChange("tendencia_crescimento", e.target.value)}
                      disabled={!hasActivePlan}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecione...</option>
                      {TENDENCIA_CRESCIMENTO.map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Possui contratos firmados com prazo superior a 12 meses?
                    </label>
                    <select
                      value={formData.contratos_longo_prazo}
                      onChange={(e) => handleInputChange("contratos_longo_prazo", e.target.value)}
                      disabled={!hasActivePlan}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecione...</option>
                      {CONTRATOS_LONGO_PRAZO.map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      A empresa consegue operar normalmente sem você por quanto tempo?
                    </label>
                    <select
                      value={formData.dependencia_proprietario}
                      onChange={(e) => handleInputChange("dependencia_proprietario", e.target.value)}
                      disabled={!hasActivePlan}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecione...</option>
                      {DEPENDENCIA_PROPRIETARIO.map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-xs text-gray-500 italic mt-4">
                    * Precisão estimada depende da qualidade dos dados informados e do setor. Valuation não constitui laudo oficial.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step: Análise do Vendedor */}
          {currentStepKey === "vendedor" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Análise & Parecer do Vendedor</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quanto vale o seu negócio?
                  </label>
                  <textarea
                    value={formData.valuation_vendedor}
                    onChange={(e) => handleInputChange("valuation_vendedor", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Descreva sua avaliação sobre o valor do negócio..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Por que quer vender?
                  </label>
                  <textarea
                    value={formData.motivacao_venda}
                    onChange={(e) => handleInputChange("motivacao_venda", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Compartilhe suas motivações para vender a empresa..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Campos para Compradores */}
          {currentStepKey === "comprador" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações do Comprador</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Capital destinado para a aquisição
                  </label>
                  <select
                    value={formData.capital_aquisicao}
                    onChange={(e) => handleInputChange("capital_aquisicao", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {CAPITAL_AQUISICAO.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Qual o seu tempo máximo de espera para concretizar o negócio?
                  </label>
                  <input
                    type="text"
                    value={formData.prazo_maximo}
                    onChange={(e) => handleInputChange("prazo_maximo", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Ex: 3 meses, 6 meses, 1 ano..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fale mais sobre os seus objetivos e desejos na aquisição de uma empresa
                  </label>
                  <textarea
                    value={formData.objetivos_compra}
                    onChange={(e) => handleInputChange("objetivos_compra", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Compartilhe seus objetivos e expectativas..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fale sobre suas experiências como empreendedor, sucessos, fracassos
                  </label>
                  <textarea
                    value={formData.experiencia_empreendedor}
                    onChange={(e) => handleInputChange("experiencia_empreendedor", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Descreva sua trajetória empreendedora..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Você vai dedicar seu tempo na empresa que adquirir?
                  </label>
                  <input
                    type="text"
                    value={formData.dedicacao_tempo}
                    onChange={(e) => handleInputChange("dedicacao_tempo", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                    placeholder="Ex: Tempo integral, meio período, apenas gestão..."
                  />
                </div>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start mt-6">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{isSubmitting ? "Salvando..." : "Salvar e Finalizar"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
