'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { AppNotification } from '@/types/nuba';
import { GlassCard, SacBadge, SacButton } from '@/components/ui/SacPrimitives';

export default function NotificationsPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setItems(data.notifications || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await refreshSession();
  };

  const openNotification = async (n: AppNotification) => {
    if (!n.isRead) {
      await api.patch(`/notifications/${n.id}/read`).catch(() => {});
      setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
      void refreshSession();
    }

    if (n.referenceType === 'POLL') router.push('/polls');
    else if (n.referenceType === 'GIVEAWAY') router.push('/giveaways');
    else if (n.referenceType === 'DIRECT_THREAD' && n.referenceId)
      router.push(`/support?threadId=${n.referenceId}`);
    else if (n.referenceType === 'TOPIC_CHAT' && n.topic) router.push(`/chats?topic=${n.topic}`);
    else router.push('/feed');
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            <span>Centro de Notificaciones</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Avisos de partidos, sorteos en vivo, encuestas y respuestas del administrador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings">
            <SacButton size="sm" variant="glass">
              <Settings className="h-4 w-4" /> Configurar
            </SacButton>
          </Link>
          <SacButton size="sm" variant="primary" onClick={() => void markAllRead()}>
            <CheckCheck className="h-4 w-4" /> Marcar leídas
          </SacButton>
        </div>
      </div>

      {loading ? (
        <GlassCard className="text-center py-12 text-sm text-slate-500">
          Cargando notificaciones...
        </GlassCard>
      ) : items.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-2 text-slate-400">
          <Bell className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-xs font-medium">No tenés notificaciones pendientes.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => void openNotification(n)}
              className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                n.isRead
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 opacity-75'
                  : 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 shadow-2xs'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!n.isRead ? <SacBadge variant="secondary">Nuevo</SacBadge> : null}
                  {n.topic ? <SacBadge variant="outline">{n.topic}</SacBadge> : null}
                  <span className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {n.title}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {n.body}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
