'use client';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@/lib/router-shim';
import useUpload from '@/utils/useUpload';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  Image,
  Download,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  Plus,
  CheckCircle2,
  Building2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  category: string;
  description: string | null;
  business_id: string | null;
  business_name?: string | null;
  created_at: string;
}

interface Business {
  id: string;
  alias_name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'todos', label: 'Todos', emoji: '📁' },
  { key: 'certidao', label: 'Certidões', emoji: '📜' },
  { key: 'declaracao', label: 'Declarações', emoji: '📋' },
  { key: 'contrato', label: 'Contratos', emoji: '🤝' },
  { key: 'planilha', label: 'Planilhas', emoji: '📊' },
  { key: 'relatorio', label: 'Relatórios', emoji: '📈' },
  { key: 'outros', label: 'Outros', emoji: '📎' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.zip';
const MAX_SIZE_MB = 25;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T');
  const datePart = parts[0] ?? '';
  const timePart = parts[1]?.slice(0, 5) ?? '';
  const dateSections = datePart.split('-');
  if (dateSections.length < 3) return datePart;
  const formatted = `${dateSections[2]}/${dateSections[1]}/${dateSections[0]}`;
  return timePart ? `${formatted} ${timePart}` : formatted;
}

function FileIcon({ fileName, size = 'md' }: { fileName: string; size?: 'sm' | 'md' | 'lg' }) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';

  if (['pdf'].includes(ext)) return <FileText className={`${sizeClass} text-red-500`} />;
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <FileSpreadsheet className={`${sizeClass} text-green-600`} />;
  if (['doc', 'docx'].includes(ext)) return <FileText className={`${sizeClass} text-blue-600`} />;
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext))
    return <Image className={`${sizeClass} text-purple-500`} />;
  if (['zip', 'rar'].includes(ext)) return <File className={`${sizeClass} text-yellow-600`} />;
  return <FileText className={`${sizeClass} text-gray-500`} />;
}

