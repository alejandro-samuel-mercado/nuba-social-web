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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-dark flex items-center gap-2">
            <Bell className="h-7 w-7 text-secondary" /> Centro de Notificaciones
          </h1>
          <p className="text-sm font-semibold text-dark/70">
            Avisos, sorteos en vivo, encuestas y mensajes directos recientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings">
            <SacButton size="sm" variant="glass">
              <Settings className="h-4 w-4" /> Configurar alertas
            </SacButton>
          </Link>
          <SacButton size="sm" variant="primary" onClick={() => void markAllRead()}>
            <CheckCheck className="h-4 w-4" /> Marcar leídas
          </SacButton>
        </div>
      </div>

      {loading ? (
        <GlassCard className="text-center py-12 font-bold text-dark/60">Cargando alertas...</GlassCard>
      ) : items.length === 0 ? (
        <GlassCard className="text-center py-12 font-bold text-dark/60">
          Todavía no tenés notificaciones registradas.
        </GlassCard>
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => void openNotification(n)}
              className={`w-full text-left sac-card rounded-3xl p-4 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                n.isRead ? 'opacity-80' : 'bg-primary/35'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {!n.isRead ? <SacBadge variant="secondary">Nuevo</SacBadge> : null}
                  {n.topic ? <SacBadge variant="outline">{n.topic}</SacBadge> : null}
                  <span className="text-xs font-bold text-dark/60">{timeAgo(n.createdAt)}</span>
                </div>
                <div className="font-black text-dark">{n.title}</div>
                <p className="text-sm font-semibold text-dark/75">{n.body}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
