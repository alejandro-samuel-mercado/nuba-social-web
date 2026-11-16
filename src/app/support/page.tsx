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

  // Filters
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');

  // New Thread
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('SUPPORT');
  const [newIsSuggestion, setNewIsSuggestion] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Reply
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
      <GlassCard className="text-center py-16 space-y-3 max-w-lg mx-auto">
        <Lock className="h-10 w-10 mx-auto text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Canal Directo en Pausa
        </h1>
        <p className="text-xs text-slate-500">
          El buzón de mensajes directos y sugerencias se encuentra pausado temporalmente.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-blue-600" />
            <span>{isStaff ? 'Bandeja de Mensajes y Sugerencias' : 'Chat Directo & Sugerencias'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isStaff
              ? 'Atención organizada de consultas, solicitudes y sugerencias por tema.'
              : 'Enviá consultas privadas a la administración o sugerí series, partidos y canales.'}
          </p>
        </div>

        <SacButton
          variant={showNew ? 'outline' : 'primary'}
          size="sm"
          onClick={() => setShowNew((v) => !v)}
        >
          <Plus className="h-4 w-4" />
          <span>{showNew ? 'Volver al Buzón' : 'Nueva Sugerencia / DM'}</span>
        </SacButton>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Staff Organized Filters */}
      {isStaff ? (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {DIRECT_TOPICS.map((t) => {
              const cnt = t.id === 'ALL' ? threads.length : byTopicCounts[t.id] || 0;
              return (
                <button
                  key={t.id}
                  onClick={() => setTopicFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    topicFilter === t.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t.label} {cnt > 0 ? `(${cnt})` : ''}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por usuario o asunto..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Todos los estados</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Solo no leídos</span>
            </label>
          </div>
        </div>
      ) : null}

      {/* Main 2-Pane Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Pane: Threads List */}
        <div className="lg:col-span-5 space-y-2 max-h-[68vh] overflow-y-auto">
          {loadingList ? (
            <GlassCard className="text-center py-8 text-xs text-slate-400">
              Cargando conversaciones...
            </GlassCard>
          ) : threads.length === 0 ? (
            <GlassCard className="text-center py-8 text-xs text-slate-400">
              No hay mensajes en este filtro.
            </GlassCard>
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
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <SacAvatar src={t.user?.avatarUrl} name={t.user?.displayName || 'U'} size={26} />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {isStaff ? t.user?.displayName : t.topic}
                      </span>
                    </div>
                    {unread > 0 ? (
                      <span className="rounded-full bg-rose-600 px-2 py-0.2 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    ) : null}
                  </div>

                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate mt-1">
                    {t.subject}
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mt-1">
                    <span>{t.topic} • {t.status}</span>
                    <span>{timeAgo(t.lastMessageAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Pane: Thread Details / New Thread Form */}
        <GlassCard className="lg:col-span-7 p-0 overflow-hidden flex flex-col min-h-[500px] max-h-[68vh]">
          {showNew ? (
            <form onSubmit={handleCreateThread} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Nueva Solicitud o Sugerencia
                </h3>
                <p className="text-xs text-slate-500">
                  Enviá tu mensaje privado directamente al equipo de administración
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <SacInput
                  label="Asunto / Título"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Ej: Sugerencia de nueva serie..."
                  required
                />
                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tema
                  </span>
                  <select
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                  >
                    {DIRECT_TOPICS.filter((t) => t.id !== 'ALL').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsSuggestion}
                  onChange={(e) => setNewIsSuggestion(e.target.checked)}
                  className="rounded accent-blue-600"
                />
                <span>Marcar como sugerencia de contenido o mejora</span>
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mensaje detallado
                </span>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribí detalladamente tu consulta, reporte o recomendación..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                <button
                  type="button"
                  onClick={() => newFileRef.current?.click()}
                  disabled={newImages.length >= 4}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon className="h-4 w-4" /> Adjuntar captura ({newImages.length}/4)
                </button>

                {newImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {newImages.map((img, i) => (
                      <div key={img} className="relative">
                        <img
                          src={resolveMediaUrl(img)!}
                          alt="Adjunto"
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-600 p-0.5 text-white cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end pt-2">
                <SacButton type="submit" variant="primary" disabled={creating}>
                  {creating ? 'Enviando...' : 'Enviar al Administrador'}
                </SacButton>
              </div>
            </form>
          ) : !activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2 text-slate-400">
              <LifeBuoy className="h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-medium">Seleccioná una conversación del listado o creá una nueva sugerencia.</p>
            </div>
          ) : (
            <>
              {/* Active Thread Header */}
              <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {activeThread.subject}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    @{activeThread.user?.username} • {activeThread.topic}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {isStaff ? (
                    <select
                      value={activeThread.status}
                      onChange={(e) => void handleStatusChange(e.target.value as SuggestionStatus)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <SacBadge variant="secondary">{activeThread.status}</SacBadge>
                  )}
                </div>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingThread ? (
                  <p className="text-center text-xs text-slate-400 py-6">Cargando conversación...</p>
                ) : (
                  (activeThread.messages || []).map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                        <SacAvatar src={m.sender.avatarUrl} name={m.sender.displayName} size={28} />
                        <div
                          className={`max-w-[78%] rounded-2xl p-3 space-y-1 ${
                            mine
                              ? 'bg-blue-600 text-white rounded-br-xs shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px]">
                            <span className={mine ? 'text-blue-100 font-semibold' : 'font-semibold text-slate-700 dark:text-slate-300'}>
                              {m.sender.displayName}
                              {m.isSuggestion ? ' • Sugerencia' : ''}
                            </span>
                            <span className={mine ? 'text-blue-200' : 'text-slate-400'}>
                              {timeAgo(m.createdAt)}
                            </span>
                          </div>

                          {m.content ? (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          ) : null}

                          {Array.isArray(m.images) && m.images.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {m.images.map((im) => (
                                <img
                                  key={im}
                                  src={resolveMediaUrl(im)!}
                                  alt="Adjunto"
                                  className="max-h-40 rounded-lg border border-black/10 object-cover"
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

              {/* Thread Reply Input Bar */}
              <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                {replyImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {replyImages.map((img, i) => (
                      <div key={img} className="relative">
                        <img
                          src={resolveMediaUrl(img)!}
                          alt="Adjunto"
                          className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setReplyImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-600 p-0.5 text-white cursor-pointer"
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
                  <button
                    type="button"
                    onClick={() => replyFileRef.current?.click()}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Adjuntar imagen"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>

                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribí una respuesta..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />

                  <SacButton type="submit" variant="primary" disabled={sendingReply}>
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
    <Suspense fallback={<GlassCard className="text-center py-12 text-sm text-slate-500">Cargando bandeja de soporte...</GlassCard>}>
      <SupportPageInner />
    </Suspense>
  );
}
