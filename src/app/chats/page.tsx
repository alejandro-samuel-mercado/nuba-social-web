'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Image as ImageIcon,
  Lightbulb,
  Lock,
  MessageCircle,
  Pin,
  Send,
  Smile,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { api, resolveMediaUrl, uploadImageWeb } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { Sticker, TopicChatMessage, TopicType } from '@/types/nuba';
import { GlassCard, SacAvatar, SacBadge, SacButton } from '@/components/ui/SacPrimitives';

const TOPIC_TABS: Array<{ id: TopicType; label: string; emoji: string }> = [
  { id: 'FOOTBALL', label: 'Fútbol', emoji: '⚽' },
  { id: 'STREAMING', label: 'Streaming', emoji: '🎬' },
  { id: 'NEWS', label: 'Noticias', emoji: '📢' },
  { id: 'TV_CHANNELS', label: 'Canales TV', emoji: '📺' },
];

interface RoomConfig {
  topic: TopicType;
  isLocked: boolean;
  notice: string | null;
}

interface RoomSummaryItem {
  topic: TopicType;
  config: RoomConfig;
  messageCount: number;
  lastMessage: { content: string | null; messageType: string; createdAt: string } | null;
}

function ChatsPageInner() {
  const searchParams = useSearchParams();
  const initialTopic = (searchParams.get('topic')?.toUpperCase() || 'FOOTBALL') as TopicType;
  const validInitial = TOPIC_TABS.some((t) => t.id === initialTopic) ? initialTopic : 'FOOTBALL';

  const { user, settings, isStaff, socket } = useAuth();
  const [activeTopic, setActiveTopic] = useState<TopicType>(validInitial);
  const [summaries, setSummaries] = useState<RoomSummaryItem[]>([]);
  const [messages, setMessages] = useState<TopicChatMessage[]>([]);
  const [config, setConfig] = useState<RoomConfig | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState('');
  const [asSuggestion, setAsSuggestion] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeDraft, setNoticeDraft] = useState('');
  const [editingNotice, setEditingNotice] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadSummaries = useCallback(async () => {
    try {
      const { data } = await api.get('/chats/topics/summary');
      setSummaries(data.rooms || []);
      if (data.stickers) setStickers(data.stickers);
    } catch {
      // handled
    }
  }, []);

  const loadRoom = useCallback(async (topic: TopicType) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/chats/topics/${topic}`);
      setMessages(data.messages || []);
      setConfig(data.config || null);
      setNoticeDraft(data.config?.notice || '');
      if (data.stickers) setStickers(data.stickers);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la sala.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    void loadRoom(activeTopic);
  }, [activeTopic, loadRoom]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_topic', activeTopic);

    const onMessage = (msg: TopicChatMessage) => {
      if (msg.topic !== activeTopic) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };

    const onDeleted = (payload: { topic: TopicType; messageId: string }) => {
      if (payload.topic !== activeTopic) return;
      setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
    };

    const onConfig = (nextCfg: RoomConfig) => {
      if (nextCfg.topic === activeTopic) {
        setConfig(nextCfg);
        setNoticeDraft(nextCfg.notice || '');
      }
      void loadSummaries();
    };

    socket.on('topic_chat:message', onMessage);
    socket.on('topic_chat:deleted', onDeleted);
    socket.on('topic_chat:config', onConfig);

    return () => {
      socket.emit('leave_topic', activeTopic);
      socket.off('topic_chat:message', onMessage);
      socket.off('topic_chat:deleted', onDeleted);
      socket.off('topic_chat:config', onConfig);
    };
  }, [socket, activeTopic, loadSummaries]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const { data } = await api.post(`/chats/topics/${activeTopic}`, {
        messageType: asSuggestion ? 'SUGGESTION' : 'TEXT',
        content: text.trim(),
      });
      if (data?.message) {
        setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      }
      setText('');
      setAsSuggestion(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const sendSticker = async (code: string) => {
    setError(null);
    try {
      const { data } = await api.post(`/chats/topics/${activeTopic}`, {
        messageType: 'STICKER',
        stickerCode: code,
      });
      if (data?.message) {
        setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      }
      setShowStickers(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar el sticker.');
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingImg(true);
    setError(null);
    try {
      const url = await uploadImageWeb(file, 'chat');
      const { data } = await api.post(`/chats/topics/${activeTopic}`, {
        messageType: 'IMAGE',
        imageUrl: url,
        content: text.trim() || null,
      });
      if (data?.message) {
        setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      }
      setText('');
    } catch (err: any) {
      setError(err?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleDeleteMsg = async (id: string) => {
    try {
      await api.delete(`/chats/topics/${activeTopic}/messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar.');
    }
  };

  const toggleLockRoom = async () => {
    if (!isStaff || !config) return;
    const { data } = await api.patch(`/chats/topics/${activeTopic}/config`, {
      isLocked: !config.isLocked,
    });
    if (data?.config) setConfig(data.config);
  };

  const saveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaff) return;
    const { data } = await api.patch(`/chats/topics/${activeTopic}/config`, {
      notice: noticeDraft.trim() || null,
    });
    if (data?.config) setConfig(data.config);
    setEditingNotice(false);
  };

  if (!settings.chatsEnabled && !isStaff) {
    return (
      <GlassCard className="text-center py-16 space-y-3 max-w-lg mx-auto">
        <Lock className="h-10 w-10 mx-auto text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Salas de Chat en Pausa
        </h1>
        <p className="text-xs text-slate-500">
          El administrador pausó temporalmente las salas comunitarias por tema.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Room Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {TOPIC_TABS.map((t) => {
          const sum = summaries.find((s) => s.topic === t.id);
          const active = activeTopic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                active
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </span>
                {sum?.config?.isLocked ? <Lock className="h-3.5 w-3.5 text-rose-500" /> : null}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {sum ? `${sum.messageCount} mensajes` : 'Entrar al chat'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Chat Container */}
      <GlassCard className="p-0 overflow-hidden flex flex-col h-[72vh] min-h-[500px]">
        {/* Chat Room Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl">
              {TOPIC_TABS.find((t) => t.id === activeTopic)?.emoji}
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Sala {TOPIC_TABS.find((t) => t.id === activeTopic)?.label}
              </h2>
              <p className="text-[11px] text-slate-500">
                {config?.isLocked ? 'Sala pausada por administración' : 'En vivo • Mensajería comunitaria'}
              </p>
            </div>
          </div>

          {isStaff ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingNotice((v) => !v)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {editingNotice ? 'Cancelar' : 'Fijar Aviso'}
              </button>
              <button
                type="button"
                onClick={() => void toggleLockRoom()}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border cursor-pointer ${
                  config?.isLocked
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300'
                }`}
              >
                {config?.isLocked ? (
                  <>
                    <Unlock className="h-3 w-3" /> Reabrir
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Pausar
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>

        {/* Pinned Notice */}
        {config?.notice ? (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/60 px-5 py-2 text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Pin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>{config.notice}</span>
          </div>
        ) : null}

        {/* Edit Notice Form */}
        {editingNotice && isStaff ? (
          <form onSubmit={saveNotice} className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
            <input
              value={noticeDraft}
              onChange={(e) => setNoticeDraft(e.target.value)}
              placeholder="Escribí un aviso fijado para todos los usuarios..."
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
            />
            <SacButton size="sm" type="submit" variant="primary">
              Guardar
            </SacButton>
          </form>
        ) : null}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {loading ? (
            <p className="text-center text-xs text-slate-400 py-8">Cargando mensajes...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 space-y-1 text-slate-400">
              <MessageCircle className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-medium">Todavía no hay mensajes en esta sala.</p>
              <p className="text-[11px]">¡Escribí el primer mensaje!</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === user?.id;
              const stickerObj = m.stickerCode ? stickers.find((s) => s.code === m.stickerCode) : null;
              const imgResolved = resolveMediaUrl(m.imageUrl);
              const isAuthorStaff = ['SUPERADMIN', 'ADMIN', 'MODERATOR'].includes(m.sender.role);

              return (
                <div key={m.id} className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  <SacAvatar src={m.sender.avatarUrl} name={m.sender.displayName} size={32} />
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 space-y-1 ${
                      mine
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                        : m.messageType === 'SUGGESTION'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={mine ? 'text-blue-100' : 'text-slate-900 dark:text-slate-100'}>
                          {m.sender.displayName}
                        </span>
                        {isAuthorStaff ? (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                              mine ? 'bg-blue-800 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            }`}
                          >
                            STAFF
                          </span>
                        ) : null}
                        {m.messageType === 'SUGGESTION' ? (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                              mine ? 'bg-amber-400 text-slate-950' : 'bg-amber-200 text-amber-950'
                            }`}
                          >
                            SUGERENCIA
                          </span>
                        ) : null}
                      </div>
                      <span className={mine ? 'text-blue-200' : 'text-slate-400'}>
                        {timeAgo(m.createdAt)}
                      </span>
                    </div>

                    {/* Sticker */}
                    {m.messageType === 'STICKER' && stickerObj ? (
                      <div className="py-1 flex items-center gap-2">
                        <span className="text-3xl">{stickerObj.emoji}</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                          {stickerObj.label}
                        </span>
                      </div>
                    ) : null}

                    {/* Image */}
                    {m.messageType === 'IMAGE' && imgResolved ? (
                      <img
                        src={imgResolved}
                        alt="Chat"
                        className="rounded-xl max-h-56 object-cover border border-black/10 mt-1"
                      />
                    ) : null}

                    {/* Text */}
                    {m.content ? (
                      <p className="text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </p>
                    ) : null}

                    {/* Staff / Mine Delete */}
                    {(mine || isStaff) ? (
                      <div className="flex justify-end pt-0.5">
                        <button
                          onClick={() => void handleDeleteMsg(m.id)}
                          className={`text-[10px] font-medium opacity-60 hover:opacity-100 hover:underline cursor-pointer inline-flex items-center gap-0.5 ${
                            mine ? 'text-white' : 'text-rose-600'
                          }`}
                        >
                          <Trash2 className="h-3 w-3" /> Borrar
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Sticker Picker Drawer */}
        {showStickers ? (
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-2">
            {stickers.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => void sendSticker(s.code)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
              >
                <span className="text-lg">{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Chat Input Bar */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          {error ? <p className="text-xs text-rose-600 font-medium px-1">{error}</p> : null}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowStickers((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                showStickers
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Smile className="h-3.5 w-3.5" /> Stickers
            </button>

            <button
              type="button"
              onClick={() => setAsSuggestion((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                asSuggestion
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" /> Sugerencia
            </button>

            {(settings.chatImagesEnabled || isStaff) ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />
                <button
                  type="button"
                  disabled={uploadingImg}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {uploadingImg ? 'Subiendo...' : 'Imagen'}
                </button>
              </>
            ) : null}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={(config?.isLocked && !isStaff) || sending}
              placeholder={
                config?.isLocked && !isStaff
                  ? 'Esta sala se encuentra pausada temporalmente...'
                  : asSuggestion
                  ? 'Escribí tu sugerencia para este tema...'
                  : `Escribí en ${TOPIC_TABS.find((t) => t.id === activeTopic)?.label}...`
              }
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <SacButton
              type="submit"
              variant="primary"
              disabled={(config?.isLocked && !isStaff) || sending || !text.trim()}
            >
              <Send className="h-4 w-4" />
            </SacButton>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<GlassCard className="text-center py-12 text-sm text-slate-500">Cargando salas...</GlassCard>}>
      <ChatsPageInner />
    </Suspense>
  );
}
