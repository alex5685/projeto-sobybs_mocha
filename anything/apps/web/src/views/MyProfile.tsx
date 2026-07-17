'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { useAuth } from '@/lib/auth-shim';
import useUpload from '@/utils/useUpload';
import { toast } from 'sonner';
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
  X,
  Camera,
  Key,
  Trash,
  AlertTriangle,
  Mail,
  Save,
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
  user_name: string;
  user_email: string;
  user_image: string | null;
  full_name: string;
  email: string;
}

export default function MyProfile() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formUserType, setFormUserType] = useState('basico');
  const [saving, setSaving] = useState(false);

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [upload] = useUpload();

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const profileRes = await fetch('/api/profiles/me');
        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as Profile;
          setProfile(profileData);
          // Carrega nome, foto e tipo DIRETO do banco (não da sessão em cache)
          setFormName(profileData?.user_name || '');
          setFormUserType(profileData?.user_type || 'basico');
          setPhotoPreview(profileData?.user_image || null);
        }

        const businessRes = await fetch('/api/business/my-businesses');
        if (businessRes.ok) {
          const data = (await businessRes.json()) as { businesses: Business[] };
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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas arquivos de imagem');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setUploadingPhoto(true);

    try {
      const result = await upload({ file });
      if (result.error || !result.url) {
        toast.error(result.error || 'Erro no upload');
        setPhotoPreview(profile?.user_image || null);
        return;
      }

      const res = await fetch('/api/profiles/me/upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: result.url }),
      });

      if (res.ok) {
        setPhotoPreview(result.url);
        // Atualiza profile local com nova imagem
        setProfile((prev) => (prev ? { ...prev, user_image: result.url! } : prev));
        toast.success('Foto atualizada com sucesso!');
      } else {
        toast.error('Erro ao salvar foto no servidor');
        setPhotoPreview(profile?.user_image || null);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao fazer upload da foto');
      setPhotoPreview(profile?.user_image || null);
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSaveChanges = async () => {
    if (!formName.trim()) {
      toast.error('O nome não pode estar em branco');
      return;
    }
    setSaving(true);
    try {
      // Salva nome direto na tabela user
      const nameRes = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: formName.trim() }),
      });

      // Salva tipo de perfil
      const typeRes = await fetch('/api/profiles/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_type: formUserType }),
      });

      if (nameRes.ok && typeRes.ok) {
        const nameData = (await nameRes.json()) as { name: string };
        const profileData = (await typeRes.json()) as Profile;

        // Atualiza estado local DIRETO das respostas da API (sem depender da sessão em cache)
        setFormName(nameData.name || formName.trim());
        setProfile({ ...profileData, user_name: nameData.name || formName.trim() });
        setFormUserType(profileData.user_type || formUserType);

        toast.success('Perfil atualizado com sucesso!');
      } else {
        if (!nameRes.ok) toast.error('Erro ao salvar nome');
        else if (!typeRes.ok) toast.error('Erro ao salvar tipo de perfil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/profiles/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.ok) {
        toast.success('Senha alterada com sucesso!');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETAR') {
      toast.error('Digite "DELETAR" para confirmar');
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/profiles/me/delete-account', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Conta deletada com sucesso');
        await logout();
        navigate('/');
      } else {
        toast.error('Erro ao deletar conta');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erro ao deletar conta');
    } finally {
      setDeletingAccount(false);
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
        const data = (await response.json()) as { is_public: number };
        setBusinesses((prev) =>
          prev.map((b) => (b.id === businessId ? { ...b, is_public: data.is_public } : b))
        );
      } else {
        toast.error('Erro ao atualizar status de publicação');
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Erro ao atualizar status de publicação');
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
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const isVendedor =
    profile?.user_type === 'vendedor' ||
    profile?.user_type === 'hibrido' ||
    profile?.user_type === 'admin';

  const avatarLetter = (formName || user?.email || '?')[0].toUpperCase();

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
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-8">Meu Perfil</h2>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Left — Photo + Form */}
            <div className="space-y-6">
              {/* Photo */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Foto de Perfil
                </label>
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Foto de perfil"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] flex items-center justify-center text-white text-3xl font-bold shadow-md">
                        {avatarLetter}
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handlePhotoSelect(e)}
                      disabled={uploadingPhoto}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg hover:from-[#0098CC] hover:to-[#00A9E0] transition-all font-semibold disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      {uploadingPhoto ? 'Enviando...' : 'Alterar Foto'}
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou GIF · máx. 5MB</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-sm font-semibold text-foreground mb-2"
                >
                  Nome Completo
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent transition"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">E-mail</label>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {profile?.user_email || profile?.email || user?.email || '—'}
                  </span>
                </div>
              </div>

              {/* User Type */}
              {profile?.user_type !== 'admin' && (
                <div>
                  <label
                    htmlFor="profile-type"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Tipo de Perfil
                  </label>
                  <select
                    id="profile-type"
                    value={formUserType}
                    onChange={(e) => setFormUserType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent transition bg-white"
                  >
                    <option value="basico">Básico</option>
                    <option value="comprador">Comprador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="hibrido">Híbrido (Comprador + Vendedor)</option>
                  </select>
                </div>
              )}

              {profile?.user_type === 'admin' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Tipo de Perfil
                  </label>
                  <div className="px-4 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg font-semibold">
                    {getUserTypeLabel(profile.user_type)}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                type="button"
                onClick={() => void handleSaveChanges()}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl font-bold text-base hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>

            {/* Right — Account Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Ações da Conta</h3>

              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center gap-4 px-4 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Trocar Senha</div>
                  <div className="text-sm text-muted-foreground">Altere sua senha de acesso</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-4 px-4 py-4 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors text-left group"
              >
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <Trash className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-semibold text-red-600">Deletar Conta</div>
                  <div className="text-sm text-red-400">Remove permanentemente sua conta</div>
                </div>
              </button>

              {isVendedor && (
                <div className="pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => navigate('/business-registration')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nova Empresa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Businesses Section */}
        {isVendedor && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Minhas Empresas</h2>
              <span className="text-muted-foreground text-sm">
                {businesses.length}{' '}
                {businesses.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
              </span>
            </div>

            {businesses.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl shadow-xl p-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhuma empresa cadastrada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Comece cadastrando sua primeira empresa para oferecer ao mercado
                </p>
                <button
                  onClick={() => navigate('/business-registration')}
                  className="px-8 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl font-semibold inline-flex items-center gap-2 shadow hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Cadastrar Empresa
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
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                            {business.alias_name || business.ramo_atividade}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {business.segmento}
                          </p>
                        </div>
                        <div className="ml-2 shrink-0">
                          {getStatusBadge(business.status_workflow)}
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        {business.cidade && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">
                              {business.cidade}, {business.pais || 'Brasil'}
                            </span>
                          </div>
                        )}
                        {business.faturamento_mensal && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">{business.faturamento_mensal}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2 shrink-0" />
                          <span>Cadastrado em {formatDate(business.created_at)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => void togglePublishStatus(business.id, business.is_public)}
                          disabled={publishingId === business.id}
                          className={`w-full px-4 py-2 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 border-2 ${
                            business.is_public === 1
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {publishingId === business.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Atualizando...
                            </>
                          ) : business.is_public === 1 ? (
                            <>
                              <Globe className="w-4 h-4" />
                              Publicada no Marketplace
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              Clique para Publicar
                            </>
                          )}
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/business/${business.id}`)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1 hover:from-[#0098CC] hover:to-[#00A9E0] transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </button>
                          <button
                            onClick={() => navigate(`/valuation?business=${business.id}`)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm"
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

        {/* Compradores */}
        {!isVendedor && (
          <div className="bg-card border border-border rounded-2xl shadow-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Empresas de Interesse</h3>
            <p className="text-muted-foreground mb-6">
              Em breve você poderá visualizar as empresas que demonstrou interesse
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-8 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl font-semibold shadow hover:shadow-lg transition-all"
            >
              Explorar Marketplace
            </button>
          </div>
        )}
      </main>

      {/* ── Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Trocar Senha</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9E0]"
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9E0]"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9E0]"
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handlePasswordChange()}
                disabled={changingPassword}
                className="flex-1 px-6 py-3 bg-[#00A9E0] text-white rounded-lg font-semibold hover:bg-[#0098CC] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Deletar Conta</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Ação irreversível!</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Todos os seus dados serão permanentemente deletados</li>
                  <li>Suas empresas cadastradas serão removidas</li>
                  <li>Não será possível recuperar a conta</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Digite <span className="font-mono text-red-600">DELETAR</span> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="DELETAR"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDeleteAccount()}
                disabled={deletingAccount || deleteConfirmText !== 'DELETAR'}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4" />
                    Deletar Conta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
