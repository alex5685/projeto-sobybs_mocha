import { useEffect, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
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
} from "lucide-react";

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

export default function AdminPanel() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
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

  useEffect(() => {
    if (profileLoading) {
      return;
    }
    
    if (!user) {
      navigate("/");
      return;
    }
    
    if (!profile || profile.user_type !== "admin") {
      navigate("/dashboard");
    }
  }, [user, profile, profileLoading, navigate]);

  useEffect(() => {
    if (profile?.user_type === "admin") {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, statsRes, teamRes, jobsRes, appsRes, servicesRes, faqsRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/stats"),
        fetch("/api/team/members/all"),
        fetch("/api/team/jobs/all"),
        fetch("/api/team/applications"),
        fetch("/api/admin/plan-services"),
        fetch("/api/admin/faqs"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamMembers(data.members);
      }

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobOpenings(data.jobs);
      }

      if (appsRes.ok) {
        const data = await appsRes.json();
        setJobApplications(data.applications);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setPlanServices(data.services);
      }

      if (faqsRes.ok) {
        const data = await faqsRes.json();
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
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
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        })
      );

      await Promise.all(updates);
      setEditedSettings({});
      await loadData();
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingValue = (setting: SystemSetting) => {
    return editedSettings[setting.setting_key] ?? setting.setting_value;
  };

  const handleSaveMember = async (member: Partial<TeamMember>) => {
    try {
      const url = member.id ? `/api/team/members/${member.id}` : "/api/team/members";
      const method = member.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });

      if (response.ok) {
        await loadData();
        setShowMemberModal(false);
        setEditingMember(null);
      } else {
        alert("Erro ao salvar membro do time");
      }
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Erro ao salvar membro do time");
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este membro?")) return;

    try {
      const response = await fetch(`/api/team/members/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
      } else {
        alert("Erro ao deletar membro");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Erro ao deletar membro");
    }
  };

  const handleSaveJob = async (job: Partial<JobOpening>) => {
    try {
      const url = job.id ? `/api/team/jobs/${job.id}` : "/api/team/jobs";
      const method = job.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });

      if (response.ok) {
        await loadData();
        setShowJobModal(false);
        setEditingJob(null);
      } else {
        alert("Erro ao salvar vaga");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Erro ao salvar vaga");
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta vaga?")) return;

    try {
      const response = await fetch(`/api/team/jobs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
      } else {
        alert("Erro ao deletar vaga");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Erro ao deletar vaga");
    }
  };

  const handleDownloadCV = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/team/applications/${applicationId}/cv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cv_${applicationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Erro ao baixar CV");
      }
    } catch (error) {
      console.error("Error downloading CV:", error);
      alert("Erro ao baixar CV");
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: number, status: string) => {
    try {
      const response = await fetch(`/api/team/applications/${applicationId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await loadData();
      } else {
        alert("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erro ao atualizar status");
    }
  };

  const handleSaveService = async (service: Partial<PlanService>) => {
    try {
      const url = service.id ? `/api/admin/plan-services/${service.id}` : "/api/admin/plan-services";
      const method = service.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });

      if (response.ok) {
        await loadData();
        setShowServiceModal(false);
        setEditingService(null);
      } else {
        alert("Erro ao salvar serviço");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Erro ao salvar serviço");
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este serviço?")) return;

    try {
      const response = await fetch(`/api/admin/plan-services/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
      } else {
        alert("Erro ao deletar serviço");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Erro ao deletar serviço");
    }
  };

  const handleSaveFaq = async (faq: Partial<FAQ>) => {
    try {
      const url = faq.id ? `/api/admin/faqs/${faq.id}` : "/api/admin/faqs";
      const method = faq.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faq),
      });

      if (response.ok) {
        await loadData();
        setShowFaqModal(false);
        setEditingFaq(null);
      } else {
        alert("Erro ao salvar FAQ");
      }
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Erro ao salvar FAQ");
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta pergunta?")) return;

    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
      } else {
        alert("Erro ao deletar FAQ");
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert("Erro ao deletar FAQ");
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

  if (!profile || profile.user_type !== "admin") {
    return null;
  }

  const commissionSettings = settings.filter((s) => s.category === "comissoes");
  const consultationPlanSettings = settings.filter((s) => s.category === "planos_consultoria");
  const additionalServiceSettings = settings.filter((s) => s.category === "servicos_adicionais");
  const institutionalSettings = settings.filter((s) => s.category === "institucional");
  const founderSettings = settings.filter((s) => s.setting_key.startsWith("institutional_founder"));
  const contactSettings = settings.filter((s) => s.category === "contatos");

  const bronzeServices = planServices.filter((s) => s.plan_name === "bronze");
  const silverServices = planServices.filter((s) => s.plan_name === "silver");
  const goldServices = planServices.filter((s) => s.plan_name === "gold");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-[#00A9E0]" />
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-gray-700 hover:text-[#00A9E0] transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "overview"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("commissions")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "commissions"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Comissões
            </button>
            <button
              onClick={() => setActiveTab("plans")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "plans"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Package className="w-5 h-5" />
              Planos de Consultoria
            </button>
            <button
              onClick={() => setActiveTab("plan-services")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "plan-services"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Package className="w-5 h-5" />
              Serviços dos Planos
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "services"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Serviços Adicionais
            </button>
            <button
              onClick={() => setActiveTab("institutional")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "institutional"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-5 h-5" />
              Institucional
            </button>
            <button
              onClick={() => setActiveTab("founder")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "founder"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <UserCircle className="w-5 h-5" />
              Founder
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "team"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <UsersRound className="w-5 h-5" />
              Time
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "jobs"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Vagas
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "contacts"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Phone className="w-5 h-5" />
              Contatos
            </button>
            <button
              onClick={() => setActiveTab("faqs")}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "faqs"
                  ? "text-[#00A9E0] border-b-2 border-[#00A9E0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              FAQ
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Estatísticas do Sistema</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                    <Users className="w-10 h-10 text-blue-600 mb-3" />
                    <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
                    <div className="text-sm text-gray-600">Total de Usuários</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <Building2 className="w-10 h-10 text-purple-600 mb-3" />
                    <div className="text-3xl font-bold text-gray-900">{stats.totalBusinesses}</div>
                    <div className="text-sm text-gray-600">Empresas Cadastradas</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <TrendingUp className="w-10 h-10 text-green-600 mb-3" />
                    <div className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</div>
                    <div className="text-sm text-gray-600">Assinaturas Ativas</div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
                    <DollarSign className="w-10 h-10 text-yellow-600 mb-3" />
                    <div className="text-3xl font-bold text-gray-900">
                      R$ {stats.monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-600">Receita Mensal Recorrente</div>
                  </div>
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
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Assinaturas por Plano</h3>
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
                    <p><strong>Receita Recorrente:</strong> Planos mensais de consultoria (Bronze, Silver, Gold) que cobrem captação e garimpagem de interessados</p>
                    <p><strong>Receita Variável:</strong> Comissões sobre o valor de fechamento das vendas de empresas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Commissions Tab */}
            {activeTab === "commissions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Comissões sobre Fechamento</h2>
                  <p className="text-gray-600">
                    Percentuais cobrados sobre o valor final da transação quando uma empresa é vendida.
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
                    <div key={setting.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {setting.description}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          value={getSettingValue(setting)}
                          onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
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
            {activeTab === "plans" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Planos de Consultoria</h2>
                  <p className="text-gray-600">
                    Valores mensais dos planos que cobrem o trabalho de captação e garimpagem de interessados (compradores e vendedores).
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
                    <div key={setting.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {setting.description}
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 font-medium">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={getSettingValue(setting)}
                          onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
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
            {activeTab === "plan-services" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Serviços dos Planos</h2>
                    <p className="text-gray-600">
                      Configure os serviços incluídos em cada plano de consultoria (Bronze, Silver e Gold).
                    </p>
                  </div>
                </div>

                {/* Bronze Plan Services */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Plano Bronze</h3>
                        <p className="text-sm text-gray-600">{bronzeServices.length} serviços</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingService({ plan_name: "bronze" } as PlanService);
                        setShowServiceModal(true);
                      }}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Serviço
                    </button>
                  </div>
                  <div className="space-y-2">
                    {bronzeServices.map((service) => (
                      <div key={service.id} className="bg-white rounded-lg p-4 flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-900">{service.service_description}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span>Ordem: {service.display_order}</span>
                            <span className={service.is_active ? "text-green-600" : "text-gray-400"}>
                              {service.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Silver Plan Services */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-300">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Plano Silver</h3>
                        <p className="text-sm text-gray-600">{silverServices.length} serviços</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingService({ plan_name: "silver" } as PlanService);
                        setShowServiceModal(true);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Serviço
                    </button>
                  </div>
                  <div className="space-y-2">
                    {silverServices.map((service) => (
                      <div key={service.id} className="bg-white rounded-lg p-4 flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-900">{service.service_description}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span>Ordem: {service.display_order}</span>
                            <span className={service.is_active ? "text-green-600" : "text-gray-400"}>
                              {service.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gold Plan Services */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-[#FFD700]">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-900" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Plano Gold</h3>
                        <p className="text-sm text-gray-600">{goldServices.length} serviços</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingService({ plan_name: "gold" } as PlanService);
                        setShowServiceModal(true);
                      }}
                      className="px-4 py-2 bg-[#FFD700] text-gray-900 rounded-lg hover:bg-[#FFC700] transition-colors font-semibold flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Serviço
                    </button>
                  </div>
                  <div className="space-y-2">
                    {goldServices.map((service) => (
                      <div key={service.id} className="bg-white rounded-lg p-4 flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-900">{service.service_description}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span>Ordem: {service.display_order}</span>
                            <span className={service.is_active ? "text-green-600" : "text-gray-400"}>
                              {service.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Dicas</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>Ordem de Exibição:</strong> Números menores aparecem primeiro na lista</p>
                    <p><strong>Status:</strong> Serviços inativos não aparecem na página pública de planos</p>
                    <p><strong>Descrição:</strong> Seja claro e específico sobre o que cada serviço oferece</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Services Tab */}
            {activeTab === "services" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Serviços Adicionais</h2>
                  <p className="text-gray-600">
                    Serviços opcionais cobrados separadamente para apoiar o processo de transação.
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
                    <div key={setting.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {setting.description}
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 font-medium">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={getSettingValue(setting)}
                          onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Institutional Tab */}
            {activeTab === "institutional" && (
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
                    <div key={setting.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {setting.description}
                      </label>
                      <textarea
                        value={getSettingValue(setting)}
                        onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Founder Tab */}
            {activeTab === "founder" && (
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
                    <div key={setting.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {setting.description}
                      </label>
                      {setting.setting_type === 'textarea' ? (
                        <textarea
                          value={getSettingValue(setting)}
                          onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={getSettingValue(setting)}
                          onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
                          placeholder={setting.setting_key.includes('photo') ? 'URL da foto (use Settings → Assets para upload)' : ''}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === "team" && (
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
                    <div key={member.id} className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                          <p className="text-blue-600 font-semibold">{member.role}</p>
                          {member.email && (
                            <p className="text-sm text-gray-600 mt-1">{member.email}</p>
                          )}
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
                        <span className={`px-3 py-1 rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
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
            {activeTab === "contacts" && (
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
                    <div key={setting.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {setting.description}
                      </label>
                      <input
                        type="text"
                        value={getSettingValue(setting)}
                        onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
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
                    <p><strong>WhatsApp:</strong> Inclua o código do país (exemplo: +55 11 99999-9999)</p>
                    <p><strong>Redes Sociais:</strong> Use URLs completas para melhor funcionamento dos links</p>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ Tab */}
            {activeTab === "faqs" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gerenciar Perguntas Frequentes</h2>
                    <p className="text-gray-600 mt-1">Configure as perguntas e respostas exibidas na página pública de FAQ</p>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma pergunta cadastrada</h3>
                      <p className="text-gray-600 mb-4">Adicione perguntas frequentes para ajudar seus clientes</p>
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
                      <div key={faq.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
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
                          <span className={`px-3 py-1 rounded-full ${faq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
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
                    <p><strong>Ordem de Exibição:</strong> Números menores aparecem primeiro na página pública</p>
                    <p><strong>Status:</strong> FAQs inativos não aparecem na página pública</p>
                    <p><strong>Perguntas Claras:</strong> Use perguntas diretas que seus clientes realmente fazem</p>
                    <p><strong>Respostas Concisas:</strong> Mantenha as respostas claras e objetivas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === "jobs" && (
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
                    <div key={job.id} className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                            {job.department && <span className="px-2 py-1 bg-blue-50 rounded">{job.department}</span>}
                            {job.location && <span className="px-2 py-1 bg-purple-50 rounded">{job.location}</span>}
                            {job.employment_type && <span className="px-2 py-1 bg-green-50 rounded">{job.employment_type}</span>}
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
                      <p className="text-sm text-gray-700 line-clamp-2 mb-3">{job.description}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {job.is_active ? 'Vaga Ativa' : 'Vaga Inativa'}
                      </span>
                      
                      {/* Applications for this job */}
                      {jobApplications.filter(app => app.job_opening_id === job.id).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Candidaturas ({jobApplications.filter(app => app.job_opening_id === job.id).length})
                          </h4>
                          <div className="space-y-2">
                            {jobApplications.filter(app => app.job_opening_id === job.id).map((app) => (
                              <div key={app.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-gray-900">{app.candidate_name}</p>
                                  <p className="text-xs text-gray-600">{app.candidate_email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={app.status}
                                    onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
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

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">URL da Foto</label>
            <input
              type="text"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              placeholder="Use Settings → Assets para fazer upload"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Ordem de Exibição</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
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
          <h3 className="text-2xl font-bold text-gray-900">
            {job ? 'Editar Vaga' : 'Nova Vaga'}
          </h3>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Ordem de Exibição</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
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

function ServiceModal({
  service,
  onSave,
  onClose,
}: {
  service: PlanService | null;
  onSave: (service: Partial<PlanService>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<PlanService>>(
    service || {
      plan_name: 'bronze',
      service_description: '',
      display_order: 0,
      is_active: 1,
    }
  );

  const planColors = {
    bronze: 'from-amber-600 to-amber-700',
    silver: 'from-gray-400 to-gray-500',
    gold: 'from-[#FFD700] to-[#FFC700]',
  };

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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Plano *</label>
            <select
              value={formData.plan_name}
              onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
              disabled={!!service?.id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
            {service?.id && (
              <p className="text-xs text-gray-500 mt-1">O plano não pode ser alterado após criação</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Descrição do Serviço *</label>
            <textarea
              rows={3}
              required
              value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              placeholder="Ex: 2 anúncios mensais destacados em jornais de grande circulação"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Ordem de Exibição</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
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

          {formData.plan_name && (
            <div className={`bg-gradient-to-r ${planColors[formData.plan_name as keyof typeof planColors]} rounded-xl p-4`}>
              <p className="text-white text-sm font-semibold mb-2">Preview do Plano {formData.plan_name.charAt(0).toUpperCase() + formData.plan_name.slice(1)}</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white text-sm">{formData.service_description || 'Digite uma descrição para visualizar'}</p>
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
            className="flex-1 px-6 py-3 bg-[#00A9E0] text-white rounded-lg font-semibold hover:bg-[#0098CC]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
