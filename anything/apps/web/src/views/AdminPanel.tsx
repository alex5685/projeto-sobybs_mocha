'use client';

import { useEffect, useState, useRef, useId } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-shim';
import { useNavigate } from '@/lib/router-shim';
import { useProfile } from '../hooks/useProfile';
import useUpload from '@/utils/useUpload';
import {
  Settings,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  Building2,
  Loader2,
  Save,
  Briefcase,
  Package,
  UserCircle,
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  Download,
  X,
  Phone,
  HelpCircle,
  Upload,
  TableProperties,
  FolderOpen,
  FileSpreadsheet,
  Image,
  File,
  Search,
  AlertTriangle,
  CreditCard,
  Filter,
  Globe,
} from 'lucide-react';

import AdminFinanceiro from './admin/FinanceiroTab';
import AdminFunil from './admin/FunilTab';
import AdminAssinaturas from './admin/AssinaturasTab';
import AdminRelatorios from './admin/RelatoriosTab';
import AdminVisitantes from './admin/VisitantesTab';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// ─── Category helpers ────────────────────────────────────────────────────────
const SERVICE_CATEGORIES = [
  {
    key: 'geral',
    label: 'Serviços Gerais',
    prefix: '',
    icon: '🏢',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    key: 'due_diligence',
    label: 'Due Diligence do Comprador (CPF/CNPJ)',
    prefix: '[Due Diligence do Comprador]',
    icon: '🔍',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  {
    key: 'documentacao',
    label: 'Documentação da Empresa',
    prefix: '[Documentação da Empresa]',
    icon: '📋',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
];

function parseSvcCategory(desc: string): { key: string; label: string; text: string } {
  for (const cat of SERVICE_CATEGORIES) {
    if (cat.prefix && desc.startsWith(cat.prefix)) {
      return { key: cat.key, label: cat.label, text: desc.replace(cat.prefix, '').trim() };
    }
  }
  return { key: 'geral', label: 'Serviços Gerais', text: desc };
}

function groupServicesByCategory(services: PlanService[]) {
  const result: Record<string, PlanService[]> = { geral: [], due_diligence: [], documentacao: [] };
  for (const s of services) {
    const { key } = parseSvcCategory(s.service_description);
    result[key].push(s);
  }
  return result;
}
// ─────────────────────────────────────────────────────────────────────────────

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
  category: string;
}

interface Stats {
  totalUsers: number;
  totalBusinesses: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  usersByType: Array<{ user_type: string; count: number }>;
  subscriptionsByPlan: Array<{ plan_type: string; count: number }>;
  commissionsThisMonth?: number;
  totalExpenses?: number;
  forecastData?: Array<{ period: string; label: string; value: number }>;
  expiringSubscriptions?: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    plan_type: string;
    expires_at: string;
  }>;
  funnelData?: Array<{ stage: string; count: number }>;
  monthlyRevenueChart?: Array<{ month: string; recorrente: number; comissoes: number }>;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio?: string;
  photo_url?: string;
  email?: string;
  display_order: number;
  is_active: number;
}

interface JobOpening {
  id: number;
  title: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description: string;
  requirements?: string;
  is_active: number;
}

interface JobApplication {
  id: number;
  job_opening_id: number;
  job_title: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  cover_letter?: string;
  status: string;
  created_at: string;
}

interface PlanService {
  id: number;
  plan_name: string;
  service_description: string;
  display_order: number;
  is_active: number;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  display_order: number;
  is_active: number;
}

interface ComparisonRow {
  id: number;
  section: string;
  row_type: string;
  label: string;
  bronze_value: string;
  silver_value: string;
  gold_value: string;
  display_order: number;
  is_active: number;
}

interface AdminDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  category: string;
  description: string | null;
  owner_name: string | null;
  owner_email: string | null;
  business_name: string | null;
  created_at: string;
}

function AdminFileIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext)) return <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />;
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />;
  if (['doc', 'docx'].includes(ext))
    return <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />;
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext))
    return <Image className="w-5 h-5 text-purple-500 flex-shrink-0" />;
  return <File className="w-5 h-5 text-gray-500 flex-shrink-0" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DOC_CATEGORIES = [
  { key: '', label: 'Todos' },
  { key: 'certidao', label: '📜 Certidões' },
  { key: 'declaracao', label: '📋 Declarações' },
  { key: 'contrato', label: '🤝 Contratos' },
  { key: 'planilha', label: '📊 Planilhas' },
  { key: 'relatorio', label: '📈 Relatórios' },
  { key: 'outros', label: '📎 Outros' },
];

