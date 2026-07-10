'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-shim';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Lock,
  Store,
  EyeOff,
} from 'lucide-react';
import { CurrencyInput } from '@/components/CurrencyInput';

interface BusinessFormData {
  // Campos básicos
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
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  utiliza_midia: boolean;
  tipos_midia: string[];
  divida_impostos: boolean;
  valor_divida_impostos: string;
  divida_particular: boolean;
  valor_divida_particular: string;
  valuation_vendedor: string;
  motivacao_venda: string;
  // Publicação no Marketplace
  is_public: boolean;
  capital_aquisicao: string;
  prazo_maximo: string;
  objetivos_compra: string;
  experiencia_empreendedor: string;
  dedicacao_tempo: string;
  // Campos premium (valuation qualitativo)
  receita_recorrente: string;
  concentracao_clientes: string;
  tendencia_crescimento: string;
  contratos_longo_prazo: string;
  dependencia_proprietario: string;
  // Campos Fase 2 — Silver/Gold (financeiro detalhado)
  faturamento_liquido_mensal: string;
  lucro_bruto_mensal: string;
  lucro_liquido_mensal: string;
  impostos_mensais: string;
  ebitda: string;
  investimentos_andamento: string;
  num_clientes_ativos: string;
  valor_marca: string;
  potencial_crescimento: string;
  descricao_negocio: string;
  diferencial_competitivo: string;
}

const RAMOS_ATIVIDADE = [
  'Alimentação',
  'Comércio Varejista',
  'Serviços',
  'Indústria',
  'Tecnologia',
  'Saúde',
  'Educação',
  'Construção',
  'Logística',
  'Outros',
];
const SEGMENTOS = ['Serviços', 'Indústria', 'Comércio', 'Tecnologia'];
const TEMPO_ATUACAO = [
  'Menos de 1 ano',
  '1 a 3 anos',
  '3 a 5 anos',
  '5 a 10 anos',
  '10 a 20 anos',
  'Mais de 20 anos',
];
const NUM_FUNCIONARIOS = ['1 a 5', '6 a 10', '11 a 20', '21 a 50', '51 a 100', 'Acima de 100'];
const QTD_IMOVEIS = ['1', '2', '3 a 5', '6 a 10', 'Acima de 10'];
const TIPO_FROTA = ['Mista', 'Caminhões', 'Carros', 'Motos'];
const TIPOS_MIDIA = [
  'Jornais',
  'Revistas',
  'Internet',
  'TV',
  'Rádio',
  'Panfletos',
  'Redes Sociais',
  'Google Ads',
  'Outros',
];
const CAPITAL_AQUISICAO = [
  'Até R$ 100.000',
  'R$ 100.001 a R$ 250.000',
  'R$ 250.001 a R$ 500.000',
  'R$ 500.001 a R$ 1.000.000',
  'R$ 1.000.001 a R$ 2.000.000',
  'Acima de R$ 2.000.000',
];
const RECEITA_RECORRENTE = ['0-25%', '25-50%', '50-75%', '75-100%', 'Não se aplica'];
const CONCENTRACAO_CLIENTES = ['Menos de 20%', '20-40%', '40-60%', 'Mais de 60%'];
const TENDENCIA_CRESCIMENTO = [
  'Cresceu mais de 20%',
  'Cresceu 0-20%',
  'Estável (+/- 5%)',
  'Decresceu',
];
const CONTRATOS_LONGO_PRAZO = [
  'Sim, representam mais de 50% da receita',
  'Sim, representam 20-50% da receita',
  'Sim, representam menos de 20%',
  'Não possui',
];
const DEPENDENCIA_PROPRIETARIO = [
  'Funciona indefinidamente sem mim',
  'Funciona mais de 6 meses',
  'Funciona de 1 a 6 meses',
  'Funciona menos de 1 mês',
];

