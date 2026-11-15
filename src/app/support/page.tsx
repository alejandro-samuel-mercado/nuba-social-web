'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Image as ImageIcon,
  LifeBuoy,
  Lock,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react';
import { api, resolveMediaUrl, uploadImageWeb } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { DirectMessage, DirectThread, SuggestionStatus } from '@/types/nuba';
import { GlassCard, SacAvatar, SacBadge, SacButton, SacInput } from '@/components/ui/SacPrimitives';

const DIRECT_TOPICS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'FOOTBALL', label: '⚽ Fútbol' },
  { id: 'STREAMING', label: '🎬 Streaming' },
  { id: 'TV_CHANNELS', label: '📺 Canales TV' },
  { id: 'NEWS', label: '📢 Noticias' },
  { id: 'GIVEAWAY', label: '🎁 Sorteos' },
  { id: 'SUPPORT', label: '🛠️ Soporte' },
  { id: 'OTHER', label: '💬 Otros' },
];

const STATUS_OPTIONS: SuggestionStatus[] = ['OPEN', 'REVIEWED', 'APPROVED', 'REJECTED', 'RESOLVED'];

function SupportPageInner() {
  const searchParams = useSearchParams();
  const initialThreadId = searchParams.get('threadId');

  const { user, settings, isStaff, socket, refreshSession } = useAuth();

  const [threads, setThreads] = useState<DirectThread[]>([]);
  const [byTopicCounts, setByTopicCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(initialThreadId);
  const [activeThread, setActiveThread] = useState<DirectThread | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);

  // Filtros Inbox Admin
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');

  // Composer nuevo hilo
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('SUPPORT');
  const [newIsSuggestion, setNewIsSuggestion] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Composer respuesta en hilo
  const [replyText, setReplyText] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newFileRef = useRef<HTMLInputElement | null>(null);
  const replyFileRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get('/chats/direct/threads', {
        params: {
          topic: topicFilter !== 'ALL' ? topicFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          unreadOnly: unreadOnly ? 'true' : undefined,
          search: search.trim() || undefined,
        },
      });
      const list = (data.threads || []) as DirectThread[];
      setThreads(list);
      setByTopicCounts(data.byTopicCounts || {});
      if (!selectedId && list.length > 0 && !showNew) {
        setSelectedId(list[0].id);
      }
    } finally {
      setLoadingList(false);
    }
  }, [topicFilter, statusFilter, unreadOnly, search, selectedId, showNew]);

  const loadThreadDetail = useCallback(
    async (threadId: string) => {
      setLoadingThread(true);
      try {
        const { data } = await api.get(`/chats/direct/threads/${threadId}`);
        setActiveThread(data.thread || null);
        await api.post(`/chats/direct/threads/${threadId}/read`).catch(() => {});
        void refreshSession();
      } catch (err: any) {
        setError(err?.message || 'No se pudo cargar la conversación.');
      } finally {
        setLoadingThread(false);
      }
    },
    [refreshSession]
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedId) {
      void loadThreadDetail(selectedId);
    } else {
      setActiveThread(null);
    }
  }, [selectedId, loadThreadDetail]);

  useEffect(() => {
    if (!socket) return;
    if (selectedId) {
      socket.emit('join_thread', selectedId);
    }

    const onDirectMsg = (payload: { threadId: string; message: DirectMessage }) => {
      if (payload.threadId === selectedId) {
        setActiveThread((prev) => {
          if (!prev) return prev;
          const msgs = prev.messages || [];
          if (msgs.some((m) => m.id === payload.message.id)) return prev;
          return { ...prev, messages: [...msgs, payload.message] };
        });
        void api.post(`/chats/direct/threads/${payload.threadId}/read`).catch(() => {});
      }
      void loadThreads();
    };

    const onThreadUpdate = () => {
      void loadThreads();
      if (selectedId) void loadThreadDetail(selectedId);
    };

    socket.on('direct:message', onDirectMsg);
    socket.on('direct:thread_new', onThreadUpdate);
    socket.on('direct:thread_updated', onThreadUpdate);

    return () => {
      if (selectedId) socket.emit('leave_thread', selectedId);
      socket.off('direct:message', onDirectMsg);
      socket.off('direct:thread_new', onThreadUpdate);
      socket.off('direct:thread_updated', onThreadUpdate);
    };
  }, [socket, selectedId, loadThreads, loadThreadDetail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages?.length]);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const url = await uploadImageWeb(file, 'chat');
      setter((prev) => (prev.length < 4 ? [...prev, url] : prev));
    } catch (err: any) {
      setError(err?.message || 'Error al subir la imagen.');
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const { data } = await api.post('/chats/direct/threads', {
        subject: newSubject.trim() || 'Consulta / Sugerencia',
        topic: newTopic,
        message: newMessage.trim(),
        images: newImages,
        isSuggestion: newIsSuggestion,
      });
      setShowNew(false);
      setNewSubject('');
      setNewMessage('');
      setNewImages([]);
      await loadThreads();
      if (data?.thread?.id) {
        setSelectedId(data.thread.id);
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || (!replyText.trim() && replyImages.length === 0)) return;
    setSendingReply(true);
    setError(null);
    try {
      const { data } = await api.post(`/chats/direct/threads/${selectedId}/messages`, {
        content: replyText.trim() || null,
        images: replyImages,
      });
      if (data?.message) {
        setActiveThread((prev) =>
          prev
            ? {
                ...prev,
                messages: (prev.messages || []).some((m) => m.id === data.message.id)
                  ? prev.messages
                  : [...(prev.messages || []), data.message],
              }
            : prev
        );
      }
      setReplyText('');
      setReplyImages([]);
      void loadThreads();
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar la respuesta.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (status: SuggestionStatus) => {
    if (!selectedId || !isStaff) return;
    await api.patch(`/chats/direct/threads/${selectedId}/status`, { status });
    setActiveThread((prev) => (prev ? { ...prev, status } : prev));
    void loadThreads();
  };

  if (!settings.directChatEnabled && !isStaff) {
    return (
      <GlassCard className="text-center py-12 space-y-2">
        <Lock className="h-10 w-10 mx-auto text-secondary" />
        <h1 className="text-2xl font-black text-dark">Canal Directo Pausado</h1>
        <p className="text-sm font-semibold text-dark/70">
          El chat directo y buzón de sugerencias está deshabilitado temporalmente.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-dark flex items-center gap-2">
            <LifeBuoy className="h-7 w-7 text-secondary" />
            {isStaff ? 'Bandeja Organizada de Usuarios' : 'Chat Directo & Sugerencias al Admin'}
          </h1>
          <p className="text-sm font-semibold text-dark/70">
            {isStaff
              ? 'Gestioná consultas, reportes, ganadores de sorteos y sugerencias por tema.'
              : 'Enviá mensajes privados, reportá fallos o sugerí partidos, películas y canales.'}
          </p>
        </div>

        <SacButton variant="primary" onClick={() => setShowNew((v) => !v)}>
          <Plus className="h-4 w-4" /> {showNew ? 'Volver al historial' : 'Nueva Sugerencia / DM'}
        </SacButton>
      </div>

      {error ? (
        <GlassCard className="p-3 bg-red-100 border-red-600 text-red-800 text-sm font-bold">
          {error}
        </GlassCard>
      ) : null}

      {/* Filtros organizados para Admin/Staff */}
      {isStaff ? (
        <GlassCard className="p-3.5 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {DIRECT_TOPICS.map((t) => {
              const cnt = t.id === 'ALL' ? threads.length : byTopicCounts[t.id] || 0;
              return (
                <button
                  key={t.id}
                  onClick={() => setTopicFilter(t.id)}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-black cursor-pointer ${
                    topicFilter === t.id
                      ? 'bg-secondary text-white border-dark'
                      : 'bg-surface text-dark border-dark/25'
                  }`}
                >
                  {t.label} {cnt > 0 ? `(${cnt})` : ''}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-dark/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario o asunto..."
                className="w-full rounded-full border-2 border-dark/40 bg-white pl-9 pr-4 py-1.5 text-xs font-bold text-slate-900"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border-2 border-dark/40 bg-white px-3 py-1.5 text-xs font-black text-slate-900"
            >
              <option value="ALL">Todos los estados</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs font-black text-dark cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="accent-secondary"
              />
              Solo sin leer
            </label>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid lg:grid-cols-12 gap-4 items-start">
        {/* Lista de Hilos */}
        <GlassCard className="lg:col-span-4 p-3 space-y-2 max-h-[68vh] overflow-y-auto">
          {loadingList ? (
            <p className="text-center text-xs font-bold text-dark/60 py-6">Cargando hilos...</p>
          ) : threads.length === 0 ? (
            <p className="text-center text-xs font-bold text-dark/60 py-6">
              No hay conversaciones en este filtro.
            </p>
          ) : (
            threads.map((t) => {
              const active = selectedId === t.id && !showNew;
              const unread = isStaff ? t.unreadForAdmin : t.unreadForUser;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setShowNew(false);
                    setSelectedId(t.id);
                  }}
                  className={`w-full text-left rounded-2xl border-2 p-3 space-y-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-primary border-dark shadow-[3px_3px_0_0_var(--color-dark)]'
                      : 'bg-white/80 border-dark/25 hover:border-dark'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <SacAvatar src={t.user?.avatarUrl} name={t.user?.displayName || 'U'} size={28} />
                      <span className="text-xs font-black text-slate-900 truncate">
                        {isStaff ? t.user?.displayName : t.topic}
                      </span>
                    </div>
                    {unread > 0 ? (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                        {unread}
                      </span>
                    ) : null}
                  </div>
                  <div className="font-black text-sm text-slate-900 truncate">{t.subject}</div>
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-600">
                    <span>{t.topic} • {t.status}</span>
                    <span>{timeAgo(t.lastMessageAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </GlassCard>

        {/* Detalle / Formulario Nuevo Hilo */}
        <GlassCard className="lg:col-span-8 p-0 overflow-hidden flex flex-col min-h-[520px] max-h-[68vh]">
          {showNew ? (
            <form onSubmit={handleCreateThread} className="p-5 space-y-4 overflow-y-auto">
              <h2 className="text-xl font-black text-dark">Nueva Solicitud o Sugerencia</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                <SacInput
                  label="Asunto / Título"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Ej: Agregar serie / Reportar canal caído..."
                  required
                />
                <label className="block space-y-1.5">
                  <span className="block text-xs font-black text-dark/90">Tema</span>
                  <select
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full rounded-2xl border-2 border-dark/70 bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
                  >
                    {DIRECT_TOPICS.filter((t) => t.id !== 'ALL').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm font-extrabold text-dark cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsSuggestion}
                  onChange={(e) => setNewIsSuggestion(e.target.checked)}
                  className="h-4 w-4 accent-secondary"
                />
                Marcar como Sugerencia de contenido o mejora
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-black text-dark/90">Contenido del mensaje</span>
                <textarea
                  rows={5}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Contanos en detalle qué necesitás o sugerís..."
                  className="w-full rounded-2xl border-2 border-dark/70 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                  required
                />
              </label>

              <div className="space-y-2">
                <input
                  ref={newFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUpload(e, setNewImages)}
                />
                <SacButton
                  type="button"
                  size="sm"
                  variant="glass"
                  onClick={() => newFileRef.current?.click()}
                  disabled={newImages.length >= 4}
                >
                  <ImageIcon className="h-4 w-4" /> Adjuntar captura ({newImages.length}/4)
                </SacButton>

                {newImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {newImages.map((img, i) => (
                      <div key={img} className="relative">
                        <img
                          src={resolveMediaUrl(img)!}
                          alt="Adjunto"
                          className="h-20 w-20 rounded-2xl border-2 border-dark object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 rounded-full bg-red-600 p-0.5 text-white cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <SacButton type="submit" variant="secondary" disabled={creating}>
                {creating ? 'Enviando...' : 'Enviar al Administrador'}
              </SacButton>
            </form>
          ) : !activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2 text-dark/60">
              <LifeBuoy className="h-10 w-10 text-secondary" />
              <p className="font-bold">Seleccioná una conversación o creá una nueva sugerencia.</p>
            </div>
          ) : (
            <>
              <div className="border-b-2 border-dark/20 bg-surface px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-black text-dark">{activeThread.subject}</h2>
                  <p className="text-xs font-bold text-dark/65">
                    @{activeThread.user?.username} • {activeThread.topic}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {isStaff ? (
                    STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        onClick={() => void handleStatusChange(st)}
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black cursor-pointer ${
                          activeThread.status === st
                            ? 'bg-secondary text-white border-dark'
                            : 'bg-white text-slate-800 border-dark/30'
                        }`}
                      >
                        {st}
                      </button>
                    ))
                  ) : (
                    <SacBadge variant="primary">{activeThread.status}</SacBadge>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingThread ? (
                  <p className="text-center text-xs font-bold text-dark/60 py-8">Cargando mensajes...</p>
                ) : (
                  (activeThread.messages || []).map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                        <SacAvatar src={m.sender.avatarUrl} name={m.sender.displayName} size={30} />
                        <div
                          className={`max-w-[78%] rounded-3xl border-2 border-dark px-4 py-2.5 space-y-1.5 ${
                            mine ? 'bg-primary text-dark' : 'bg-white text-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] font-black">
                            <span>
                              {m.sender.displayName}
                              {m.isSuggestion ? ' • SUGERENCIA' : ''}
                            </span>
                            <span className="opacity-60">{timeAgo(m.createdAt)}</span>
                          </div>
                          {m.content ? <p className="text-sm font-semibold whitespace-pre-wrap">{m.content}</p> : null}
                          {Array.isArray(m.images) && m.images.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {m.images.map((im) => (
                                <img
                                  key={im}
                                  src={resolveMediaUrl(im)!}
                                  alt="Adjunto"
                                  className="max-h-48 rounded-2xl border border-dark object-cover"
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t-2 border-dark/20 bg-surface p-3 space-y-2">
                {replyImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {replyImages.map((img, i) => (
                      <div key={img} className="relative">
                        <img
                          src={resolveMediaUrl(img)!}
                          alt="Adjunto"
                          className="h-14 w-14 rounded-xl border border-dark object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setReplyImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-red-600 p-0.5 text-white cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    ref={replyFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleUpload(e, setReplyImages)}
                  />
                  <SacButton
                    type="button"
                    size="sm"
                    variant="glass"
                    onClick={() => replyFileRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </SacButton>
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribí una respuesta..."
                    className="flex-1 rounded-full border-2 border-dark bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                  />
                  <SacButton type="submit" variant="secondary" disabled={sendingReply}>
                    <Send className="h-4 w-4" />
                  </SacButton>
                </form>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<GlassCard className="text-center py-12 font-bold">Cargando mensajería...</GlassCard>}>
      <SupportPageInner />
    </Suspense>
  );
}
