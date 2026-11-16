'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Lock, Plus, Trash2, Unlock } from 'lucide-react';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { Poll, TopicType } from '@/types/nuba';
import { GlassCard, SacBadge, SacButton, SacInput } from '@/components/ui/SacPrimitives';

export default function PollsPage() {
  const { settings, isStaff, socket } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState<TopicType | 'NONE'>('NONE');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [optionsText, setOptionsText] = useState('Opción 1\nOpción 2');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPolls = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/polls');
      setPolls(data.polls || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPolls();
  }, [loadPolls]);

  useEffect(() => {
    if (!socket) return;
    const onNew = ({ poll }: { poll: Poll }) => {
      if (!poll) return;
      setPolls((prev) => [poll, ...prev.filter((p) => p.id !== poll.id)]);
    };
    const onUpdated = ({ poll }: { poll: Poll }) => {
      if (!poll) return;
      setPolls((prev) => prev.map((p) => (p.id === poll.id ? poll : p)));
    };
    const onDeleted = ({ pollId }: { pollId: string }) => {
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
    };

    socket.on('poll:new', onNew);
    socket.on('poll:updated', onUpdated);
    socket.on('poll:deleted', onDeleted);
    return () => {
      socket.off('poll:new', onNew);
      socket.off('poll:updated', onUpdated);
      socket.off('poll:deleted', onDeleted);
    };
  }, [socket]);

  const handleVote = async (pollId: string, optionId: string) => {
    setError(null);
    try {
      const { data } = await api.post(`/polls/${pollId}/vote`, { optionId });
      if (data?.poll) {
        setPolls((prev) => prev.map((p) => (p.id === pollId ? data.poll : p)));
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar tu voto.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const options = optionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) {
      setError('Ingresá al menos 2 opciones (una por línea).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/polls', {
        question: question.trim(),
        description: description.trim() || null,
        topic: topic === 'NONE' ? null : topic,
        allowMultiple,
        options,
      });
      setQuestion('');
      setDescription('');
      setOptionsText('Opción 1\nOpción 2');
      setShowCreate(false);
      await loadPolls();
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear la encuesta.');
    } finally {
      setSaving(false);
    }
  };

  const toggleClose = async (poll: Poll) => {
    await api.patch(`/polls/${poll.id}`, { isClosed: !poll.isClosed });
    await loadPolls();
  };

  const deletePoll = async (pollId: string) => {
    await api.delete(`/polls/${pollId}`);
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
  };

  if (!settings.pollsEnabled && !isStaff) {
    return (
      <GlassCard className="text-center py-16 space-y-3 max-w-lg mx-auto">
        <Lock className="h-10 w-10 mx-auto text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Encuestas Desactivadas
        </h1>
        <p className="text-xs text-slate-500">
          El administrador pausó temporalmente la sección de encuestas.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>Encuestas de la Comunidad</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Votá en tiempo real y decidí qué torneos, series y canales priorizamos.
          </p>
        </div>

        {isStaff ? (
          <SacButton
            variant={showCreate ? 'outline' : 'primary'}
            size="sm"
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            <span>{showCreate ? 'Cancelar' : 'Nueva Encuesta'}</span>
          </SacButton>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Staff Create Poll Form */}
      {showCreate && isStaff ? (
        <GlassCard className="p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Crear Nueva Encuesta
          </h2>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <SacInput
              label="Pregunta de la Encuesta"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ej: ¿Qué torneo quieren seguir con cobertura en vivo?"
              required
            />
            <SacInput
              label="Detalle o descripción opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Información adicional para los participantes..."
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tema vinculado
                </span>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                >
                  <option value="NONE">General del Club</option>
                  <option value="FOOTBALL">⚽ Fútbol</option>
                  <option value="STREAMING">🎬 Streaming</option>
                  <option value="NEWS">📢 Noticias</option>
                  <option value="TV_CHANNELS">📺 Canales TV</option>
                </select>
              </label>

              <label className="flex items-center gap-2 pt-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Permitir selección múltiple
                </span>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Opciones de voto (una por línea)
              </span>
              <textarea
                rows={4}
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <SacButton type="submit" variant="primary" disabled={saving}>
                {saving ? 'Publicando...' : 'Publicar Encuesta'}
              </SacButton>
            </div>
          </form>
        </GlassCard>
      ) : null}

      {/* Polls List */}
      {loading ? (
        <GlassCard className="text-center py-12 text-sm text-slate-500">
          Cargando encuestas...
        </GlassCard>
      ) : polls.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-2">
          <BarChart3 className="h-8 w-8 mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No hay encuestas activas en este momento.
          </p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 items-start">
          {polls.map((poll) => (
            <GlassCard key={poll.id} className="p-5 space-y-4">
              {/* Poll Top */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SacBadge variant={poll.isClosed ? 'outline' : 'secondary'}>
                      {poll.isClosed ? 'Cerrada' : 'Abierta'}
                    </SacBadge>
                    {poll.topic ? <SacBadge variant="primary">{poll.topic}</SacBadge> : null}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-1 leading-snug">
                    {poll.question}
                  </h3>
                  {poll.description ? (
                    <p className="text-xs text-slate-500 leading-relaxed">{poll.description}</p>
                  ) : null}
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {timeAgo(poll.createdAt)}
                </span>
              </div>

              {/* Options with Progress Bar */}
              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const chosen = poll.userVotedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      disabled={poll.isClosed}
                      onClick={() => void handleVote(poll.id, opt.id)}
                      className={`relative w-full overflow-hidden rounded-xl border text-left transition-all cursor-pointer disabled:cursor-default ${
                        chosen
                          ? 'border-blue-500/70 bg-blue-50/30 dark:bg-blue-950/30 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/60'
                      }`}
                    >
                      {/* Bar Fill */}
                      <div
                        style={{ width: `${opt.percentage}%` }}
                        className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                          chosen ? 'bg-blue-500/20 dark:bg-blue-500/30' : 'bg-slate-200/50 dark:bg-slate-800'
                        }`}
                      />

                      {/* Content */}
                      <div className="relative z-10 flex items-center justify-between gap-3 px-3.5 py-2.5">
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {chosen ? (
                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                          ) : null}
                          <span>{opt.label}</span>
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                          {opt.percentage}% <span className="text-[11px] font-normal text-slate-400">({opt.votes})</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Poll Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span>👥 {poll.totalVoters} participantes</span>
                {isStaff ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggleClose(poll)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                      title={poll.isClosed ? 'Reabrir' : 'Cerrar'}
                    >
                      {poll.isClosed ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deletePoll(poll.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 cursor-pointer"
                      title="Eliminar encuesta"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