export default function BusinessRegistration() {
  const [userType, setUserType] = useState<string>('');
  const [businessId, setBusinessId] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [planType, setPlanType] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessFormData>({
    ramo_atividade: '',
    segmento: '',
    tempo_atuacao: '',
    faturamento_mensal: '',
    despesas_fixas: '',
    num_funcionarios: '',
    possui_imoveis: false,
    qtd_imoveis: '',
    valor_imoveis: '',
    possui_frota: false,
    tipo_frota: '',
    qtd_veiculos: '',
    valor_frota: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    utiliza_midia: false,
    tipos_midia: [],
    divida_impostos: false,
    valor_divida_impostos: '',
    divida_particular: false,
    valor_divida_particular: '',
    valuation_vendedor: '',
    motivacao_venda: '',
    is_public: false,
    capital_aquisicao: '',
    prazo_maximo: '',
    objetivos_compra: '',
    experiencia_empreendedor: '',
    dedicacao_tempo: '',
    receita_recorrente: '',
    concentracao_clientes: '',
    tendencia_crescimento: '',
    contratos_longo_prazo: '',
    dependencia_proprietario: '',
    // Fase 2
    faturamento_liquido_mensal: '',
    lucro_bruto_mensal: '',
    lucro_liquido_mensal: '',
    impostos_mensais: '',
    ebitda: '',
    investimentos_andamento: '',
    num_clientes_ativos: '',
    valor_marca: '',
    potencial_crescimento: '',
    descricao_negocio: '',
    diferencial_competitivo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Silver ou Gold têm acesso à Fase 2 financeiro detalhado
  const isSilverOrGold = hasActivePlan && (planType === 'silver' || planType === 'gold');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await fetch('/api/profiles/me', { credentials: 'include' });
        if (response.ok) {
          const data = (await response.json()) as { user_type?: string };
          if (!data.user_type || data.user_type === 'basico') {
            // Básico não tem acesso — mostrar mensagem em vez de redirecionar para profile-setup
            return;
          }
          setUserType(data.user_type || '');
        } else if (response.status === 401) {
          // Não está logado
          window.location.href = '/account/signin';
          return;
        } else {
          navigate('/dashboard');
          return;
        }

        const businessRes = await fetch('/api/business/my-businesses', { credentials: 'include' });
        if (businessRes.ok) {
          const bd = (await businessRes.json()) as { businesses?: { id: string }[] };
          if (bd.businesses && bd.businesses.length > 0) {
            const existingId = bd.businesses[0].id;
            setBusinessId(existingId);

            // Pre-fill form with saved data
            const detailRes = await fetch(`/api/business/${existingId}`, {
              credentials: 'include',
            });
            if (detailRes.ok) {
              const det = (await detailRes.json()) as {
                business?: Record<string, string | number | null>;
              };
              const b = det.business;
              if (b) {
                setFormData((prev) => ({
                  ...prev,
                  ramo_atividade: String(b.ramo_atividade ?? prev.ramo_atividade),
                  segmento: String(b.segmento ?? prev.segmento),
                  tempo_atuacao: String(b.tempo_atuacao ?? prev.tempo_atuacao),
                  faturamento_mensal: String(b.faturamento_mensal ?? prev.faturamento_mensal),
                  despesas_fixas: String(b.despesas_fixas ?? prev.despesas_fixas),
                  num_funcionarios: String(b.num_funcionarios ?? prev.num_funcionarios),
                  possui_imoveis: b.possui_imoveis === 1,
                  qtd_imoveis: String(b.qtd_imoveis ?? prev.qtd_imoveis),
                  valor_imoveis: String(b.valor_imoveis ?? prev.valor_imoveis),
                  possui_frota: b.possui_frota === 1,
                  tipo_frota: String(b.tipo_frota ?? prev.tipo_frota),
                  qtd_veiculos: String(b.qtd_veiculos ?? prev.qtd_veiculos),
                  valor_frota: String(b.valor_frota ?? prev.valor_frota),
                  cep: String(b.cep ?? prev.cep),
                  rua: String(b.rua ?? prev.rua),
                  numero: String(b.numero ?? prev.numero),
                  complemento: String(b.complemento ?? prev.complemento),
                  bairro: String(b.bairro ?? prev.bairro),
                  cidade: String(b.cidade ?? prev.cidade),
                  estado: String(b.estado ?? prev.estado),
                  pais: String(b.pais ?? prev.pais),
                  utiliza_midia: b.utiliza_midia === 1,
                  tipos_midia: b.tipos_midia
                    ? (JSON.parse(String(b.tipos_midia)) as string[])
                    : prev.tipos_midia,
                  divida_impostos: b.divida_impostos === 1,
                  valor_divida_impostos: String(
                    b.valor_divida_impostos ?? prev.valor_divida_impostos
                  ),
                  divida_particular: b.divida_particular === 1,
                  valor_divida_particular: String(
                    b.valor_divida_particular ?? prev.valor_divida_particular
                  ),
                  valuation_vendedor: String(b.valuation_vendedor ?? prev.valuation_vendedor),
                  motivacao_venda: String(b.motivacao_venda ?? prev.motivacao_venda),
                  is_public: b.is_public === 1,
                  capital_aquisicao: String(b.capital_aquisicao ?? prev.capital_aquisicao),
                  prazo_maximo: String(b.prazo_maximo ?? prev.prazo_maximo),
                  objetivos_compra: String(b.objetivos_compra ?? prev.objetivos_compra),
                  experiencia_empreendedor: String(
                    b.experiencia_empreendedor ?? prev.experiencia_empreendedor
                  ),
                  dedicacao_tempo: String(b.dedicacao_tempo ?? prev.dedicacao_tempo),
                  receita_recorrente: String(b.receita_recorrente ?? prev.receita_recorrente),
                  concentracao_clientes: String(
                    b.concentracao_clientes ?? prev.concentracao_clientes
                  ),
                  tendencia_crescimento: String(
                    b.tendencia_crescimento ?? prev.tendencia_crescimento
                  ),
                  contratos_longo_prazo: String(
                    b.contratos_longo_prazo ?? prev.contratos_longo_prazo
                  ),
                  dependencia_proprietario: String(
                    b.dependencia_proprietario ?? prev.dependencia_proprietario
                  ),
                  faturamento_liquido_mensal: String(
                    b.faturamento_liquido_mensal ?? prev.faturamento_liquido_mensal
                  ),
                  lucro_bruto_mensal: String(b.lucro_bruto_mensal ?? prev.lucro_bruto_mensal),
                  lucro_liquido_mensal: String(b.lucro_liquido_mensal ?? prev.lucro_liquido_mensal),
                  impostos_mensais: String(b.impostos_mensais ?? prev.impostos_mensais),
                  ebitda: String(b.ebitda ?? prev.ebitda),
                  investimentos_andamento: String(
                    b.investimentos_andamento ?? prev.investimentos_andamento
                  ),
                  num_clientes_ativos: String(b.num_clientes_ativos ?? prev.num_clientes_ativos),
                  valor_marca: String(b.valor_marca ?? prev.valor_marca),
                  potencial_crescimento: String(
                    b.potencial_crescimento ?? prev.potencial_crescimento
                  ),
                  descricao_negocio: String(b.descricao_negocio ?? prev.descricao_negocio),
                  diferencial_competitivo: String(
                    b.diferencial_competitivo ?? prev.diferencial_competitivo
                  ),
                }));
              }
            }
          }
        }

        const subRes = await fetch('/api/subscriptions/active', { credentials: 'include' });
        if (subRes.ok) {
          const sd = (await subRes.json()) as { has_active_plan?: boolean; plan_type?: string };
          setHasActivePlan(sd.has_active_plan || false);
          setPlanType(sd.plan_type || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/dashboard');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    void fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (field: keyof BusinessFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
  };

  const handleMidiaToggle = (midia: string) => {
    setFormData((prev) => ({
      ...prev,
      tipos_midia: prev.tipos_midia.includes(midia)
        ? prev.tipos_midia.filter((t) => t !== midia)
        : [...prev.tipos_midia, midia],
    }));
  };

  const fetchAddressByCEP = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (!data.erro)
        setFormData((prev) => ({
          ...prev,
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        }));
    } catch {
      /* ignore */
    }
  };

  const formatCEP = (v: string) =>
    v
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, '$1-$2');

  const isAdmin = userType === 'admin';
  const isVendedor = userType === 'vendedor' || userType === 'hibrido' || isAdmin;
  const isComprador = userType === 'comprador' || userType === 'hibrido' || isAdmin;

  const getStepFlow = () => {
    const steps: string[] = [];
    if (isVendedor) steps.push('caracterizacao');
    steps.push('localizacao');
    if (isVendedor) {
      steps.push('mercado');
      steps.push('fiscal');
      steps.push('vendedor');
      if (isSilverOrGold) steps.push('financeiro'); // Fase 2 — Silver/Gold
    }
    if (isComprador) steps.push('comprador');
    return steps;
  };

  const stepFlow = getStepFlow();
  const totalSteps = stepFlow.length;
  const currentStepKey = stepFlow[currentStep - 1];

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStepKey === 'caracterizacao') {
      if (!formData.ramo_atividade) newErrors.ramo_atividade = 'Campo obrigatório';
      if (!formData.segmento) newErrors.segmento = 'Campo obrigatório';
      if (!formData.tempo_atuacao) newErrors.tempo_atuacao = 'Campo obrigatório';
      if (!formData.faturamento_mensal) newErrors.faturamento_mensal = 'Campo obrigatório';
      if (!formData.despesas_fixas) newErrors.despesas_fixas = 'Campo obrigatório';
      if (!formData.num_funcionarios) newErrors.num_funcionarios = 'Campo obrigatório';
    }
    if (currentStepKey === 'financeiro') {
      if (!formData.lucro_liquido_mensal)
        newErrors.lucro_liquido_mensal = 'Campo obrigatório para o valuation';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/business/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = (await res.json()) as { businessId: string };
        if (data.businessId && !businessId) setBusinessId(data.businessId);
      }
      // Don't block navigation even if save fails on intermediate steps
    } catch (err) {
      console.error('Step auto-save error:', err);
    } finally {
      setIsSubmitting(false);
    }
    setCurrentStep((p) => p + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleBack = () => {
    setCurrentStep((p) => p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/business/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = (await res.json()) as { businessId: string };
        const bid = data.businessId;
        // Silver/Gold users have all financial data — send directly to the complete valuation
        // with ?refresh=1 so the AI re-runs with the newly saved data
        if (isSilverOrGold) {
          navigate(`/empresa/${bid}/valuation-completo?refresh=1`);
        } else {
          navigate(`/valuation-rapido/${bid}`);
        }
      } else {
        const err = (await res.json()) as { error?: string };
        setErrors({ submit: err.error || 'Erro ao salvar dados da empresa' });
      }
    } catch (ex) {
      console.error('Business registration error:', ex);
      setErrors({ submit: 'Erro ao salvar dados da empresa' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!isVendedor && !isComprador) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Perfil Necessário</h2>
          <p className="text-muted-foreground mb-4">
            Para cadastrar uma empresa é necessário ter um perfil Vendedor, Comprador ou Híbrido.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary text-white rounded-xl"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar ao Dashboard
          </button>
          {businessId && isVendedor && (
            <button
              onClick={() => navigate(`/business/${businessId}/images`)}
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" /> Gerenciar Fotos
            </button>
          )}
        </div>

        <div className="text-center mb-8">
          <img
            src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
            alt="Sobybs"
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-foreground mb-3">Cadastro da Empresa</h1>
          <p className="text-lg text-muted-foreground">
            Etapa {currentStep} de {totalSteps}
          </p>
        </div>

        <div className="mb-8">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent Enter from submitting the form on intermediate steps
            if (e.key === 'Enter' && currentStep < totalSteps) {
              e.preventDefault();
            }
          }}
          className="bg-card border border-border rounded-2xl shadow-xl p-8"
        >
          {/* ── Caracterização ── */}
          {currentStepKey === 'caracterizacao' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Caracterização da Empresa</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* ramo_atividade */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Ramo de Atividade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ramo_atividade}
                    onChange={(e) => handleInputChange('ramo_atividade', e.target.value)}
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary text-foreground ${errors.ramo_atividade ? 'border-red-500' : 'border-border'}`}
                  >
                    <option value="">Selecione...</option>
                    {RAMOS_ATIVIDADE.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {errors.ramo_atividade && (
                    <p className="mt-1 text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.ramo_atividade}
                    </p>
                  )}
                </div>
                {/* segmento */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Segmento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.segmento}
                    onChange={(e) => handleInputChange('segmento', e.target.value)}
                    className={`w-full px-4 py-3 bg-input border rounded-xl focus:ring-2 focus:ring-primary text-foreground ${errors.segmento ? 'border-red-500' : 'border-border'}`}
                  >
                    <option value="">Selecione...</option>
                    {SEGMENTOS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.segmento && (
                    <p className="mt-1 text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.segmento}
                    </p>
                  )}
                </div>
                {/* tempo_atuacao */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Tempo de Atuação <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tempo_atuacao}
                    onChange={(e) => handleInputChange('tempo_atuacao', e.target.value)}
                    className={`w-full px-4 py-3 bg-input border rounded-xl focus:ring-2 focus:ring-primary text-foreground ${errors.tempo_atuacao ? 'border-red-500' : 'border-border'}`}
                  >
                    <option value="">Selecione...</option>
                    {TEMPO_ATUACAO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.tempo_atuacao && (
                    <p className="mt-1 text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.tempo_atuacao}
                    </p>
                  )}
                </div>
                {/* faturamento_mensal */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Faturamento Bruto Mensal <span className="text-red-500">*</span>
                  </label>
                  <CurrencyInput
                    value={formData.faturamento_mensal}
                    onChange={(v) => handleInputChange('faturamento_mensal', v)}
                    placeholder="R$ 0,00"
                    className={`w-full px-4 py-3 bg-input border rounded-xl focus:ring-2 focus:ring-primary text-foreground ${errors.faturamento_mensal ? 'border-red-500' : 'border-border'}`}
                  />
                  {errors.faturamento_mensal && (
                    <p className="mt-1 text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.faturamento_mensal}
                    </p>
                  )}
                </div>
                {/* despesas_fixas */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Despesas Fixas Mensais <span className="text-red-500">*</span>
                  </label>
                  <CurrencyInput
                    value={formData.despesas_fixas}
                    onChange={(v) => handleInputChange('despesas_fixas', v)}
                    placeholder="R$ 0,00"
                    className={`w-full px-4 py-3 bg-input border rounded-xl focus:ring-2 focus:ring-primary text-foreground ${errors.despesas_fixas ? 'border-red-500' : 'border-border'}`}
                  />
                  {errors.despesas_fixas && (
                    <p className="mt-1 text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.despesas_fixas}
                    </p>
                  )}
                </div>
                {/* num_funcionarios */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Nº de Funcionários <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.num_funcionarios}
                    onChange={(e) => handleInputChange('num_funcionarios', e.target.value)}
                    className={`w-full px-4 py-3 bg-input border rounded-xl focus:ring-2 focus:ring-primary text-foreground ${errors.num_funcionarios ? 'border-red-500' : 'border-border'}`}
                  >
                    <option value="">Selecione...</option>
                    {NUM_FUNCIONARIOS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {errors.num_funcionarios && (
                    <p className="mt-1 text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.num_funcionarios}
                    </p>
                  )}
                </div>
              </div>
              {/* imóveis */}
              <div className="border-t pt-6">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={formData.possui_imoveis}
                    onChange={(e) => handleInputChange('possui_imoveis', e.target.checked)}
                    className="w-5 h-5 text-primary border-border rounded"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    A empresa possui imóveis?
                  </span>
                </label>
                {formData.possui_imoveis && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Quantos imóveis?
                      </label>
                      <select
                        value={formData.qtd_imoveis}
                        onChange={(e) => handleInputChange('qtd_imoveis', e.target.value)}
                        className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                      >
                        <option value="">Selecione...</option>
                        {QTD_IMOVEIS.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Valor total dos imóveis
                      </label>
                      <CurrencyInput
                        value={formData.valor_imoveis}
                        onChange={(v) => handleInputChange('valor_imoveis', v)}
                        placeholder="R$ 0,00"
                        className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* frota */}
              <div className="border-t pt-6">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={formData.possui_frota}
                    onChange={(e) => handleInputChange('possui_frota', e.target.checked)}
                    className="w-5 h-5 text-primary border-border rounded"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    A empresa possui frota?
                  </span>
                </label>
                {formData.possui_frota && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Tipo de frota
                      </label>
                      <select
                        value={formData.tipo_frota}
                        onChange={(e) => handleInputChange('tipo_frota', e.target.value)}
                        className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                      >
                        <option value="">Selecione...</option>
                        {TIPO_FROTA.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Qtd veículos
                      </label>
                      <input
                        type="number"
                        value={formData.qtd_veiculos}
                        onChange={(e) => handleInputChange('qtd_veiculos', e.target.value)}
                        className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Valor da frota (quitada)
                      </label>
                      <CurrencyInput
                        value={formData.valor_frota}
                        onChange={(v) => handleInputChange('valor_frota', v)}
                        placeholder="R$ 0,00"
                        className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Localização ── */}
          {currentStepKey === 'localizacao' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Dados de Localização</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">CEP</label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => {
                      const f = formatCEP(e.target.value);
                      handleInputChange('cep', f);
                      if (f.replace(/\D/g, '').length === 8) fetchAddressByCEP(f);
                    }}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Rua</label>
                  <input
                    type="text"
                    value={formData.rua}
                    onChange={(e) => handleInputChange('rua', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Nome da rua"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => handleInputChange('complemento', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Sala, Andar..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Bairro</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Nome do bairro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Nome da cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Estado</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="UF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">País</label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => handleInputChange('pais', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Brasil"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Mercado & Propaganda ── */}
          {currentStepKey === 'mercado' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Mercado & Propaganda</h2>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={formData.utiliza_midia}
                  onChange={(e) => handleInputChange('utiliza_midia', e.target.checked)}
                  className="w-5 h-5 text-primary border-border rounded"
                />
                <span className="text-sm font-semibold text-foreground">
                  A empresa utiliza mídia para divulgação?
                </span>
              </label>
              {formData.utiliza_midia && (
                <div className="pl-8 grid md:grid-cols-2 gap-3">
                  {TIPOS_MIDIA.map((m) => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tipos_midia.includes(m)}
                        onChange={() => handleMidiaToggle(m)}
                        className="w-4 h-4 text-primary border-border rounded"
                      />
                      <span className="text-sm text-foreground">{m}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Fiscal & Endividamento + Campos Premium Qualitativos ── */}
          {currentStepKey === 'fiscal' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Fiscal, Endividamento & Qualidade do Negócio
              </h2>

              {/* Dívidas */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.divida_impostos}
                  onChange={(e) => handleInputChange('divida_impostos', e.target.checked)}
                  className="w-5 h-5 text-primary border-border rounded"
                />
                <span className="text-sm font-semibold text-foreground">
                  Possui dívida de impostos (federal/estadual/municipal)?
                </span>
              </label>
              {formData.divida_impostos && (
                <div className="pl-8">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Valor total das dívidas fiscais
                  </label>
                  <CurrencyInput
                    value={formData.valor_divida_impostos}
                    onChange={(v) => handleInputChange('valor_divida_impostos', v)}
                    placeholder="R$ 0,00"
                    className="w-full max-w-xs px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              )}

              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.divida_particular}
                    onChange={(e) => handleInputChange('divida_particular', e.target.checked)}
                    className="w-5 h-5 text-primary border-border rounded"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    Possui dívidas particulares (leasing, financiamentos, empréstimos)?
                  </span>
                </label>
                {formData.divida_particular && (
                  <div className="pl-8 mt-3">
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Valor total
                    </label>
                    <CurrencyInput
                      value={formData.valor_divida_particular}
                      onChange={(v) => handleInputChange('valor_divida_particular', v)}
                      placeholder="R$ 0,00"
                      className="w-full max-w-xs px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                )}
              </div>

              {/* Campos premium qualitativos (Bronze+) */}
              <div
                className={`border-t-2 pt-6 mt-6 relative ${!hasActivePlan ? 'pointer-events-none' : ''}`}
              >
                {!hasActivePlan && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-10 rounded-xl flex items-center justify-center pointer-events-auto">
                    <div className="bg-card border-2 border-primary rounded-xl p-6 max-w-sm text-center shadow-xl">
                      <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Dados de Qualidade do Negócio
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Disponível nos planos Bronze, Silver e Gold. Enriquece o valuation.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(
                            businessId
                              ? `/planos?source=valuation_fields_locked&businessId=${businessId}`
                              : '/planos'
                          );
                        }}
                        className="px-5 py-2 bg-primary text-white rounded-xl font-semibold"
                      >
                        Ver Planos
                      </button>
                    </div>
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Qualidade do Negócio{' '}
                  {hasActivePlan && (
                    <span className="text-sm font-normal text-primary ml-2">
                      (Incluído no plano {planType?.toUpperCase()})
                    </span>
                  )}
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: '% da receita que é recorrente (contratos, assinaturas)',
                      field: 'receita_recorrente' as const,
                      options: RECEITA_RECORRENTE,
                    },
                    {
                      label: 'Os 3 maiores clientes representam quanto da receita?',
                      field: 'concentracao_clientes' as const,
                      options: CONCENTRACAO_CLIENTES,
                    },
                    {
                      label: 'Tendência do faturamento nos últimos 12 meses',
                      field: 'tendencia_crescimento' as const,
                      options: TENDENCIA_CRESCIMENTO,
                    },
                    {
                      label: 'Contratos firmados com prazo superior a 12 meses?',
                      field: 'contratos_longo_prazo' as const,
                      options: CONTRATOS_LONGO_PRAZO,
                    },
                    {
                      label: 'A empresa opera normalmente sem você por quanto tempo?',
                      field: 'dependencia_proprietario' as const,
                      options: DEPENDENCIA_PROPRIETARIO,
                    },
                  ].map(({ label, field, options }) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {label}
                      </label>
                      <select
                        value={formData[field]}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        disabled={!hasActivePlan}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary disabled:bg-secondary disabled:cursor-not-allowed text-foreground bg-input"
                      >
                        <option value="">Selecione...</option>
                        {options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Análise do Vendedor ── */}
          {currentStepKey === 'vendedor' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Análise & Parecer do Vendedor
              </h2>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Quanto você acha que vale o seu negócio?
                </label>
                <textarea
                  value={formData.valuation_vendedor}
                  onChange={(e) => handleInputChange('valuation_vendedor', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  rows={3}
                  placeholder="Descreva sua avaliação..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Por que quer vender?
                </label>
                <textarea
                  value={formData.motivacao_venda}
                  onChange={(e) => handleInputChange('motivacao_venda', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  rows={3}
                  placeholder="Compartilhe suas motivações..."
                />
              </div>

              {/* Publicação no Marketplace */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-foreground mb-3">
                  Visibilidade no Marketplace
                </h3>
                <div
                  onClick={() => handleInputChange('is_public', !formData.is_public)}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex items-start gap-4 ${
                    formData.is_public
                      ? 'border-[#00A9E0] bg-[#00A9E0]/5'
                      : 'border-border bg-background hover:border-border/70'
                  }`}
                >
                  <div
                    className={`mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                      formData.is_public ? 'bg-[#00A9E0] border-[#00A9E0]' : 'border-border'
                    }`}
                  >
                    {formData.is_public && (
                      <svg viewBox="0 0 12 10" className="w-3 h-3 text-white" fill="none">
                        <path
                          d="M1 5l3.5 3.5L11 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {formData.is_public ? (
                        <Store className="w-5 h-5 text-[#00A9E0]" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span
                        className={`font-semibold text-sm ${formData.is_public ? 'text-[#00A9E0]' : 'text-foreground'}`}
                      >
                        {formData.is_public
                          ? 'Empresa visível no Marketplace público'
                          : 'Empresa privada (não aparece no Marketplace)'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_public
                        ? 'Compradores cadastrados poderão encontrar e visualizar sua empresa. O endereço completo permanece oculto.'
                        : 'Sua empresa ficará salva no sistema, mas não será exibida para compradores no Marketplace.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Financeiro Detalhado (Fase 2 — Silver/Gold) ── */}
          {currentStepKey === 'financeiro' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">Dados Financeiros Detalhados</h2>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full">
                  {planType?.toUpperCase()} — Fase 2
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                Esses dados são usados pela IA para calcular o <strong>Valuation Completo</strong>{' '}
                com maior precisão e múltiplas metodologias. EBITDA e Valor da Marca são opcionais.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Lucro Líquido — obrigatório */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Lucro Líquido Mensal <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (após impostos e despesas)
                    </span>
                  </label>
                  <CurrencyInput
                    value={formData.lucro_liquido_mensal}
                    onChange={(v) => handleInputChange('lucro_liquido_mensal', v)}
                    placeholder="R$ 0,00"
                    className={`w-full max-w-sm px-4 py-3 bg-input border rounded-xl focus:ring-2 focus:ring-primary text-foreground ${errors.lucro_liquido_mensal ? 'border-red-500' : 'border-border'}`}
                  />
                  {errors.lucro_liquido_mensal && (
                    <p className="mt-1 text-red-600 text-sm">{errors.lucro_liquido_mensal}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Faturamento Líquido Mensal{' '}
                    <span className="text-xs text-muted-foreground">
                      (após devoluções/cancelamentos)
                    </span>
                  </label>
                  <CurrencyInput
                    value={formData.faturamento_liquido_mensal}
                    onChange={(v) => handleInputChange('faturamento_liquido_mensal', v)}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Lucro Bruto Mensal{' '}
                    <span className="text-xs text-muted-foreground">
                      (antes de impostos/despesas administrativas)
                    </span>
                  </label>
                  <CurrencyInput
                    value={formData.lucro_bruto_mensal}
                    onChange={(v) => handleInputChange('lucro_bruto_mensal', v)}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Impostos Mensais (total)
                  </label>
                  <CurrencyInput
                    value={formData.impostos_mensais}
                    onChange={(v) => handleInputChange('impostos_mensais', v)}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    EBITDA Mensal{' '}
                    <span className="text-xs text-muted-foreground italic">(opcional)</span>
                  </label>
                  <CurrencyInput
                    value={formData.ebitda}
                    onChange={(v) => handleInputChange('ebitda', v)}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Nº de Clientes Ativos
                  </label>
                  <input
                    type="number"
                    value={formData.num_clientes_ativos}
                    onChange={(e) => handleInputChange('num_clientes_ativos', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Ex: 50"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Valor Estimado da Marca{' '}
                    <span className="text-xs text-muted-foreground italic">
                      (opcional — se você já tiver uma estimativa)
                    </span>
                  </label>
                  <CurrencyInput
                    value={formData.valor_marca}
                    onChange={(v) => handleInputChange('valor_marca', v)}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Investimentos em Andamento
                </label>
                <textarea
                  value={formData.investimentos_andamento}
                  onChange={(e) => handleInputChange('investimentos_andamento', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  rows={2}
                  placeholder="Ex: Expansão de loja, novo equipamento, software ERP..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Potencial de Crescimento
                </label>
                <textarea
                  value={formData.potencial_crescimento}
                  onChange={(e) => handleInputChange('potencial_crescimento', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  rows={2}
                  placeholder="Ex: Mercado em expansão, novo contrato assinado, oportunidade de franquia..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Descrição do Negócio
                </label>
                <textarea
                  value={formData.descricao_negocio}
                  onChange={(e) => handleInputChange('descricao_negocio', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  rows={3}
                  placeholder="Descreva o que a empresa faz, como opera e quem são seus clientes..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Diferencial Competitivo
                </label>
                <textarea
                  value={formData.diferencial_competitivo}
                  onChange={(e) => handleInputChange('diferencial_competitivo', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  rows={3}
                  placeholder="Ex: Marca reconhecida, exclusividade de produto, patente, localização privilegiada..."
                />
              </div>

              <p className="text-xs text-muted-foreground italic">
                * Valuation não constitui laudo oficial. A precisão depende da qualidade dos dados
                informados.
              </p>
            </div>
          )}

          {/* ── Comprador ── */}
          {currentStepKey === 'comprador' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Informações do Comprador</h2>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Capital destinado para a aquisição
                </label>
                <select
                  value={formData.capital_aquisicao}
                  onChange={(e) => handleInputChange('capital_aquisicao', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="">Selecione...</option>
                  {CAPITAL_AQUISICAO.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Tempo máximo para concretizar o negócio
                </label>
                <input
                  type="text"
                  value={formData.prazo_maximo}
                  onChange={(e) => handleInputChange('prazo_maximo', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="Ex: 6 meses, 1 ano..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Objetivos e desejos na aquisição
                </label>
                <textarea
                  value={formData.objetivos_compra}
                  onChange={(e) => handleInputChange('objetivos_compra', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  rows={3}
                  placeholder="Compartilhe seus objetivos..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Experiência como empreendedor
                </label>
                <textarea
                  value={formData.experiencia_empreendedor}
                  onChange={(e) => handleInputChange('experiencia_empreendedor', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  rows={3}
                  placeholder="Descreva sua trajetória..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Dedicação de tempo na empresa adquirida
                </label>
                <input
                  type="text"
                  value={formData.dedicacao_tempo}
                  onChange={(e) => handleInputChange('dedicacao_tempo', e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="Ex: Tempo integral, gestão apenas..."
                />
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start mt-6">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 text-foreground border border-border rounded-xl hover:bg-secondary disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" /> Voltar
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] font-semibold shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Salvando...' : 'Próximo'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Salvando...' : 'Salvar e Finalizar'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
