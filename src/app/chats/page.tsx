'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Image as ImageIcon,
  Lightbulb,
  Lock,
  MessageCircle,
  Send,
  Smile,
  Trash2,
  Unlock,
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
      // handled in room fetch
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
      <GlassCard className="text-center py-12 space-y-2">
        <Lock className="h-10 w-10 mx-auto text-secondary" />
        <h1 className="text-2xl font-black text-dark">Salas de Chat Desactivadas</h1>
        <p className="text-sm font-semibold text-dark/70">
          El administrador pausó temporalmente las salas grupales por tema.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de Salas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TOPIC_TABS.map((t) => {
          const sum = summaries.find((s) => s.topic === t.id);
          const active = activeTopic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              className={`rounded-3xl border-[2.5px] border-dark p-3.5 text-left transition-all cursor-pointer ${
                active
                  ? 'bg-primary shadow-[4px_4px_0_0_var(--color-dark)] -translate-y-0.5'
                  : 'bg-glass hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-black text-dark">
                  {t.emoji} {t.label}
                </span>
                {sum?.config?.isLocked ? <Lock className="h-3.5 w-3.5 text-red-600" /> : null}
              </div>
              <p className="text-[11px] font-bold text-dark/65 mt-1 truncate">
                {sum ? `${sum.messageCount} mensajes en sala` : 'Entrar al chat'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Ventana de Chat */}
      <GlassCard className="p-0 overflow-hidden flex flex-col h-[70vh] min-h-[480px]">
        {/* Header Sala */}
        <div className="border-b-2 border-dark/20 bg-surface/90 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-secondary" />
            <h1 className="font-black text-dark text-base sm:text-lg">
              Sala {TOPIC_TABS.find((t) => t.id === activeTopic)?.emoji}{' '}
              {TOPIC_TABS.find((t) => t.id === activeTopic)?.label}
            </h1>
            {config?.isLocked ? <SacBadge variant="secondary">Sala Pausada</SacBadge> : null}
          </div>

          <div className="flex items-center gap-2">
            {isStaff ? (
              <>
                <SacButton
                  size="sm"
                  variant="glass"
                  onClick={() => setEditingNotice((v) => !v)}
                >
                  Aviso fijado
                </SacButton>
                <SacButton
                  size="sm"
                  variant={config?.isLocked ? 'accent' : 'outline'}
                  onClick={() => void toggleLockRoom()}
                >
                  {config?.isLocked ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" /> Reabrir
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Pausar sala
                    </>
                  )}
                </SacButton>
              </>
            ) : null}
          </div>
        </div>

        {/* Aviso fijado */}
        {config?.notice ? (
          <div className="bg-primary/60 border-b border-dark/20 px-5 py-2 text-xs font-extrabold text-dark">
            📌 {config.notice}
          </div>
        ) : null}

        {editingNotice && isStaff ? (
          <form onSubmit={saveNotice} className="border-b border-dark/20 bg-white/80 p-3 flex gap-2">
            <input
              value={noticeDraft}
              onChange={(e) => setNoticeDraft(e.target.value)}
              placeholder="Aviso fijado para esta sala..."
              className="flex-1 rounded-full border-2 border-dark/60 px-4 py-1.5 text-xs font-bold text-dark"
            />
            <SacButton size="sm" type="submit">
              Guardar
            </SacButton>
          </form>
        ) : null}

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {loading ? (
            <p className="text-center text-sm font-bold text-dark/60 py-8">Cargando mensajes...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm font-bold text-dark/60 py-8">
              Todavía no hay mensajes en esta sala. ¡Rompé el hielo!
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === user?.id;
              const stickerObj = m.stickerCode ? stickers.find((s) => s.code === m.stickerCode) : null;
              const imgResolved = resolveMediaUrl(m.imageUrl);
              const isAuthorStaff = ['SUPERADMIN', 'ADMIN', 'MODERATOR'].includes(m.sender.role);

              return (
                <div key={m.id} className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  <SacAvatar src={m.sender.avatarUrl} name={m.sender.displayName} size={34} />
                  <div
                    className={`max-w-[78%] rounded-3xl border-2 border-dark px-4 py-2.5 space-y-1 ${
                      mine
                        ? 'bg-primary text-dark'
                        : m.messageType === 'SUGGESTION'
                          ? 'bg-amber-100 text-slate-900'
                          : 'bg-white/95 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black">{m.sender.displayName}</span>
                        {isAuthorStaff ? (
                          <span className="rounded-full bg-dark px-1.5 py-0.2 text-[9px] font-black text-white">
                            STAFF
                          </span>
                        ) : null}
                        {m.messageType === 'SUGGESTION' ? (
                          <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[9px] font-black text-white">
                            SUGERENCIA
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] font-bold opacity-60">{timeAgo(m.createdAt)}</span>
                    </div>

                    {m.messageType === 'STICKER' && stickerObj ? (
                      <div className="py-1 flex items-center gap-2">
                        <span className="text-4xl">{stickerObj.emoji}</span>
                        <span className="text-xs font-black uppercase tracking-wider">{stickerObj.label}</span>
                      </div>
                    ) : null}

                    {m.messageType === 'IMAGE' && imgResolved ? (
                      <img
                        src={imgResolved}
                        alt="Chat"
                        className="rounded-2xl border border-dark/40 max-h-60 object-cover"
                      />
                    ) : null}

                    {m.content ? <p className="text-sm font-semibold whitespace-pre-wrap">{m.content}</p> : null}

                    {(mine || isStaff) ? (
                      <div className="flex justify-end">
                        <button
                          onClick={() => void handleDeleteMsg(m.id)}
                          className="text-[10px] font-bold text-red-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
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

        {/* Barra de Stickers */}
        {showStickers ? (
          <div className="border-t border-dark/20 bg-surface p-3 flex flex-wrap gap-2">
            {stickers.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => void sendSticker(s.code)}
                className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-dark/50 bg-white px-3 py-1.5 text-xs font-black text-slate-900 hover:bg-primary cursor-pointer"
              >
                <span className="text-lg">{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Composer */}
        <div className="border-t-2 border-dark/20 bg-surface/90 p-3 space-y-2">
          {error ? <p className="text-xs font-black text-red-600 px-2">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStickers((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-black cursor-pointer ${
                showStickers ? 'bg-primary border-dark text-dark' : 'bg-white border-dark/30 text-slate-800'
              }`}
            >
              <Smile className="h-3.5 w-3.5" /> Stickers
            </button>

            <button
              type="button"
              onClick={() => setAsSuggestion((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-black cursor-pointer ${
                asSuggestion ? 'bg-secondary border-dark text-white' : 'bg-white border-dark/30 text-slate-800'
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" /> Sugerencia rápida
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
                  className="inline-flex items-center gap-1 rounded-full border-2 border-dark/30 bg-white px-3 py-1 text-xs font-black text-slate-800 hover:bg-primary cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {uploadingImg ? 'Subiendo...' : 'Imagen'}
                </button>
              </>
            ) : (
              <span className="text-[11px] font-bold text-dark/55">Imágenes bloqueadas por Admin</span>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={(config?.isLocked && !isStaff) || sending}
              placeholder={
                config?.isLocked && !isStaff
                  ? 'Sala pausada temporalmente por administración...'
                  : asSuggestion
                    ? 'Escribí tu sugerencia para este tema...'
                    : `Escribí en ${TOPIC_TABS.find((t) => t.id === activeTopic)?.label}...`
              }
              className="flex-1 rounded-full border-2 border-dark bg-white px-4 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
            />
            <SacButton
              type="submit"
              variant="secondary"
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
    <Suspense fallback={<GlassCard className="text-center py-12 font-bold">Cargando salas...</GlassCard>}>
      <ChatsPageInner />
    </Suspense>
  );
}
