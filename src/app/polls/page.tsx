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
      <GlassCard className="text-center py-12 space-y-2">
        <Lock className="h-10 w-10 mx-auto text-secondary" />
        <h1 className="text-2xl font-black text-dark">Encuestas Desactivadas</h1>
        <p className="text-sm font-semibold text-dark/70">
          El administrador pausó la sección de encuestas temporalmente.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-dark flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-secondary" /> Encuestas de la Comunidad
          </h1>
          <p className="text-sm font-semibold text-dark/70">
            Votá en tiempo real y ayudanos a elegir nuevos torneos, series o canales.
          </p>
        </div>

        {isStaff ? (
          <SacButton variant="primary" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" /> {showCreate ? 'Cerrar' : 'Nueva Encuesta'}
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
          <h2 className="text-lg font-black text-dark">Crear Nueva Encuesta</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <SacInput
              label="Pregunta"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ej: ¿Qué torneo quieren seguir con Feature especial?"
              required
            />
            <SacInput
              label="Descripción opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-black text-dark/80">Tema asociado</span>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as any)}
                  className="w-full rounded-2xl border-2 border-dark/70 bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
                >
                  <option value="NONE">General del Club</option>
                  <option value="FOOTBALL">⚽ Fútbol</option>
                  <option value="STREAMING">🎬 Streaming</option>
                  <option value="NEWS">📢 Noticias</option>
                  <option value="TV_CHANNELS">📺 Canales TV</option>
                </select>
              </label>

              <label className="flex items-center gap-2 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="h-4 w-4 accent-secondary"
                />
                <span className="text-sm font-extrabold text-dark">Permitir respuesta múltiple</span>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-black text-dark/80">Opciones (una por línea)</span>
              <textarea
                rows={4}
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                className="w-full rounded-2xl border-2 border-dark/70 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900"
              />
            </label>

            <SacButton type="submit" variant="secondary" disabled={saving}>
              {saving ? 'Publicando...' : 'Publicar Encuesta'}
            </SacButton>
          </form>
        </GlassCard>
      ) : null}

      {loading ? (
        <GlassCard className="text-center py-12 font-bold text-dark/60">Cargando encuestas...</GlassCard>
      ) : polls.length === 0 ? (
        <GlassCard className="text-center py-12 font-bold text-dark/60">
          Todavía no hay encuestas publicadas.
        </GlassCard>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          {polls.map((poll) => (
            <GlassCard key={poll.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SacBadge variant={poll.isClosed ? 'dark' : 'primary'}>
                      {poll.isClosed ? 'Cerrada' : 'Abierta'}
                    </SacBadge>
                    {poll.topic ? <SacBadge variant="accent">{poll.topic}</SacBadge> : null}
                  </div>
                  <h2 className="text-xl font-black text-dark pt-1">{poll.question}</h2>
                  {poll.description ? (
                    <p className="text-xs font-semibold text-dark/75">{poll.description}</p>
                  ) : null}
                </div>
                <span className="text-xs font-bold text-dark/60 shrink-0">{timeAgo(poll.createdAt)}</span>
              </div>

              <div className="space-y-2.5">
                {poll.options.map((opt) => {
                  const chosen = poll.userVotedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      disabled={poll.isClosed}
                      onClick={() => void handleVote(poll.id, opt.id)}
                      className={`relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all cursor-pointer disabled:cursor-default ${
                        chosen
                          ? 'border-dark bg-white shadow-[3px_3px_0_0_var(--color-dark)]'
                          : 'border-dark/40 bg-white/85 hover:border-dark'
                      }`}
                    >
                      <div
                        style={{ width: `${opt.percentage}%` }}
                        className={`absolute inset-y-0 left-0 transition-all ${
                          chosen ? 'bg-primary/80' : 'bg-tertiary/40'
                        }`}
                      />
                      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                          {chosen ? <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" /> : null}
                          {opt.label}
                        </span>
                        <span className="text-xs font-black text-slate-800 shrink-0">
                          {opt.percentage}% ({opt.votes})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dark/15 pt-3 text-xs font-bold text-dark/65">
                <span>👥 {poll.totalVoters} participantes totales</span>
                {isStaff ? (
                  <div className="flex items-center gap-2">
                    <SacButton size="sm" variant="glass" onClick={() => void toggleClose(poll)}>
                      {poll.isClosed ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      {poll.isClosed ? 'Reabrir' : 'Cerrar'}
                    </SacButton>
                    <SacButton size="sm" variant="danger" onClick={() => void deletePoll(poll.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </SacButton>
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
