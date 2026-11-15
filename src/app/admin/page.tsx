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
      <GlassCard className="text-center py-12 space-y-3">
        <Shield className="h-10 w-10 mx-auto text-red-600" />
        <h1 className="text-2xl font-black text-dark">Acceso Restringido</h1>
        <p className="text-sm font-semibold text-dark/70">
          Esta sección es exclusiva para Administración y Moderación de Nuba Club.
        </p>
      </GlassCard>
    );
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'OVERVIEW', label: 'Control & Módulos', icon: Shield },
    { id: 'POSTS', label: 'Publicar (Streaming / TV / News)', icon: Sparkles },
    { id: 'FOOTBALL', label: 'Fútbol (Ligas / Equipos / Partidos)', icon: Trophy },
    { id: 'USERS', label: 'Cuentas Privadas', icon: Users },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-dark flex items-center gap-2">
            <Shield className="h-7 w-7 text-secondary" /> Central de Mando Admin
          </h1>
          <p className="text-sm font-semibold text-dark/70">
            Activá funciones en vivo, importá contenido de StreamFlex/NubaTV/TMDB y gestioná torneos y usuarios.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/polls">
            <SacButton size="sm" variant="glass">
              <BarChart3 className="h-3.5 w-3.5" /> Encuestas
            </SacButton>
          </Link>
          <Link href="/giveaways">
            <SacButton size="sm" variant="glass">
              <Gift className="h-3.5 w-3.5" /> Sorteos En Vivo
            </SacButton>
          </Link>
          <Link href="/support">
            <SacButton size="sm" variant="glass">
              <LifeBuoy className="h-3.5 w-3.5" /> Inbox Organizado
            </SacButton>
          </Link>
        </div>
      </div>

      {/* Selector de pestañas Admin */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs sm:text-sm font-black transition cursor-pointer ${
                active
                  ? 'bg-dark text-white border-dark shadow-[3px_3px_0_0_var(--color-primary)]'
                  : 'bg-glass text-dark border-dark/30 hover:bg-surface'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
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
