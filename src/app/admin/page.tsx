'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Gift, LifeBuoy, Shield, Sparkles, Trophy, Users } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { GlassCard, SacButton } from '@/components/ui/SacPrimitives';
import { AdminTogglesSection } from '@/components/admin/AdminTogglesSection';
import { AdminPostsSection } from '@/components/admin/AdminPostsSection';
import { AdminFootballSection } from '@/components/admin/AdminFootballSection';
import { AdminUsersSection } from '@/components/admin/AdminUsersSection';

type AdminTab = 'OVERVIEW' | 'POSTS' | 'FOOTBALL' | 'USERS';

export default function AdminPage() {
  const { isStaff } = useAuth();
  const [tab, setTab] = useState<AdminTab>('OVERVIEW');

  if (!isStaff) {
    return (
      <GlassCard className="text-center py-16 space-y-3 max-w-lg mx-auto">
        <Shield className="h-10 w-10 mx-auto text-rose-600" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Acceso Restringido
        </h1>
        <p className="text-xs text-slate-500">
          Esta sección es exclusiva para el equipo de Administración y Moderación.
        </p>
      </GlassCard>
    );
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'OVERVIEW', label: 'Control & Módulos', icon: Shield },
    { id: 'POSTS', label: 'Publicar Contenido', icon: Sparkles },
    { id: 'FOOTBALL', label: 'Gestión Fútbol', icon: Trophy },
    { id: 'USERS', label: 'Cuentas Privadas', icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" />
            <span>Central de Mando Admin</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Activá interruptores, importá desde TMDB/StreamFlex/NubaTV y gestioná partidos y usuarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/polls">
            <SacButton size="sm" variant="glass">
              <BarChart3 className="h-3.5 w-3.5" /> Encuestas
            </SacButton>
          </Link>
          <Link href="/giveaways">
            <SacButton size="sm" variant="glass">
              <Gift className="h-3.5 w-3.5" /> Sorteos
            </SacButton>
          </Link>
          <Link href="/support">
            <SacButton size="sm" variant="glass">
              <LifeBuoy className="h-3.5 w-3.5" /> Inbox DM
            </SacButton>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80 dark:border-slate-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'OVERVIEW' ? <AdminTogglesSection /> : null}
      {tab === 'POSTS' ? <AdminPostsSection /> : null}
      {tab === 'FOOTBALL' ? <AdminFootballSection /> : null}
      {tab === 'USERS' ? <AdminUsersSection /> : null}
    </div>
  );
}
