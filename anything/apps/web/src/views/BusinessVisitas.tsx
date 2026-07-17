'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@/lib/router-shim';
import { useAuth } from '@/lib/auth-shim';
import {
  ArrowLeft,
  CalendarCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  MapPin,
  AlertCircle,
} from 'lucide-react';

interface VisitRequest {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  preferred_date: string;
  preferred_time?: string;
  message?: string;
  status: string;
  address_released: number;
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Recusada', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
};

/** Parse YYYY-MM-DD to DD/MM/YYYY safely (no new Date in render) */
function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function BusinessVisitas() {
  const { id: businessId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');

  const loadVisits = useCallback(async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      const [bizRes, visitRes] = await Promise.all([
        fetch(`/api/business/${businessId}`, { credentials: 'include' }),
        fetch(`/api/business/${businessId}/visit-requests`, { credentials: 'include' }),
      ]);

      if (bizRes.ok) {
        const data = (await bizRes.json()) as {
          business: { alias_name?: string; ramo_atividade?: string };
        };
        setBusinessName(data.business.alias_name || data.business.ramo_atividade || 'Empresa');
      }

      if (visitRes.ok) {
        const data = (await visitRes.json()) as { visit_requests: VisitRequest[] };
        setVisits(data.visit_requests);
      } else {
        setError('Erro ao carregar solicitações de visita');
      }
    } catch {
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void loadVisits();
  }, [loadVisits]);

  const handleUpdateStatus = async (requestId: string, status: 'confirmed' | 'rejected') => {
    setUpdatingId(requestId);
    try {
      const res = await fetch(`/api/visit-requests/${requestId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        alert(err.error || 'Erro ao atualizar solicitação');
        return;
      }
      // Reload
      await loadVisits();
    } catch {
      alert('Erro ao atualizar solicitação');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = visits.filter((v) => v.status === 'pending').length;
  const confirmedCount = visits.filter((v) => v.status === 'confirmed').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando visitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/business/${businessId}`)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                Gerenciar Visitas
              </h1>
              <p className="text-sm text-gray-500">{businessName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-gray-500 mt-1">Pendentes</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Confirmadas</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-gray-700">{visits.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total</p>
          </div>
        </div>

        {visits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma visita agendada</h3>
            <p className="text-gray-500">
              Quando compradores solicitarem visitas, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending first */}
            {visits
              .slice()
              .sort((a, b) => {
                const order: Record<string, number> = {
                  pending: 0,
                  confirmed: 1,
                  rejected: 2,
                  cancelled: 3,
                };
                return (order[a.status] ?? 9) - (order[b.status] ?? 9);
              })
              .map((visit) => {
                const statusInfo = STATUS_LABEL[visit.status] ?? {
                  label: visit.status,
                  color: 'bg-gray-100 text-gray-700',
                };
                const isPending = visit.status === 'pending';

                return (
                  <div
                    key={visit.id}
                    className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${
                      isPending
                        ? 'border-yellow-400'
                        : visit.status === 'confirmed'
                          ? 'border-green-400'
                          : 'border-gray-200'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00A9E0]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#00A9E0]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{visit.buyer_name}</p>
                          <p className="text-sm text-gray-500">{visit.buyer_email}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Visit details */}
                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CalendarCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="font-medium">{formatDateBR(visit.preferred_date)}</span>
                        {visit.preferred_time && (
                          <>
                            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
                            <span>{visit.preferred_time}</span>
                          </>
                        )}
                      </div>
                      {visit.address_released === 1 && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="font-medium">Endereço liberado para o comprador</span>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    {visit.message && (
                      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg mb-4">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 italic">
                          &ldquo;{visit.message}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Actions (only for pending) */}
                    {isPending && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => void handleUpdateStatus(visit.id, 'confirmed')}
                          disabled={updatingId === visit.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 font-semibold text-sm disabled:opacity-50 transition"
                        >
                          {updatingId === visit.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Confirmar e liberar endereço
                        </button>
                        <button
                          onClick={() => void handleUpdateStatus(visit.id, 'rejected')}
                          disabled={updatingId === visit.id}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-semibold text-sm disabled:opacity-50 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Recusar
                        </button>
                      </div>
                    )}

                    {visit.status === 'confirmed' && (
                      <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Visita confirmada — endereço completo foi liberado para o comprador
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Info box */}
        {visits.some((v) => v.status === 'pending') && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Ao confirmar uma visita:</strong> o endereço completo do estabelecimento é
              liberado automaticamente para o comprador. Certifique-se de estar disponível na data
              informada.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
