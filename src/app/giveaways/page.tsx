'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Gift,
  Lock,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Giveaway } from '@/types/nuba';
import { GlassCard, SacAvatar, SacBadge, SacButton, SacInput } from '@/components/ui/SacPrimitives';

export default function GiveawaysPage() {
  const router = useRouter();
  const { settings, isStaff, isAdmin, socket } = useAuth();

  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [history, setHistory] = useState<Giveaway[]>([]);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [maxEntries, setMaxEntries] = useState('');

  const loadGiveaways = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/giveaways');
      setGiveaways(data.giveaways || []);
      setHistory(data.history || []);
      setHistoryEnabled(data.historyEnabled !== false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGiveaways();
  }, [loadGiveaways]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => void loadGiveaways();
    socket.on('giveaway:new', refresh);
    socket.on('giveaway:updated', refresh);
    socket.on('giveaway:enrolled', refresh);
    socket.on('giveaway:live_draw', refresh);
    socket.on('giveaway:deleted', refresh);
    return () => {
      socket.off('giveaway:new', refresh);
      socket.off('giveaway:updated', refresh);
      socket.off('giveaway:enrolled', refresh);
      socket.off('giveaway:live_draw', refresh);
      socket.off('giveaway:deleted', refresh);
    };
  }, [socket, loadGiveaways]);

  const handleEnroll = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/giveaways/${id}/enroll`);
      await loadGiveaways();
    } catch (err: any) {
      setError(err?.message || 'No se pudo inscribir al sorteo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleLiveDraw = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/giveaways/${id}/draw`);
      await loadGiveaways();
    } catch (err: any) {
      setError(err?.message || 'No se pudo ejecutar el sorteo en vivo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleContactWinner = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const { data } = await api.post(`/giveaways/${id}/contact-winner`, {});
      if (data?.thread?.id) {
        router.push(`/support?threadId=${data.thread.id}`);
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo abrir chat con el ganador.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/giveaways', {
        title: title.trim(),
        prizeDescription: prizeDescription.trim(),
        description: description.trim() || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        maxEntries: maxEntries ? Number(maxEntries) : null,
      });
      setTitle('');
      setPrizeDescription('');
      setDescription('');
      setScheduledAt('');
      setMaxEntries('');
      setShowCreate(false);
      await loadGiveaways();
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear el sorteo.');
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/giveaways/${id}`);
    await loadGiveaways();
  };

  if (!settings.giveawaysEnabled && !isStaff) {
    return (
      <GlassCard className="text-center py-16 space-y-3 max-w-lg mx-auto">
        <Lock className="h-10 w-10 mx-auto text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sorteos Desactivados
        </h1>
        <p className="text-xs text-slate-500">
          El administrador pausó temporalmente la sección de sorteos.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Gift className="h-6 w-6 text-indigo-600" />
            <span>Sorteos de Cuentas & Premios</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Anotate gratis y seguí el sorteo oficial cuando la administración gire la ruleta en vivo.
          </p>
        </div>

        {isStaff ? (
          <SacButton
            variant={showCreate ? 'outline' : 'primary'}
            size="sm"
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            <span>{showCreate ? 'Cancelar' : 'Crear Sorteo'}</span>
          </SacButton>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Staff Create Giveaway */}
      {showCreate && isStaff ? (
        <GlassCard className="p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Programar Nuevo Sorteo
          </h2>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3.5">
            <SacInput
              label="Título del sorteo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Sorteo Cuenta StreamFlex Anual"
              required
            />
            <SacInput
              label="Premio exacto"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              placeholder="Ej: 2 Cuentas Premium 4K + Acceso VIP"
              required
            />
            <SacInput
              label="Fecha y hora de sorteo"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <SacInput
              label="Cupo máximo de participantes (opcional)"
              type="number"
              min={2}
              value={maxEntries}
              onChange={(e) => setMaxEntries(e.target.value)}
              placeholder="Sin límite"
            />
            <div className="sm:col-span-2">
              <SacInput
                label="Reglas / requisitos adicionales"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles sobre entrega y vigencia del premio..."
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <SacButton type="submit" variant="primary">
                Publicar Sorteo
              </SacButton>
            </div>
          </form>
        </GlassCard>
      ) : null}

      {/* Active Giveaways */}
      {loading ? (
        <GlassCard className="text-center py-12 text-sm text-slate-500">
          Cargando sorteos...
        </GlassCard>
      ) : (
        <>
          <section className="space-y-3.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Sorteos Activos
            </h2>

            {giveaways.length === 0 ? (
              <GlassCard className="text-center py-10 space-y-1 text-slate-400">
                <Gift className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-medium">No hay sorteos abiertos en este momento.</p>
              </GlassCard>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 items-start">
                {giveaways.map((g) => (
                  <GlassCard key={g.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <SacBadge variant="secondary">{g.status}</SacBadge>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-1 leading-snug">
                          {g.title}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        🎟️ {g.entriesCount}{g.maxEntries ? ` / ${g.maxEntries}` : ''}
                      </span>
                    </div>

                    {/* Prize Spotlight */}
                    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-900/60 p-3.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Premio Oficial
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        🎁 {g.prizeDescription}
                      </p>
                    </div>

                    {g.description ? (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {g.description}
                      </p>
                    ) : null}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(g.scheduledAt).toLocaleString('es-AR')}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{g.participants.length} participantes</span>
                      </span>
                    </div>

                    {/* Participants avatar preview */}
                    {g.participants.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {g.participants.slice(0, 10).map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium"
                          >
                            @{p.username}
                          </span>
                        ))}
                        {g.participants.length > 10 ? (
                          <span className="text-xs text-slate-400 font-medium py-0.5 px-1">
                            +{g.participants.length - 10} más
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        {g.isEnrolled ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" /> Ya estás anotado
                          </span>
                        ) : (
                          <SacButton
                            variant="primary"
                            size="sm"
                            disabled={busyId === g.id}
                            onClick={() => void handleEnroll(g.id)}
                          >
                            🎟️ Anotarme
                          </SacButton>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isAdmin ? (
                          <SacButton
                            variant="accent"
                            size="sm"
                            disabled={busyId === g.id || g.entriesCount === 0}
                            onClick={() => void handleLiveDraw(g.id)}
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Ruleta en Vivo
                          </SacButton>
                        ) : null}

                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(g.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Eliminar sorteo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>

          {/* History */}
          {(historyEnabled || isStaff) && history.length > 0 ? (
            <section className="space-y-3.5 pt-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Historial de Ganadores
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {history.map((g) => (
                  <GlassCard key={g.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{g.title}</h4>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">🎁 {g.prizeDescription}</p>
                      </div>
                      <SacBadge variant="outline">{g.status}</SacBadge>
                    </div>

                    {g.winner ? (
                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <SacAvatar src={g.winner.avatarUrl} name={g.winner.displayName} size={36} />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-600 flex items-center gap-1">
                              <Trophy className="h-3 w-3" /> Ganador
                            </span>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {g.winner.displayName}
                            </div>
                            <div className="text-[11px] text-slate-500">@{g.winner.username}</div>
                          </div>
                        </div>

                        {isStaff ? (
                          <SacButton
                            size="sm"
                            variant="glass"
                            disabled={busyId === g.id}
                            onClick={() => void handleContactWinner(g.id)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Contactar
                          </SacButton>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Participantes: {g.entriesCount}</span>
                      {g.drawnAt ? <span>{new Date(g.drawnAt).toLocaleDateString('es-AR')}</span> : null}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
