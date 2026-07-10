'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@/lib/router-shim';
import useUpload from '@/utils/useUpload';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Star,
  Loader2,
  Image as ImageIcon,
  Building2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface BusinessImage {
  id: string;
  storage_key: string;
  file_name: string;
  file_url: string;
  is_primary: number;
  display_order: number;
  created_at: string;
}

interface Business {
  id: string;
  alias_name: string;
  ramo_atividade: string;
  segmento: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGES = 7;

export default function ManageBusinessImages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [upload, { loading: isUploading }] = useUpload();

  const [business, setBusiness] = useState<Business | null>(null);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchBusinessAndImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const businessRes = await fetch(`/api/business/${id}`);
      if (businessRes.ok) {
        const data = (await businessRes.json()) as { business: Business };
        setBusiness(data.business);
      }

      const imagesRes = await fetch(`/api/business/${id}/images`);
      if (imagesRes.ok) {
        const data = (await imagesRes.json()) as { images: BusinessImage[] };
        setImages(data.images ?? []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchBusinessAndImages();
  }, [fetchBusinessAndImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    // Format validation
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setUploadError('Formato não suportado. Use JPG, PNG ou WebP.');
      e.target.value = '';
      return;
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`Arquivo muito grande (${sizeMB} MB). O limite é ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = '';
      return;
    }

    // Max images check
    if (images.length >= MAX_IMAGES) {
      setUploadError(`Limite máximo de ${MAX_IMAGES} fotos atingido.`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    // Generate local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadError(null);

    // Upload to CDN via the platform useUpload hook (no backend size limit)
    const { url: fileUrl, error: uploadErr } = await upload({ file: selectedFile });
    if (uploadErr || !fileUrl) {
      setUploadError(uploadErr ?? 'Erro ao fazer upload. Tente novamente.');
      return;
    }

    // Persist URL + filename to backend
    const isPrimary = images.length === 0;
    const res = await fetch(`/api/business/${id}/images`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: fileUrl,
        file_name: selectedFile.name,
        is_primary: isPrimary,
      }),
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      setUploadError(errData.error ?? 'Erro ao salvar imagem no servidor.');
      return;
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadSuccess(true);
    await fetchBusinessAndImages();
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleCancelSelect = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      const response = await fetch(`/api/business/${id}/images/${imageId}/primary`, {
        method: 'PATCH',
      });
      if (response.ok) {
        await fetchBusinessAndImages();
      } else {
        alert('Erro ao definir imagem principal');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta imagem?')) return;
    try {
      const response = await fetch(`/api/business/${id}/images/${imageId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchBusinessAndImages();
      } else {
        alert('Erro ao deletar imagem');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const getImageUrl = (image: BusinessImage) => {
    if (image.file_url) return image.file_url;
    if (image.storage_key && !image.storage_key.startsWith('local-'))
      return `https://ucarecdn.com/${image.storage_key}/`;
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
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
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <img
                src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
                alt="Sobybs"
                className="h-10 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Info */}
        {business && (
          <div className="bg-gradient-to-br from-[#00A9E0] to-[#1CB5E0] rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center space-x-4">
              <Building2 className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {business.alias_name || business.ramo_atividade}
                </h1>
                <p className="text-lg opacity-90">{business.segmento}</p>
              </div>
            </div>
          </div>
        )}

        {/* Criteria info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Critérios de upload:</strong> Formatos aceitos: <strong>JPG, PNG, WebP</strong>{' '}
            • Tamanho máximo: <strong>10 MB por foto</strong> • Limite total:{' '}
            <strong>7 fotos por empresa</strong>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-[#00A9E0]" />
              Upload de Imagens
            </h2>
            <div className="text-sm text-gray-600">
              <span className={images.length >= MAX_IMAGES ? 'text-red-600 font-semibold' : ''}>
                {images.length}/{MAX_IMAGES} fotos
              </span>
            </div>
          </div>

          {/* Error message */}
          {uploadError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{uploadError}</p>
            </div>
          )}

          {/* Success message */}
          {uploadSuccess && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Imagem enviada com sucesso!</p>
            </div>
          )}

          {images.length >= MAX_IMAGES ? (
            <div className="border-2 border-gray-300 rounded-xl p-8 text-center bg-gray-50">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Limite máximo de {MAX_IMAGES} fotos atingido
              </p>
              <p className="text-sm text-gray-600">
                Delete uma foto existente para adicionar uma nova
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              {selectedFile && previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-48 h-48 object-cover rounded-xl mx-auto shadow"
                  />
                  <p className="text-base font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {isUploading && (
                    <div className="flex items-center justify-center gap-2 text-[#00A9E0]">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Enviando imagem...</span>
                    </div>
                  )}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => void handleUpload()}
                      disabled={isUploading}
                      className="px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Enviando...' : 'Confirmar Upload'}
                    </button>
                    <button
                      onClick={handleCancelSelect}
                      disabled={isUploading}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-1">Clique para selecionar uma imagem</p>
                  <p className="text-sm text-gray-500 mb-4">
                    JPG, PNG ou WebP • máx. {MAX_FILE_SIZE_MB} MB
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg font-semibold cursor-pointer"
                  >
                    Selecionar Imagem
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Images Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Imagens da Empresa ({images.length})
          </h2>

          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhuma imagem cadastrada</p>
              <p className="text-sm">Faça upload da primeira imagem acima</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => {
                const imgUrl = getImageUrl(image);
                const isBroken = !imgUrl;
                return (
                  <div
                    key={image.id}
                    className={`relative group rounded-xl overflow-hidden border-2 ${
                      image.is_primary ? 'border-yellow-400 shadow-lg' : 'border-gray-200 shadow-md'
                    }`}
                  >
                    {isBroken ? (
                      <div className="w-full h-64 bg-red-50 flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                        <p className="text-sm text-red-500 font-medium">URL inválida</p>
                        <p className="text-xs text-gray-400 text-center px-4">{image.file_name}</p>
                      </div>
                    ) : (
                      <img
                        src={imgUrl}
                        alt={image.file_name}
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='16' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImagem não encontrada%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    )}

                    {image.is_primary === 1 && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-semibold flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span>Principal</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100">
                      {!image.is_primary && !isBroken && (
                        <button
                          onClick={() => void handleSetPrimary(image.id)}
                          className="p-3 bg-yellow-400 text-gray-900 rounded-full hover:bg-yellow-300 transition-colors"
                          title="Definir como principal"
                        >
                          <Star className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => void handleDelete(image.id)}
                        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-3 bg-white">
                      <p className="text-sm text-gray-600 truncate">{image.file_name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
