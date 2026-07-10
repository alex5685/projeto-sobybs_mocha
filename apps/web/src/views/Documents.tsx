'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-shim';
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
  uploaded_at: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profiles/me');
      if (response.ok) {
        const data = (await response.json()) as { user_type?: string };
        setUserType(data.user_type || '');

        const allowedTypes = ['comprador', 'vendedor', 'hibrido', 'admin'];
        if (!allowedTypes.includes(data.user_type ?? '')) {
          setError('Seu perfil não tem permissão para gerenciar documentos.');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/documents/list');
      if (response.ok) {
        const data = (await response.json()) as { documents?: Document[] };
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Erro ao carregar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Fazendo upload de ${file.name}...`);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadProgress('Upload concluído!');
        setTimeout(() => {
          setUploadProgress('');
          fetchDocuments();
        }, 1500);
      } else {
        const data = (await response.json()) as { error?: string };
        setError(data.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Erro ao fazer upload do arquivo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/download/${doc.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Erro ao fazer download do arquivo');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Erro ao fazer download do arquivo');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Deseja realmente excluir ${doc.file_name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDocuments();
      } else {
        const data = (await response.json()) as { error?: string };
        setError(data.error || 'Erro ao excluir documento');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Erro ao excluir documento');
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    if (imageExts.includes(ext || '')) {
      return <Image className="w-8 h-8 text-purple-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  const allowedTypes = ['comprador', 'vendedor', 'hibrido', 'admin'];
  const hasPermission = allowedTypes.includes(userType);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar ao Dashboard
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Meus Documentos</h1>
              <p className="text-lg text-gray-600">Gerencie fotos e documentos da sua conta</p>
            </div>
            {hasPermission && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                />
                <div className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>{isUploading ? 'Fazendo upload...' : 'Fazer Upload'}</span>
                </div>
              </label>
            )}
          </div>

          {!hasPermission && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start mb-6">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-yellow-800 text-sm">
                <p className="font-semibold mb-1">Perfil sem permissão</p>
                <p>
                  Apenas perfis Comprador, Vendedor, Híbrido e Admin podem gerenciar documentos.
                </p>
              </div>
            </div>
          )}

          {uploadProgress && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 text-[#00A9E0] animate-spin mr-2" />
                <span className="text-blue-800">{uploadProgress}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando documentos...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Nenhum documento encontrado</p>
              <p className="text-gray-500">
                {hasPermission
                  ? 'Faça upload do seu primeiro documento usando o botão acima'
                  : 'Configure seu perfil para começar a fazer uploads'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      {getFileIcon(doc.file_name)}
                      <h3
                        className="font-semibold text-gray-900 mt-3 mb-1 truncate"
                        title={doc.file_name}
                      >
                        {doc.file_name}
                      </h3>
                      <p className="text-sm text-gray-500">{doc.uploaded_at}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 px-4 py-2 bg-[#00A9E0] text-white rounded-lg hover:bg-[#0098CC] transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar</span>
                    </button>
                    {hasPermission && (
                      <button
                        onClick={() => handleDelete(doc)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Tipos de arquivo suportados</h3>
            <p className="text-sm text-gray-600">
              Imagens (JPG, PNG, GIF, WebP, SVG), Documentos (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX),
              Texto (TXT, CSV), Arquivos compactados (ZIP, RAR)
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Tamanho máximo:</strong> 10MB por arquivo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