function FileTypeBadge({ fileName }: { fileName: string }) {
  const ext = fileName.split('.').pop()?.toUpperCase() ?? 'FILE';
  const colors: Record<string, string> = {
    PDF: 'bg-red-100 text-red-700',
    XLS: 'bg-green-100 text-green-700',
    XLSX: 'bg-green-100 text-green-700',
    CSV: 'bg-green-100 text-green-700',
    DOC: 'bg-blue-100 text-blue-700',
    DOCX: 'bg-blue-100 text-blue-700',
    JPG: 'bg-purple-100 text-purple-700',
    JPEG: 'bg-purple-100 text-purple-700',
    PNG: 'bg-purple-100 text-purple-700',
    ZIP: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span
      className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors[ext] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {ext}
    </span>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({
  businesses,
  onClose,
  onSuccess,
}: {
  businesses: Business[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [upload, { loading: uploading }] = useUpload();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('outros');
  const [description, setDescription] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB`);
      return;
    }
    setSelectedFile(file);
    // Auto-detect category
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (['xls', 'xlsx', 'csv'].includes(ext)) setCategory('planilha');
    else if (['pdf'].includes(ext)) setCategory('outros');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const { url, error } = await upload({ file: selectedFile });
      if (error || !url) {
        toast.error(error ?? 'Erro no upload');
        return;
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: selectedFile.name,
          file_url: url,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          category,
          description: description.trim() || null,
          business_id: businessId || null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? 'Erro ao salvar documento');
        return;
      }

      toast.success('Documento enviado com sucesso!');
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isLoading = uploading || saving;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Enviar Documento</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              PDF, Excel, Word, Imagem — até {MAX_SIZE_MB}MB
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-[#00A9E0] bg-[#00A9E0]/5'
                : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-[#00A9E0] hover:bg-blue-50/30'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !selectedFile && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_TYPES}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900 break-all">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-semibold">
                  Arraste o arquivo ou clique para selecionar
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  PDF, Excel (.xlsx/.csv), Word, JPG, PNG, ZIP
                </p>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria *</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.filter((c) => c.key !== 'todos').map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    category === cat.key
                      ? 'border-[#00A9E0] bg-[#00A9E0]/10 text-[#00A9E0]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              placeholder="Ex: Certidão Negativa de Débitos — Empresa X"
              maxLength={200}
            />
          </div>

          {/* Business link */}
          {businesses.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Vincular a uma empresa <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
              >
                <option value="">— Documento pessoal (sem empresa) —</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.alias_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isLoading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-lg font-semibold hover:from-[#0098CC] hover:to-[#00A9E0] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Enviar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('todos');
  const [search, setSearch] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
    fetchBusinesses();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profiles/me');
      if (res.ok) {
        const data = (await res.json()) as { user_type?: string };
        setHasPermission(
          ['comprador', 'vendedor', 'hibrido', 'admin'].includes(data.user_type ?? '')
        );
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = (await res.json()) as { documents: Document[] };
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Erro ao carregar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await fetch('/api/business/my-businesses');
      if (res.ok) {
        const data = (await res.json()) as { businesses: Business[] };
        setBusinesses(data.businesses ?? []);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Deseja excluir "${doc.file_name}"?`)) return;
    setDeletingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Documento excluído');
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      } else {
        toast.error('Erro ao excluir documento');
      }
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error('Erro ao excluir documento');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (doc: Document) => {
    if (typeof window !== 'undefined') {
      window.open(doc.file_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Filter
  const filtered = documents.filter((d) => {
    if (activeCategory !== 'todos' && d.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.file_name.toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q) ||
        (d.business_name ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group by category label for display
  const categoryCount = (key: string) =>
    key === 'todos' ? documents.length : documents.filter((d) => d.category === key).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00A9E0]" />
              Meus Documentos
            </h1>
          </div>
          {hasPermission && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl font-semibold hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Documento</span>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!hasPermission && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">Perfil sem permissão</p>
              <p className="text-yellow-700 text-sm">
                Configure seu perfil como Comprador, Vendedor ou Híbrido para gerenciar documentos.
              </p>
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, descrição ou empresa..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const count = categoryCount(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key as CategoryKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    activeCategory === cat.key
                      ? 'bg-[#00A9E0] text-white border-[#00A9E0] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#00A9E0] hover:text-[#00A9E0]'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeCategory === cat.key ? 'bg-white/30' : 'bg-gray-100'}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-[#00A9E0] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold mb-1">
              {search || activeCategory !== 'todos'
                ? 'Nenhum documento encontrado'
                : 'Nenhum documento ainda'}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {hasPermission && !search && activeCategory === 'todos'
                ? 'Clique em "Novo Documento" para começar a organizar seus arquivos'
                : 'Tente ajustar os filtros de busca'}
            </p>
            {hasPermission && !search && activeCategory === 'todos' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00A9E0] text-white rounded-xl font-semibold hover:bg-[#0098CC]"
              >
                <Plus className="w-4 h-4" /> Enviar primeiro documento
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => {
              const catInfo = CATEGORIES.find((c) => c.key === doc.category);
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all flex flex-col group"
                >
                  {/* Icon + badge row */}
                  <div className="flex items-start justify-between mb-3">
                    <FileIcon fileName={doc.file_name} size="lg" />
                    <FileTypeBadge fileName={doc.file_name} />
                  </div>

                  {/* File name */}
                  <h3
                    className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2"
                    title={doc.file_name}
                  >
                    {doc.file_name}
                  </h3>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{doc.description}</p>
                  )}

                  {/* Meta */}
                  <div className="mt-auto space-y-1.5 pt-3 border-t border-gray-100">
                    {catInfo && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        {catInfo.emoji} {catInfo.label}
                      </span>
                    )}
                    {doc.business_name && (
                      <div className="flex items-center gap-1 text-xs text-[#00A9E0] font-medium">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{doc.business_name}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(doc.created_at)}</p>
                    {doc.file_size && (
                      <p className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#00A9E0] text-white rounded-lg text-sm font-medium hover:bg-[#0098CC] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar
                    </button>
                    {hasPermission && (
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Excluir"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info footer */}
        <div className="bg-white/60 rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 font-semibold mb-1">Tipos de arquivo suportados</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>
              <span className="font-bold text-red-600">PDF</span> — Certidões, declarações,
              contratos
            </span>
            <span>
              <span className="font-bold text-green-600">XLSX / CSV</span> — Planilhas financeiras
            </span>
            <span>
              <span className="font-bold text-blue-600">DOCX</span> — Documentos Word
            </span>
            <span>
              <span className="font-bold text-purple-600">JPG / PNG</span> — Imagens e fotos
            </span>
            <span>
              <span className="font-bold text-yellow-600">ZIP</span> — Pacotes de arquivos
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Tamanho máximo: {MAX_SIZE_MB}MB por arquivo</p>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          businesses={businesses}
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}
