'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, Gift, Lock, MessageSquare, Plus, Sparkles, Trash2, Trophy, Users } from 'lucide-react';
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
      <GlassCard className="text-center py-12 space-y-2">
        <Lock className="h-10 w-10 mx-auto text-secondary" />
        <h1 className="text-2xl font-black text-dark">Sorteos Desactivados</h1>
        <p className="text-sm font-semibold text-dark/70">
          El administrador pausó la sección de sorteos temporalmente.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-dark flex items-center gap-2">
            <Gift className="h-7 w-7 text-secondary" /> Sorteos de Cuentas & Premios
          </h1>
          <p className="text-sm font-semibold text-dark/70">
            Anotate con un clic y seguí el sorteo en vivo cuando el administrador gire la ruleta oficial.
          </p>
        </div>

        {isStaff ? (
          <SacButton variant="primary" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" /> {showCreate ? 'Cerrar' : 'Crear Sorteo'}
          </SacButton>
        ) : null}
      </div>

      {error ? (
        <GlassCard className="p-3 bg-red-100 border-red-600 text-red-800 text-sm font-bold">
          {error}
        </GlassCard>
      ) : null}

      {showCreate && isStaff ? (
        <GlassCard className="space-y-4">
          <h2 className="text-lg font-black text-dark">Programar Nuevo Sorteo</h2>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3">
            <SacInput
              label="Título del sorteo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Mega Sorteo Cuenta StreamFlex Anual"
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
              label="Fecha y hora programada"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <SacInput
              label="Cupo máximo (opcional)"
              type="number"
              min={2}
              value={maxEntries}
              onChange={(e) => setMaxEntries(e.target.value)}
              placeholder="Sin límite"
            />
            <div className="sm:col-span-2">
              <SacInput
                label="Reglas / descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles de participación y entrega..."
              />
            </div>
            <div className="sm:col-span-2">
              <SacButton type="submit" variant="secondary">
                Publicar Sorteo Abierto
              </SacButton>
            </div>
          </form>
        </GlassCard>
      ) : null}

      {loading ? (
        <GlassCard className="text-center py-12 font-bold text-dark/60">Cargando sorteos...</GlassCard>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-black text-dark flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" /> Sorteos Activos
            </h2>
            {giveaways.length === 0 ? (
              <GlassCard className="text-center py-10 font-bold text-dark/60">
                No hay sorteos abiertos en este momento.
              </GlassCard>
            ) : (
              <div className="grid lg:grid-cols-2 gap-5 items-start">
                {giveaways.map((g) => (
                  <GlassCard key={g.id} className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <SacBadge variant="primary">{g.status}</SacBadge>
                        <h3 className="text-xl font-black text-dark pt-1">{g.title}</h3>
                      </div>
                      <span className="rounded-full bg-surface border border-dark/25 px-3 py-1 text-xs font-black text-dark">
                        🎟️ {g.entriesCount}{g.maxEntries ? ` / ${g.maxEntries}` : ''}
                      </span>
                    </div>

                    <div className="rounded-2xl border-2 border-dark bg-primary/50 p-3.5 space-y-1">
                      <div className="text-[11px] font-black uppercase tracking-wider text-dark/70">
                        Premio Oficial
                      </div>
                      <div className="text-base font-black text-dark">🎁 {g.prizeDescription}</div>
                    </div>

                    {g.description ? (
                      <p className="text-sm font-semibold text-dark/80">{g.description}</p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-dark/70">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-secondary" />
                        {new Date(g.scheduledAt).toLocaleString('es-AR')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-secondary" />
                        {g.participants.length} anotados
                      </span>
                    </div>

                    {g.participants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {g.participants.slice(0, 12).map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 rounded-full border border-dark/20 bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-900"
                          >
                            @{p.username}
                          </span>
                        ))}
                        {g.participants.length > 12 ? (
                          <span className="text-xs font-black text-dark/60">
                            +{g.participants.length - 12} más
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dark/15">
                      {g.isEnrolled ? (
                        <SacBadge variant="accent" className="py-1.5 px-4 text-xs">
                          <CheckCircle2 className="h-4 w-4" /> Ya estás anotado
                        </SacBadge>
                      ) : (
                        <SacButton
                          variant="secondary"
                          disabled={busyId === g.id}
                          onClick={() => void handleEnroll(g.id)}
                        >
                          🎟️ Anotarme al Sorteo
                        </SacButton>
                      )}

                      {isAdmin ? (
                        <SacButton
                          variant="primary"
                          disabled={busyId === g.id || g.entriesCount === 0}
                          onClick={() => void handleLiveDraw(g.id)}
                        >
                          <Sparkles className="h-4 w-4" /> Iniciar Sorteo En Vivo
                        </SacButton>
                      ) : null}

                      {isAdmin ? (
                        <SacButton
                          size="sm"
                          variant="danger"
                          onClick={() => void handleDelete(g.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </SacButton>
                      ) : null}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>

          {/* Historial de Sorteos & Ganadores */}
          {(historyEnabled || isStaff) ? (
            <section className="space-y-3 pt-2">
              <h2 className="text-lg font-black text-dark flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" /> Historial de Sorteos y Ganadores
              </h2>
              {history.length === 0 ? (
                <GlassCard className="text-center py-8 font-bold text-dark/60">
                  Aún no hay sorteos finalizados en el historial.
                </GlassCard>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {history.map((g) => (
                    <GlassCard key={g.id} className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-dark">{g.title}</h3>
                          <p className="text-xs font-bold text-secondary">🎁 {g.prizeDescription}</p>
                        </div>
                        <SacBadge variant="dark">{g.status}</SacBadge>
                      </div>

                      {g.winner ? (
                        <div className="rounded-2xl border-2 border-dark bg-primary/40 p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <SacAvatar src={g.winner.avatarUrl} name={g.winner.displayName} size={40} />
                            <div>
                              <div className="text-[10px] font-black uppercase text-dark/65">
                                🏆 Ganador Oficial
                              </div>
                              <div className="font-black text-sm text-dark">{g.winner.displayName}</div>
                              <div className="text-xs font-bold text-dark/70">@{g.winner.username}</div>
                            </div>
                          </div>

                          {isStaff ? (
                            <SacButton
                              size="sm"
                              variant="secondary"
                              disabled={busyId === g.id}
                              onClick={() => void handleContactWinner(g.id)}
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Contactar
                            </SacButton>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="text-[11px] font-bold text-dark/60 flex items-center justify-between">
                        <span>Participantes: {g.entriesCount}</span>
                        {g.drawnAt ? <span>Sorteado: {new Date(g.drawnAt).toLocaleString('es-AR')}</span> : null}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