function formatDocDate(dateStr: string): string {
  if (!dateStr) return '';
  const datePart = dateStr.split('T')[0] ?? dateStr;
  const parts = datePart.split('-');
  if (parts.length < 3) return datePart;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ─── Reusable image upload field with preview ────────────────────────────────
function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [upload, { loading }] = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas arquivos de imagem (JPG, PNG, WEBP)');
      return;
    }
    const result = await upload({ file });
    if (result.error) {
      toast.error(`Erro no upload: ${result.error}`);
    } else if (result.url) {
      onChange(result.url);
      toast.success('Foto enviada com sucesso!');
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow"
            title="Remover foto"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {/* Upload button */}
      <div className="flex gap-2 items-center flex-wrap">
        <input
          ref={inputRef}
          id={uid}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
        <label
          htmlFor={uid}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm font-medium ${
            loading
              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
              : 'border-[#00A9E0] text-[#00A9E0] hover:bg-[#00A9E0]/5'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? 'Enviando...' : value ? 'Trocar foto' : 'Fazer upload de foto'}
        </label>
        {!value && <span className="text-gray-400 text-xs">ou cole uma URL abaixo</span>}
      </div>
      {/* URL input fallback */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
        placeholder="https://ucarecdn.com/..."
      />
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user, isPending: authPending } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [planServices, setPlanServices] = useState<PlanService[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  const [editingService, setEditingService] = useState<PlanService | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [editingComparisonRow, setEditingComparisonRow] = useState<ComparisonRow | null>(null);
  const [servicePlanFilter, setServicePlanFilter] = useState<'bronze' | 'silver' | 'gold'>(
    'bronze'
  );
  const [adminDocuments, setAdminDocuments] = useState<AdminDocument[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Group tabs into sections for sidebar
  const navGroups = [
    {
      label: 'Dashboard',
      items: [{ key: 'overview', label: 'Visão Geral', icon: <TrendingUp className="w-4 h-4" /> }],
    },
    {
      label: 'Análise',
      items: [
        { key: 'financeiro', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
        { key: 'funil', label: 'Funil de Conversão', icon: <Filter className="w-4 h-4" /> },
        { key: 'assinaturas', label: 'Assinaturas', icon: <CreditCard className="w-4 h-4" /> },
        {
          key: 'relatorios',
          label: 'Relatórios & Ranking',
          icon: <FileText className="w-4 h-4" />,
        },
        {
          key: 'visitantes',
          label: 'Visitantes',
          icon: <Globe className="w-4 h-4" />,
        },
      ],
    },
    {
      label: 'Configurações',
      items: [
        { key: 'commissions', label: 'Comissões', icon: <DollarSign className="w-4 h-4" /> },
        { key: 'plans', label: 'Planos de Consultoria', icon: <Package className="w-4 h-4" /> },
        { key: 'services', label: 'Serviços Adicionais', icon: <Briefcase className="w-4 h-4" /> },
        { key: 'contacts', label: 'Contatos', icon: <Phone className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Planos',
      items: [
        {
          key: 'plan-services',
          label: 'Serviços dos Planos',
          icon: <Package className="w-4 h-4" />,
        },
        {
          key: 'comparison',
          label: 'Comparação Detalhada',
          icon: <TableProperties className="w-4 h-4" />,
        },
      ],
    },
    {
      label: 'Conteúdo',
      items: [
        { key: 'institutional', label: 'Institucional', icon: <FileText className="w-4 h-4" /> },
        { key: 'founder', label: 'Founder', icon: <UserCircle className="w-4 h-4" /> },
        { key: 'faqs', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Equipe',
      items: [
        { key: 'team', label: 'Time', icon: <UsersRound className="w-4 h-4" /> },
        { key: 'jobs', label: 'Vagas', icon: <Briefcase className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Dados',
      items: [{ key: 'documents', label: 'Documentos', icon: <FolderOpen className="w-4 h-4" /> }],
    },
  ];

  const activeTabLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.key === activeTab)?.label ?? '';

  useEffect(() => {
    if (authPending || profileLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    if (!profile || profile.user_type !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authPending, profile, profileLoading, navigate]);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, statsRes, teamRes, jobsRes, appsRes, servicesRes, faqsRes, compRes] =
        await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/stats'),
          fetch('/api/team/members/all'),
          fetch('/api/team/jobs/all'),
          fetch('/api/team/applications'),
          fetch('/api/admin/plan-services'),
          fetch('/api/admin/faqs'),
          fetch('/api/admin/comparison-rows'),
        ]);

      if (settingsRes.ok) {
        const data = (await settingsRes.json()) as { settings: SystemSetting[] };
        setSettings(data.settings);
      }

      if (statsRes.ok) {
        const data = (await statsRes.json()) as { stats: Stats };
        setStats(data.stats);
      }

      if (teamRes.ok) {
        const data = (await teamRes.json()) as { members: TeamMember[] };
        setTeamMembers(data.members);
      }

      if (jobsRes.ok) {
        const data = (await jobsRes.json()) as { jobs: JobOpening[] };
        setJobOpenings(data.jobs);
      }

      if (appsRes.ok) {
        const data = (await appsRes.json()) as { applications: JobApplication[] };
        setJobApplications(data.applications);
      }

      if (servicesRes.ok) {
        const data = (await servicesRes.json()) as { services: PlanService[] };
        setPlanServices(data.services);
      }

      if (faqsRes.ok) {
        const data = (await faqsRes.json()) as { faqs: FAQ[] };
        setFaqs(data.faqs);
      }

      if (compRes.ok) {
        const data = (await compRes.json()) as { rows: ComparisonRow[] };
        setComparisonRows(data.rows);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const updates = Object.entries(editedSettings).map(([key, value]) =>
        fetch(`/api/admin/settings/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        })
      );

      const results = await Promise.all(updates);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error('Erro ao salvar algumas configurações');
        return;
      }

      // Update local settings state directly to avoid concurrent session requests
      setSettings((prev) =>
        prev.map((s) => {
          const newValue = editedSettings[s.setting_key];
          if (newValue !== undefined) {
            return { ...s, setting_value: newValue };
          }
          return s;
        })
      );
      setEditedSettings({});
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingValue = (setting: SystemSetting) => {
    return editedSettings[setting.setting_key] ?? setting.setting_value;
  };

  const handleSaveMember = async (member: Partial<TeamMember>) => {
    try {
      const url = member.id ? `/api/team/members/${member.id}` : '/api/team/members';
      const method = member.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });

      if (response.ok) {
        await loadData();
        setShowMemberModal(false);
        setEditingMember(null);
      } else {
        toast.error('Erro ao salvar membro do time');
      }
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Erro ao salvar membro do time');
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este membro?')) return;

    try {
      const response = await fetch(`/api/team/members/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        toast.error('Erro ao deletar membro');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Erro ao deletar membro');
    }
  };

  const handleSaveJob = async (job: Partial<JobOpening>) => {
    try {
      const url = job.id ? `/api/team/jobs/${job.id}` : '/api/team/jobs';
      const method = job.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });

      if (response.ok) {
        await loadData();
        setShowJobModal(false);
        setEditingJob(null);
      } else {
        toast.error('Erro ao salvar vaga');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Erro ao salvar vaga');
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta vaga?')) return;

    try {
      const response = await fetch(`/api/team/jobs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        toast.error('Erro ao deletar vaga');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Erro ao deletar vaga');
    }
  };

  const handleDownloadCV = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/team/applications/${applicationId}/cv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cv_${applicationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Erro ao baixar CV');
      }
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Erro ao baixar CV');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: number, status: string) => {
    try {
      const response = await fetch(`/api/team/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await loadData();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleSaveService = async (service: Partial<PlanService>) => {
    try {
      const url = service.id
        ? `/api/admin/plan-services/${service.id}`
        : '/api/admin/plan-services';
      const method = service.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });

      if (response.ok) {
        await loadData();
        setShowServiceModal(false);
        setEditingService(null);
      } else {
        toast.error('Erro ao salvar serviço');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erro ao salvar serviço');
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este serviço?')) return;

    try {
      const response = await fetch(`/api/admin/plan-services/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        toast.error('Erro ao deletar serviço');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao deletar serviço');
    }
  };

  const handleSaveFaq = async (faq: Partial<FAQ>) => {
    try {
      const url = faq.id ? `/api/admin/faqs/${faq.id}` : '/api/admin/faqs';
      const method = faq.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });

      if (response.ok) {
        await loadData();
        setShowFaqModal(false);
        setEditingFaq(null);
      } else {
        toast.error('Erro ao salvar FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Erro ao salvar FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta pergunta?')) return;

    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        toast.error('Erro ao deletar FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Erro ao deletar FAQ');
    }
  };

  const handleSaveComparisonRow = async (row: Partial<ComparisonRow>) => {
    try {
      const url = row.id ? `/api/admin/comparison-rows/${row.id}` : '/api/admin/comparison-rows';
      const method = row.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
      if (response.ok) {
        await loadData();
        setShowComparisonModal(false);
        setEditingComparisonRow(null);
        toast.success('Linha salva com sucesso!');
      } else {
        toast.error('Erro ao salvar linha');
      }
    } catch (error) {
      console.error('Error saving comparison row:', error);
      toast.error('Erro ao salvar linha');
    }
  };

  const handleDeleteComparisonRow = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta linha?')) return;
    try {
      const response = await fetch(`/api/admin/comparison-rows/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadData();
        toast.success('Linha removida!');
      } else {
        toast.error('Erro ao deletar linha');
      }
    } catch (error) {
      console.error('Error deleting comparison row:', error);
      toast.error('Erro ao deletar linha');
    }
  };

  const loadAdminDocuments = async () => {
    setDocLoading(true);
    try {
      const params = new URLSearchParams();
      if (docSearch) params.set('search', docSearch);
      if (docCategoryFilter) params.set('category', docCategoryFilter);
      const res = await fetch(`/api/admin/documents?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { documents: AdminDocument[] };
        setAdminDocuments(data.documents);
      }
    } catch (err) {
      console.error('Error loading admin documents:', err);
      toast.error('Erro ao carregar documentos');
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteAdminDoc = async (id: string, fileName: string) => {
    if (!confirm(`Excluir "${fileName}"?`)) return;
    setDeletingDocId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Documento excluído');
        setAdminDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        toast.error('Erro ao excluir documento');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir documento');
    } finally {
      setDeletingDocId(null);
    }
  };

  if (profileLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.user_type !== 'admin') return null;

  const commissionSettings = settings.filter((s) => s.category === 'comissoes');
  const consultationPlanSettings = settings.filter((s) => s.category === 'planos_consultoria');
  const additionalServiceSettings = settings.filter((s) => s.category === 'servicos_adicionais');
  const institutionalSettings = settings.filter(
    (s) => s.category === 'institucional' && !s.setting_key.startsWith('institutional_founder')
  );
  const founderSettings = settings.filter((s) => s.setting_key.startsWith('institutional_founder'));
  const contactSettings = settings.filter((s) => s.category === 'contatos');

  const bronzeServices = planServices.filter(
    (s) => s.plan_name === 'bronze' || s.plan_name === 'Bronze'
  );
  const silverServices = planServices.filter(
    (s) => s.plan_name === 'silver' || s.plan_name === 'Silver'
  );
  const goldServices = planServices.filter((s) => s.plan_name === 'gold' || s.plan_name === 'Gold');

  const planConfigs = {
    bronze: {
      label: 'Bronze',
      emoji: '🥉',
      services: bronzeServices,
      headerColor: 'from-amber-600 to-amber-700',
      borderColor: 'border-amber-200',
      bgColor: 'from-amber-50 to-orange-50',
      btnColor: 'bg-amber-600 hover:bg-amber-700',
    },
    silver: {
      label: 'Silver',
      emoji: '🥈',
      services: silverServices,
      headerColor: 'from-gray-400 to-gray-500',
      borderColor: 'border-gray-300',
      bgColor: 'from-gray-50 to-slate-50',
      btnColor: 'bg-gray-600 hover:bg-gray-700',
    },
    gold: {
      label: 'Gold',
      emoji: '🥇',
      services: goldServices,
      headerColor: 'from-[#FFD700] to-[#FFC700]',
      borderColor: 'border-[#FFD700]',
      bgColor: 'from-yellow-50 to-amber-50',
      btnColor: 'bg-[#FFD700] hover:bg-[#FFC700] text-gray-900',
    },
  };

  const activePlanConfig = planConfigs[servicePlanFilter];
  const groupedServices = groupServicesByCategory(activePlanConfig.services);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
              </button>
              <Settings className="w-7 h-7 text-[#00A9E0] hidden lg:block" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-xs text-gray-500 hidden sm:block">{activeTabLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="hidden sm:block text-sm font-semibold text-gray-700">
                  {user.given_name || user.name || user.email}
                </span>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-gray-700 hover:text-[#00A9E0] text-sm font-medium transition-colors"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 relative">
          {/* Sidebar overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
              w-64 bg-white border-r border-gray-200 lg:border lg:rounded-xl lg:shadow-sm
              flex flex-col overflow-y-auto
              transition-transform duration-200 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              lg:flex-shrink-0 lg:h-fit lg:sticky lg:top-24
            `}
          >
            {/* Sidebar header (mobile only) */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden">
              <span className="font-bold text-gray-900 text-sm">Menu Admin</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Nav groups */}
            <nav className="p-3 space-y-1">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 py-2 mt-2">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setActiveTab(item.key);
                          if (item.key === 'documents') loadAdminDocuments();
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-[#00A9E0] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <span className={isActive ? 'text-white' : 'text-gray-400'}>
                          {item.icon}
                        </span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-gray-100 mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Settings className="w-3.5 h-3.5" />
                <span>Sobybs Admin v2</span>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Estatísticas do Sistema</h2>

                    {/* Primary KPI cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                        <Users className="w-10 h-10 text-blue-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
                        <div className="text-sm text-gray-600">Total de Usuários</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                        <Building2 className="w-10 h-10 text-purple-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-900">
                          {stats.totalBusinesses}
                        </div>
                        <div className="text-sm text-gray-600">Empresas Cadastradas</div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                        <TrendingUp className="w-10 h-10 text-green-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-900">
                          {stats.activeSubscriptions}
                        </div>
                        <div className="text-sm text-gray-600">Assinaturas Ativas</div>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
                        <DollarSign className="w-10 h-10 text-yellow-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-900">
                          R${' '}
                          {stats.monthlyRevenue.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-sm text-gray-600">Receita Mensal Recorrente</div>
                      </div>
                    </div>

                    {/* Commissions card */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                        <DollarSign className="w-8 h-8 text-emerald-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          R${' '}
                          {(stats.commissionsThisMonth ?? 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-sm text-gray-600">Comissões Recebidas (mês)</div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
                        <CreditCard className="w-8 h-8 text-red-500 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          R${' '}
                          {(stats.totalExpenses ?? 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-sm text-gray-600">Despesas Totais (mês)</div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-6 border border-indigo-100">
                        <TrendingUp className="w-8 h-8 text-indigo-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          R${' '}
                          {(
                            stats.monthlyRevenue +
                            (stats.commissionsThisMonth ?? 0) -
                            (stats.totalExpenses ?? 0)
                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-600">Margem Líquida (mês)</div>
                      </div>
                    </div>

                    {/* Forecast cards */}
                    {stats.forecastData && stats.forecastData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">
                          📈 Previsão de Faturamento
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {stats.forecastData.map((fc) => (
                            <div
                              key={fc.period}
                              className="bg-white rounded-xl p-4 border border-gray-200 text-center"
                            >
                              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                {fc.label}
                              </div>
                              <div className="text-xl font-bold text-gray-900">
                                R$ {fc.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expiring subscriptions alert */}
                    {stats.expiringSubscriptions && stats.expiringSubscriptions.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <h3 className="text-lg font-bold text-amber-900">
                            Assinaturas Expirando em Breve
                          </h3>
                          <span className="ml-auto text-sm font-semibold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                            {stats.expiringSubscriptions.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {stats.expiringSubscriptions.map((sub) => (
                            <div
                              key={sub.user_id}
                              className="bg-white rounded-lg p-3 flex items-center justify-between border border-amber-100"
                            >
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {sub.user_name}
                                </p>
                                <p className="text-xs text-gray-500">{sub.user_email}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full capitalize">
                                  {sub.plan_type}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  Expira: {formatDocDate(sub.expires_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mini funnel + Revenue chart side by side */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Mini funnel */}
                      {stats.funnelData && stats.funnelData.length > 0 && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">🔄 Funil do Mês</h3>
                          <div className="space-y-3">
                            {stats.funnelData.map((stage, idx) => {
                              const maxCount = Math.max(
                                ...stats.funnelData!.map((s) => s.count),
                                1
                              );
                              const pct = Math.round((stage.count / maxCount) * 100);
                              const colors = [
                                'bg-blue-500',
                                'bg-cyan-500',
                                'bg-green-500',
                                'bg-emerald-500',
                              ];
                              return (
                                <div key={stage.stage}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 font-medium">{stage.stage}</span>
                                    <span className="font-bold text-gray-900">{stage.count}</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div
                                      className={`h-3 rounded-full ${colors[idx % colors.length]} transition-all`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Monthly revenue chart */}
                      {stats.monthlyRevenueChart && stats.monthlyRevenueChart.length > 0 && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">
                            📊 Receita Mensal
                          </h3>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats.monthlyRevenueChart}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <ReTooltip
                                formatter={(value: number) =>
                                  [
                                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                    '',
                                  ] as [string, string]
                                }
                              />
                              <Legend />
                              <Bar
                                dataKey="recorrente"
                                name="Recorrente"
                                stackId="a"
                                fill="#00A9E0"
                                radius={[0, 0, 0, 0]}
                              />
                              <Bar
                                dataKey="comissoes"
                                name="Comissões"
                                stackId="a"
                                fill="#10B981"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Usuários por Tipo</h3>
                        <div className="space-y-3">
                          {stats.usersByType.map((item) => (
                            <div key={item.user_type} className="flex justify-between items-center">
                              <span className="text-gray-700 capitalize">{item.user_type}</span>
                              <span className="font-semibold text-gray-900">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Assinaturas por Plano
                        </h3>
                        <div className="space-y-3">
                          {stats.subscriptionsByPlan.map((item) => (
                            <div key={item.plan_type} className="flex justify-between items-center">
                              <span className="text-gray-700 capitalize">{item.plan_type}</span>
                              <span className="font-semibold text-gray-900">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
                      <h3 className="text-lg font-bold text-blue-900 mb-2">Modelo de Receita</h3>
                      <div className="text-sm text-blue-800 space-y-2">
                        <p>
                          <strong>Receita Recorrente:</strong> Planos mensais de consultoria
                          (Bronze, Silver, Gold) que cobrem captação e garimpagem de interessados
                        </p>
                        <p>
                          <strong>Receita Variável:</strong> Comissões sobre o valor de fechamento
                          das vendas de empresas
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financeiro Tab */}
                {activeTab === 'financeiro' && <AdminFinanceiro />}

                {/* Funil Tab */}
                {activeTab === 'funil' && <AdminFunil />}

                {/* Assinaturas Tab */}
                {activeTab === 'assinaturas' && <AdminAssinaturas />}

                {/* Relatórios & Ranking Tab */}
                {activeTab === 'relatorios' && <AdminRelatorios />}

                {/* Visitantes Tab */}
                {activeTab === 'visitantes' && <AdminVisitantes />}

                {/* Commissions Tab */}
                {activeTab === 'commissions' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Comissões sobre Fechamento
                      </h2>
                      <p className="text-gray-600">
                        Percentuais cobrados sobre o valor final da transação quando uma empresa é
                        vendida.
                      </p>
                    </div>

                    {Object.keys(editedSettings).length > 0 && (
                      <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        Salvar Alterações
                      </button>
                    )}

                    <div className="space-y-4">
                      {commissionSettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {setting.description}
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="0.1"
                              value={getSettingValue(setting)}
                              onChange={(e) =>
                                handleSettingChange(setting.setting_key, e.target.value)
                              }
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                            />
                            <span className="text-gray-600 font-medium">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consultation Plans Tab */}
                {activeTab === 'plans' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Planos de Consultoria
                      </h2>
                      <p className="text-gray-600">
                        Valores mensais dos planos que cobrem o trabalho de captação e garimpagem de
                        interessados (compradores e vendedores).
                      </p>
                    </div>

                    {Object.keys(editedSettings).length > 0 && (
                      <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        Salvar Alterações
                      </button>
                    )}

                    <div className="space-y-4">
                      {consultationPlanSettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {setting.description}
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-medium">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={getSettingValue(setting)}
                              onChange={(e) =>
                                handleSettingChange(setting.setting_key, e.target.value)
                              }
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                            />
                            <span className="text-gray-600 text-sm">/mês</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan Services Tab */}
                {activeTab === 'plan-services' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                          Gerenciar Serviços dos Planos
                        </h2>
                        <p className="text-gray-600">
                          Configure os serviços e certidões incluídos em cada plano — organizados
                          por categoria.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingService({ plan_name: servicePlanFilter } as PlanService);
                          setShowServiceModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] font-semibold flex items-center gap-2 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Adicionar Serviço
                      </button>
                    </div>

                    {/* Plan selector tabs */}
                    <div className="flex gap-2 flex-wrap">
                      {(['bronze', 'silver', 'gold'] as const).map((p) => {
                        const pc = planConfigs[p];
                        const isActive = servicePlanFilter === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setServicePlanFilter(p)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-2 flex items-center gap-2 ${isActive ? `bg-gradient-to-r ${pc.headerColor} text-white border-transparent shadow-md` : `bg-white ${pc.borderColor} text-gray-700 hover:shadow`}`}
                          >
                            {pc.emoji} {pc.label}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/30' : 'bg-gray-100'}`}
                            >
                              {pc.services.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Category sections for active plan */}
                    <div className="space-y-6">
                      {SERVICE_CATEGORIES.map((cat) => {
                        const items = groupedServices[cat.key] ?? [];
                        return (
                          <div key={cat.key} className={`rounded-2xl border-2 p-5 ${cat.color}`}>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-lg">{cat.icon}</span>
                              <h3 className="text-lg font-bold">{cat.label}</h3>
                              <span className="ml-auto text-sm font-semibold px-2 py-0.5 bg-white/60 rounded-full">
                                {items.length} {items.length === 1 ? 'serviço' : 'serviços'}
                              </span>
                            </div>
                            {items.length === 0 ? (
                              <p className="text-sm opacity-60 italic text-center py-4">
                                Nenhum serviço nesta categoria
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {items.map((service) => {
                                  const { text } = parseSvcCategory(service.service_description);
                                  return (
                                    <div
                                      key={service.id}
                                      className="bg-white rounded-xl p-4 flex justify-between items-start shadow-sm"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 font-medium text-sm">{text}</p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                          <span>Ordem: {service.display_order}</span>
                                          <span
                                            className={
                                              service.is_active
                                                ? 'text-green-600 font-semibold'
                                                : 'text-gray-400'
                                            }
                                          >
                                            {service.is_active ? '● Ativo' : '○ Inativo'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex gap-1 ml-3 flex-shrink-0">
                                        <button
                                          onClick={() => {
                                            setEditingService(service);
                                            setShowServiceModal(true);
                                          }}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Editar"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteService(service.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-blue-900 mb-2">💡 Dicas</h3>
                      <div className="text-xs text-blue-800 space-y-1">
                        <p>
                          <strong>Categoria:</strong> Ao criar um serviço, escolha a categoria para
                          ele aparecer no grupo correto na página de planos
                        </p>
                        <p>
                          <strong>Ordem:</strong> Números menores aparecem primeiro dentro de cada
                          categoria
                        </p>
                        <p>
                          <strong>Status:</strong> Serviços inativos não aparecem na página pública
                        </p>
                        <p>
                          <strong>Certidões:</strong> As certidões nos planos seguem a progressão
                          Bronze → Silver → Gold em nível de profundidade
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparison Tab */}
                {activeTab === 'comparison' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                          Comparação Detalhada dos Planos
                        </h2>
                        <p className="text-gray-600">
                          Gerencie as linhas da tabela comparativa exibida na página de planos.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingComparisonRow(null);
                          setShowComparisonModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] font-semibold flex items-center gap-2 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Adicionar Linha
                      </button>
                    </div>

                    {(['geral', 'certidoes'] as const).map((sec) => {
                      const secRows = comparisonRows.filter((r) => r.section === sec);
                      const secLabel =
                        sec === 'geral' ? '🏢 Serviços Gerais' : '🔍 Due Diligence & Documentação';
                      const secColor =
                        sec === 'geral'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-purple-50 border-purple-200 text-purple-800';
                      return (
                        <div key={sec} className={`rounded-2xl border-2 p-5 ${secColor}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">{secLabel}</h3>
                            <span className="text-sm font-semibold px-2 py-0.5 bg-white/60 rounded-full">
                              {secRows.length} {secRows.length === 1 ? 'linha' : 'linhas'}
                            </span>
                          </div>

                          <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-gray-100">
                                  <th className="text-left py-2 px-3 text-gray-500 font-semibold w-2/5">
                                    Descrição
                                  </th>
                                  <th className="text-center py-2 px-2 text-amber-700 font-bold">
                                    🥉
                                  </th>
                                  <th className="text-center py-2 px-2 text-gray-500 font-bold">
                                    🥈
                                  </th>
                                  <th className="text-center py-2 px-2 text-yellow-600 font-bold">
                                    🥇
                                  </th>
                                  <th className="text-center py-2 px-2 text-gray-400 font-semibold">
                                    Tipo
                                  </th>
                                  <th className="text-center py-2 px-2 text-gray-400 font-semibold">
                                    Status
                                  </th>
                                  <th className="py-2 px-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {secRows.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="py-6 text-center text-gray-400 italic"
                                    >
                                      Nenhuma linha nesta seção
                                    </td>
                                  </tr>
                                ) : (
                                  secRows.map((row) => (
                                    <tr
                                      key={row.id}
                                      className="border-t border-gray-50 hover:bg-gray-50"
                                    >
                                      <td className="py-2 px-3 text-gray-900 font-medium">
                                        {row.label}
                                      </td>
                                      <td className="text-center py-2 px-2 text-gray-600">
                                        {row.bronze_value || '—'}
                                      </td>
                                      <td className="text-center py-2 px-2 text-gray-600">
                                        {row.silver_value || '—'}
                                      </td>
                                      <td className="text-center py-2 px-2 text-gray-600">
                                        {row.gold_value || '—'}
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-xs font-semibold ${row.row_type === 'level' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                          {row.row_type === 'level' ? 'Badge' : 'Item'}
                                        </span>
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-xs font-semibold ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                          {row.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2">
                                        <div className="flex gap-1 justify-end">
                                          <button
                                            onClick={() => {
                                              setEditingComparisonRow(row);
                                              setShowComparisonModal(true);
                                            }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteComparisonRow(row.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-blue-900 mb-2">💡 Dicas</h3>
                      <div className="text-xs text-blue-800 space-y-1">
                        <p>
                          <strong>Tipo "Item":</strong> Exibe "check" (✓), "—" (vazio) ou texto
                          livre como valor
                        </p>
                        <p>
                          <strong>Tipo "Badge":</strong> Exibe o valor como um badge colorido (ex:
                          "Básico", "Intermediário", "Completo")
                        </p>
                        <p>
                          <strong>Valor "check":</strong> Digite exatamente{' '}
                          <code className="bg-white px-1 rounded">check</code> para exibir o ícone ✓
                        </p>
                        <p>
                          <strong>Valor vazio:</strong> Deixe em branco para exibir "—"
                        </p>
                        <p>
                          <strong>Ordem:</strong> Números menores aparecem primeiro dentro de cada
                          seção
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        Documentos dos Usuários
                      </h2>
                      <p className="text-gray-600">
                        Visualize, filtre e gerencie todos os documentos enviados pelos usuários.
                      </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={docSearch}
                          onChange={(e) => setDocSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && loadAdminDocuments()}
                          placeholder="Buscar por nome, usuário ou descrição..."
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                        />
                      </div>
                      <select
                        value={docCategoryFilter}
                        onChange={(e) => setDocCategoryFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                      >
                        {DOC_CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={loadAdminDocuments}
                        disabled={docLoading}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl font-semibold hover:from-[#0098CC] hover:to-[#00A9E0] disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {docLoading ? (
                          <Loader2 className="w-4 h-4" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        Buscar
                      </button>
                    </div>

                    {/* Stats */}
                    {adminDocuments.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          {
                            label: 'Total',
                            value: adminDocuments.length,
                            color: 'bg-blue-50 text-blue-700 border-blue-200',
                          },
                          {
                            label: 'PDF',
                            value: adminDocuments.filter((d) =>
                              d.file_name.toLowerCase().endsWith('.pdf')
                            ).length,
                            color: 'bg-red-50 text-red-700 border-red-200',
                          },
                          {
                            label: 'Excel/CSV',
                            value: adminDocuments.filter((d) => /\.(xlsx?|csv)$/i.test(d.file_name))
                              .length,
                            color: 'bg-green-50 text-green-700 border-green-200',
                          },
                          {
                            label: 'Outros',
                            value: adminDocuments.filter(
                              (d) => !/\.(pdf|xlsx?|csv)$/i.test(d.file_name)
                            ).length,
                            color: 'bg-gray-50 text-gray-700 border-gray-200',
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className={`rounded-xl border p-3 text-center ${stat.color}`}
                          >
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-xs font-semibold">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Document list */}
                    {docLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#00A9E0] animate-spin" />
                      </div>
                    ) : adminDocuments.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">Nenhum documento encontrado</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Use os filtros acima e clique em "Buscar"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {adminDocuments.map((doc) => {
                          const catInfo = DOC_CATEGORIES.find((c) => c.key === doc.category);
                          return (
                            <div
                              key={doc.id}
                              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <AdminFileIcon fileName={doc.file_name} />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="font-semibold text-gray-900 text-sm truncate"
                                    title={doc.file_name}
                                  >
                                    {doc.file_name}
                                  </p>
                                  {doc.description && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {doc.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-1.5">
                                    {catInfo?.key && (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {catInfo.label}
                                      </span>
                                    )}
                                    {doc.business_name && (
                                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> {doc.business_name}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                      {formatFileSize(doc.file_size)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="sm:text-right text-xs text-gray-500 flex-shrink-0 min-w-[140px]">
                                <p className="font-semibold text-gray-700">
                                  {doc.owner_name ?? 'Usuário desconhecido'}
                                </p>
                                <p className="text-gray-400">{doc.owner_email}</p>
                                <p className="text-gray-400 mt-0.5">
                                  {formatDocDate(doc.created_at)}
                                </p>
                              </div>

                              <div className="flex gap-2 flex-shrink-0">
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={doc.file_name}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-[#00A9E0] text-white rounded-lg text-sm font-medium hover:bg-[#0098CC] transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Baixar
                                </a>
                                <button
                                  onClick={() => handleDeleteAdminDoc(doc.id, doc.file_name)}
                                  disabled={deletingDocId === doc.id}
                                  className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                  title="Excluir"
                                >
                                  {deletingDocId === doc.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                      <strong>Nota de Privacidade:</strong> Os documentos são armazenados via CDN
                      seguro. Apenas você (admin) e o próprio usuário têm acesso aos links.
                    </div>
                  </div>
                )}

                {/* Additional Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Serviços Adicionais</h2>
                      <p className="text-gray-600">
                        Serviços opcionais cobrados separadamente para apoiar o processo de
                        transação.
                      </p>
                    </div>

                    {Object.keys(editedSettings).length > 0 && (
                      <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        Salvar Alterações
                      </button>
                    )}

                    <div className="space-y-4">
                      {additionalServiceSettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {setting.description}
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-medium">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={getSettingValue(setting)}
                              onChange={(e) =>
                                handleSettingChange(setting.setting_key, e.target.value)
                              }
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Institutional Tab */}
                {activeTab === 'institutional' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">Mensagens Institucionais</h2>
                      {Object.keys(editedSettings).length > 0 && (
                        <button
                          onClick={saveSettings}
                          disabled={isSaving}
                          className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                          Salvar Alterações
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {institutionalSettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {setting.description}
                          </label>
                          {setting.setting_key.includes('photo') ? (
                            <ImageUploadField
                              value={getSettingValue(setting)}
                              onChange={(url) => handleSettingChange(setting.setting_key, url)}
                            />
                          ) : setting.setting_type === 'textarea' ? (
                            <textarea
                              value={getSettingValue(setting)}
                              onChange={(e) =>
                                handleSettingChange(setting.setting_key, e.target.value)
                              }
                              rows={4}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent resize-none"
                            />
                          ) : (
                            <input
                              type="text"
                              value={getSettingValue(setting)}
                              onChange={(e) =>
                                handleSettingChange(setting.setting_key, e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Founder Tab */}
                {activeTab === 'founder' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">Informações do Founder</h2>
                      {Object.keys(editedSettings).length > 0 && (
                        <button
                          onClick={saveSettings}
                          disabled={isSaving}
                          className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                          Salvar Alterações
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {founderSettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {setting.description}
                          </label>
                          {setting.setting_type === 'textarea' ? (
                            <textarea
                              value={getSettingValue(setting)}
                              onChange={(e) =>
                                handleSettingChange(setting.setting_key, e.target.value)
                              }
                              rows={4}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent resize-none"
                            />
                          ) : setting.setting_key.includes('photo') ? (
                            <ImageUploadField
                              value={getSettingValue(setting)}
                              onChange={(url) => handleSettingChange(setting.setting_key, url)}
                            />
                          ) : (
                            <input
                              type="text"
                              value={getSettingValue(setting)}
                              onChange={(e) =>
                                handleSettingChange(setting.setting_key, e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Tab */}
                {activeTab === 'team' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">Gerenciar Time</h2>
                      <button
                        onClick={() => {
                          setEditingMember(null);
                          setShowMemberModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Adicionar Membro
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="bg-white rounded-xl p-6 border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              {/* Photo thumbnail */}
                              {member.photo_url ? (
                                <img
                                  src={member.photo_url}
                                  alt={member.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <UserCircle className="w-7 h-7 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                                <p className="text-blue-600 font-semibold">{member.role}</p>
                                {member.email && (
                                  <p className="text-sm text-gray-600 mt-1">{member.email}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setShowMemberModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {member.bio && (
                            <p className="text-sm text-gray-700 line-clamp-3">{member.bio}</p>
                          )}
                          <div className="flex items-center gap-4 mt-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                            >
                              {member.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="text-gray-600">Ordem: {member.display_order}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">Informações de Contato</h2>
                      {Object.keys(editedSettings).length > 0 && (
                        <button
                          onClick={saveSettings}
                          disabled={isSaving}
                          className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                          Salvar Alterações
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {contactSettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {setting.description}
                          </label>
                          <input
                            type="text"
                            value={getSettingValue(setting)}
                            onChange={(e) =>
                              handleSettingChange(setting.setting_key, e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                            placeholder={
                              setting.setting_key === 'contact_whatsapp'
                                ? '+55 11 99999-9999'
                                : setting.setting_key === 'contact_email'
                                  ? 'contato@sobybs.com'
                                  : setting.setting_key === 'contact_linkedin'
                                    ? 'https://linkedin.com/company/sobybs'
                                    : setting.setting_key === 'contact_instagram'
                                      ? 'https://instagram.com/sobybs'
                                      : ''
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
                      <h3 className="text-lg font-bold text-blue-900 mb-2">Dicas</h3>
                      <div className="text-sm text-blue-800 space-y-2">
                        <p>
                          <strong>WhatsApp:</strong> Inclua o código do país (exemplo: +55 11
                          99999-9999)
                        </p>
                        <p>
                          <strong>Redes Sociais:</strong> Use URLs completas para melhor
                          funcionamento dos links
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* FAQ Tab */}
                {activeTab === 'faqs' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Gerenciar Perguntas Frequentes
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Configure as perguntas e respostas exibidas na página pública de FAQ
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingFaq(null);
                          setShowFaqModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Nova Pergunta
                      </button>
                    </div>

                    <div className="space-y-3">
                      {faqs.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
                          <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma pergunta cadastrada
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Adicione perguntas frequentes para ajudar seus clientes
                          </p>
                          <button
                            onClick={() => {
                              setEditingFaq(null);
                              setShowFaqModal(true);
                            }}
                            className="px-6 py-3 bg-[#00A9E0] text-white rounded-lg font-semibold hover:bg-[#0098CC] inline-flex items-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            Adicionar Primeira Pergunta
                          </button>
                        </div>
                      ) : (
                        faqs.map((faq) => (
                          <div
                            key={faq.id}
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                  {faq.question}
                                </h3>
                                <p className="text-gray-700">{faq.answer}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => {
                                    setEditingFaq(faq);
                                    setShowFaqModal(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFaq(faq.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Deletar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full ${faq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                              >
                                {faq.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                              <span className="text-gray-600">Ordem: {faq.display_order}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-blue-900 mb-2">Dicas</h3>
                      <div className="text-sm text-blue-800 space-y-2">
                        <p>
                          <strong>Ordem de Exibição:</strong> Números menores aparecem primeiro na
                          página pública
                        </p>
                        <p>
                          <strong>Status:</strong> FAQs inativos não aparecem na página pública
                        </p>
                        <p>
                          <strong>Perguntas Claras:</strong> Use perguntas diretas que seus clientes
                          realmente fazem
                        </p>
                        <p>
                          <strong>Respostas Concisas:</strong> Mantenha as respostas claras e
                          objetivas
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Jobs Tab */}
                {activeTab === 'jobs' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">Gerenciar Vagas</h2>
                      <button
                        onClick={() => {
                          setEditingJob(null);
                          setShowJobModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Nova Vaga
                      </button>
                    </div>

                    <div className="space-y-4">
                      {jobOpenings.map((job) => (
                        <div
                          key={job.id}
                          className="bg-white rounded-xl p-6 border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                              <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                                {job.department && (
                                  <span className="px-2 py-1 bg-blue-50 rounded">
                                    {job.department}
                                  </span>
                                )}
                                {job.location && (
                                  <span className="px-2 py-1 bg-purple-50 rounded">
                                    {job.location}
                                  </span>
                                )}
                                {job.employment_type && (
                                  <span className="px-2 py-1 bg-green-50 rounded">
                                    {job.employment_type}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingJob(job);
                                  setShowJobModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                            {job.description}
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                          >
                            {job.is_active ? 'Vaga Ativa' : 'Vaga Inativa'}
                          </span>

                          {/* Applications for this job */}
                          {jobApplications.filter((app) => app.job_opening_id === job.id).length >
                            0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-2">
                                Candidaturas (
                                {
                                  jobApplications.filter((app) => app.job_opening_id === job.id)
                                    .length
                                }
                                )
                              </h4>
                              <div className="space-y-2">
                                {jobApplications
                                  .filter((app) => app.job_opening_id === job.id)
                                  .map((app) => (
                                    <div
                                      key={app.id}
                                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                    >
                                      <div className="flex-1">
                                        <p className="font-semibold text-sm text-gray-900">
                                          {app.candidate_name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {app.candidate_email}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {(() => {
                                            const d =
                                              (app.created_at ?? '').split('T')[0]?.split('-') ??
                                              [];
                                            return d.length === 3
                                              ? `${d[2]}/${d[1]}/${d[0]}`
                                              : app.created_at;
                                          })()}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={app.status}
                                          onChange={(e) =>
                                            handleUpdateApplicationStatus(app.id, e.target.value)
                                          }
                                          className="text-sm px-2 py-1 border border-gray-300 rounded"
                                        >
                                          <option value="pending">Pendente</option>
                                          <option value="reviewing">Em análise</option>
                                          <option value="approved">Aprovado</option>
                                          <option value="rejected">Rejeitado</option>
                                        </select>
                                        <button
                                          onClick={() => handleDownloadCV(app.id)}
                                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Team Member Modal */}
      {showMemberModal && (
        <TeamMemberModal
          member={editingMember}
          onSave={handleSaveMember}
          onClose={() => {
            setShowMemberModal(false);
            setEditingMember(null);
          }}
        />
      )}

      {/* Job Modal */}
      {showJobModal && (
        <JobModal
          job={editingJob}
          onSave={handleSaveJob}
          onClose={() => {
            setShowJobModal(false);
            setEditingJob(null);
          }}
        />
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <ServiceModal
          service={editingService}
          onSave={handleSaveService}
          onClose={() => {
            setShowServiceModal(false);
            setEditingService(null);
          }}
        />
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <FAQModal
          faq={editingFaq}
          onSave={handleSaveFaq}
          onClose={() => {
            setShowFaqModal(false);
            setEditingFaq(null);
          }}
        />
      )}

      {/* Comparison Row Modal */}
      {showComparisonModal && (
        <ComparisonRowModal
          row={editingComparisonRow}
          onSave={handleSaveComparisonRow}
          onClose={() => {
            setShowComparisonModal(false);
            setEditingComparisonRow(null);
          }}
        />
      )}
    </div>
  );
}

function TeamMemberModal({
  member,
  onSave,
  onClose,
}: {
  member: TeamMember | null;
  onSave: (member: Partial<TeamMember>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<TeamMember>>(
    member || {
      name: '',
      role: '',
      bio: '',
      photo_url: '',
      email: '',
      display_order: 0,
      is_active: 1,
    }
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {member ? 'Editar Membro' : 'Novo Membro'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nome *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Cargo *</label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Foto do Membro</label>
            <ImageUploadField
              value={formData.photo_url ?? ''}
              onChange={(url) => setFormData({ ...formData, photo_url: url })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
              <select
                value={formData.is_active ? 1 : 0}
                onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 px-6 py-3 bg-[#00A9E0] text-white rounded-lg font-semibold hover:bg-[#0098CC]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function JobModal({
  job,
  onSave,
  onClose,
}: {
  job: JobOpening | null;
  onSave: (job: Partial<JobOpening>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<JobOpening>>(
    job || {
      title: '',
      department: '',
      location: '',
      employment_type: '',
      description: '',
      requirements: '',
      is_active: 1,
    }
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{job ? 'Editar Vaga' : 'Nova Vaga'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Título *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Departamento</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Localização</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo</label>
              <input
                type="text"
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                placeholder="CLT, PJ, etc"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Descrição *</label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Requisitos</label>
            <textarea
              rows={3}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
            <select
              value={formData.is_active ? 1 : 0}
              onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            >
              <option value={1}>Vaga Ativa</option>
              <option value={0}>Vaga Inativa</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 px-6 py-3 bg-[#00A9E0] text-white rounded-lg font-semibold hover:bg-[#0098CC]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function FAQModal({
  faq,
  onSave,
  onClose,
}: {
  faq: FAQ | null;
  onSave: (faq: Partial<FAQ>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<FAQ>>(
    faq || {
      question: '',
      answer: '',
      display_order: 0,
      is_active: 1,
    }
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {faq?.id ? 'Editar Pergunta' : 'Nova Pergunta'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Pergunta *</label>
            <input
              type="text"
              required
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              placeholder="Ex: Posso cancelar a qualquer momento?"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Resposta *</label>
            <textarea
              rows={4}
              required
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              placeholder="Digite uma resposta clara e objetiva"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Números menores aparecem primeiro</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
              <select
                value={formData.is_active ? 1 : 0}
                onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </div>

          {formData.question && formData.answer && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2 font-semibold">PREVIEW</p>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">{formData.question}</h4>
                <p className="text-gray-700 text-sm">{formData.answer}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.question || !formData.answer}
            className="flex-1 px-6 py-3 bg-[#00A9E0] text-white rounded-lg font-semibold hover:bg-[#0098CC] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function ComparisonRowModal({
  row,
  onSave,
  onClose,
}: {
  row: ComparisonRow | null;
  onSave: (row: Partial<ComparisonRow>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<ComparisonRow>>(
    row || {
      section: 'geral',
      row_type: 'feature',
      label: '',
      bronze_value: '',
      silver_value: '',
      gold_value: '',
      display_order: 0,
      is_active: 1,
    }
  );

  const valueHint =
    formData.row_type === 'level'
      ? 'Ex: Básico, Intermediário, Completo ou deixe vazio'
      : 'Use "check" para ✓, deixe vazio para —, ou texto livre';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {row?.id ? 'Editar Linha' : 'Nova Linha de Comparação'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Seção *</label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              >
                <option value="geral">🏢 Serviços Gerais</option>
                <option value="certidoes">🔍 Due Diligence & Documentação</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tipo de Linha *
              </label>
              <select
                value={formData.row_type}
                onChange={(e) => setFormData({ ...formData, row_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              >
                <option value="feature">Item (check / texto / —)</option>
                <option value="level">Badge (nível colorido)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Descrição / Label *
            </label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              placeholder="Ex: Certidão de Protestos"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold mb-3">Valores por Plano</p>
            <p className="text-xs text-gray-500 mb-3 italic">{valueHint}</p>
            <div className="grid grid-cols-3 gap-3">
              {(['bronze', 'silver', 'gold'] as const).map((plan) => {
                const emojis = { bronze: '🥉', silver: '🥈', gold: '🥇' };
                const fieldKey = `${plan}_value` as keyof typeof formData;
                return (
                  <div key={plan}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {emojis[plan]} {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </label>
                    <input
                      type="text"
                      value={(formData[fieldKey] as string) ?? ''}
                      onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                      placeholder={formData.row_type === 'level' ? 'Básico' : 'check ou texto'}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
              <select
                value={formData.is_active ? 1 : 0}
                onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.label?.trim()}
            className="flex-1 px-6 py-3 bg-[#00A9E0] text-white rounded-lg font-semibold hover:bg-[#0098CC] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service Modal (with Category selector) ───────────────────────────────────
function ServiceModal({
  service,
  onSave,
  onClose,
}: {
  service: PlanService | null;
  onSave: (service: Partial<PlanService>) => void;
  onClose: () => void;
}) {
  const existingCategory = service?.id
    ? parseSvcCategory(service.service_description ?? '').key
    : 'geral';
  const existingText = service?.id ? parseSvcCategory(service.service_description ?? '').text : '';

  const [selectedCategory, setSelectedCategory] = useState(existingCategory);
  const [serviceText, setServiceText] = useState(existingText);
  const [formData, setFormData] = useState<Partial<PlanService>>(
    service || { plan_name: 'bronze', service_description: '', display_order: 0, is_active: 1 }
  );

  const buildDescription = (cat: string, text: string) => {
    const catConf = SERVICE_CATEGORIES.find((c) => c.key === cat);
    return catConf?.prefix ? `${catConf.prefix} ${text}` : text;
  };

  const handleSave = () => {
    const fullDescription = buildDescription(selectedCategory, serviceText);
    onSave({ ...formData, service_description: fullDescription });
  };

  const planColors: Record<string, string> = {
    bronze: 'from-amber-600 to-amber-700',
    silver: 'from-gray-400 to-gray-500',
    gold: 'from-[#FFD700] to-[#FFC700]',
  };

  const catConf = SERVICE_CATEGORIES.find((c) => c.key === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {service?.id ? 'Editar Serviço' : 'Novo Serviço'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-5">
          {/* Plan selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Plano *</label>
            <select
              value={formData.plan_name}
              onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
              disabled={!!service?.id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="bronze">🥉 Bronze</option>
              <option value="silver">🥈 Silver</option>
              <option value="gold">🥇 Gold</option>
            </select>
            {service?.id && (
              <p className="text-xs text-gray-500 mt-1">
                O plano não pode ser alterado após criação
              </p>
            )}
          </div>

          {/* Category selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Categoria *</label>
            <div className="grid gap-2">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${selectedCategory === cat.key ? `${cat.color} border-current font-semibold` : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{cat.label}</p>
                    {cat.prefix && <p className="text-xs opacity-60">{cat.prefix}</p>}
                  </div>
                  {selectedCategory === cat.key && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Service description (just the text, prefix added automatically) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Descrição do Serviço *
            </label>
            {catConf?.prefix && (
              <div
                className={`text-xs px-3 py-1.5 rounded-md mb-2 font-mono ${catConf.color} border`}
              >
                Prefixo automático: {catConf.prefix}
              </div>
            )}
            <textarea
              rows={3}
              required
              value={serviceText}
              onChange={(e) => setServiceText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              placeholder={
                selectedCategory === 'due_diligence'
                  ? 'Ex: Certidão de Protestos (cartórios da cidade)'
                  : selectedCategory === 'documentacao'
                    ? 'Ex: Certidão Conjunta RFB/PGFN'
                    : 'Ex: 2 anúncios mensais em portais especializados'
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
              <select
                value={formData.is_active ? 1 : 0}
                onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          {serviceText && (
            <div
              className={`bg-gradient-to-r ${planColors[formData.plan_name as string] ?? planColors.bronze} rounded-xl p-4`}
            >
              <p className="text-white text-xs font-semibold mb-2 opacity-80">
                PREVIEW — como vai aparecer
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2">
                <span className="text-white text-sm">✓</span>
                <p className="text-white text-sm">{serviceText}</p>
              </div>
              <p className="text-white text-xs opacity-60 mt-2">Categoria: {catConf?.label}</p>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!serviceText.trim()}
            className="flex-1 px-6 py-3 bg-[#00A9E0] text-white rounded-lg font-semibold hover:bg-[#0098CC] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
