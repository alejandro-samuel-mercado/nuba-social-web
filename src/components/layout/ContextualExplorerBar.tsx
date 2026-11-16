'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Film,
  Flame,
  Gift,
  Hash,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  MessageCircle,
  Palette,
  Radio,
  Search,
  Shield,
  Sparkles,
  Trophy,
  Tv,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

export function ContextualExplorerBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isStaff, settings } = useAuth();

  // FEED PAGE CONTEXT
  if (pathname.startsWith('/feed')) {
    const currentTopic = searchParams.get('topic') || 'ALL';
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)]">
              Explorador de Avisos
            </span>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-[var(--theme-muted)]">
            Categorías y canales oficiales
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Categorías
          </div>
          {[
            { id: 'ALL', label: 'Todos los Avisos', icon: Hash },
            { id: 'FOOTBALL', label: 'Fútbol en Vivo', icon: Trophy, badge: '⚽' },
            { id: 'STREAMING', label: 'Estrenos Streaming', icon: Film, badge: '🎬' },
            { id: 'TV_CHANNELS', label: 'Canales NubaTV', icon: Tv, badge: '📺' },
            { id: 'NEWS', label: 'Noticias del Club', icon: Sparkles, badge: '📢' },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = currentTopic === cat.id;
            return (
              <Link
                key={cat.id}
                href={cat.id === 'ALL' ? '/feed' : `/feed?topic=${cat.id}`}
                className={cn(
                  'flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  active
                    ? 'bg-[var(--theme-primary)] text-white shadow-2xs'
                    : 'text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)]'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span>{cat.label}</span>
                </div>
                {cat.badge ? (
                  <span className="text-[11px]">{cat.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Quick Filter Info */}
        <div className="p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1.5 text-xs">
          <span className="font-bold text-[var(--theme-dark)] flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-rose-500" /> Transmisión Directa
          </span>
          <p className="text-[11px] text-[var(--theme-muted)] leading-relaxed">
            Señales en HD y 4K con enlaces directos para miembros registrados.
          </p>
        </div>
      </div>
    );
  }

  // CHATS PAGE CONTEXT
  if (pathname.startsWith('/chats')) {
    const currentTopic = (searchParams.get('topic') || 'FOOTBALL').toUpperCase();
    return (
      <div className="space-y-4">
        <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)]">
              Salas Comunitarias
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-full">
              4 Salas
            </span>
          </div>
          <p className="text-[11px] text-[var(--theme-muted)]">
            Conversaciones por temática
          </p>
        </div>

        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Salas Abiertas
          </div>
          {[
            { id: 'FOOTBALL', label: 'Sala de Fútbol', emoji: '⚽', desc: 'Partidos y goles' },
            { id: 'STREAMING', label: 'Sala de Streaming', emoji: '🎬', desc: 'Series y estrenos' },
            { id: 'TV_CHANNELS', label: 'Sala Canales TV', emoji: '📺', desc: 'Señales y pedidos' },
            { id: 'NEWS', label: 'Sala Anuncios', emoji: '📢', desc: 'Comunidad' },
          ].map((r) => {
            const active = currentTopic === r.id;
            return (
              <Link
                key={r.id}
                href={`/chats?topic=${r.id}`}
                className={cn(
                  'flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  active
                    ? 'bg-[var(--theme-primary)] text-white shadow-2xs'
                    : 'text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{r.emoji}</span>
                  <div className="min-w-0">
                    <span className="block truncate">{r.label}</span>
                    <span className={cn('block text-[10px] truncate', active ? 'text-white/80' : 'text-[var(--theme-muted)]')}>
                      {r.desc}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1 text-xs">
          <span className="font-bold text-[var(--theme-dark)] flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Stickers & Sugerencias
          </span>
          <p className="text-[11px] text-[var(--theme-muted)] leading-relaxed">
            Podés enviar sugerencias marcadas para que el staff las priorice.
          </p>
        </div>
      </div>
    );
  }

  // POLLS PAGE CONTEXT
  if (pathname.startsWith('/polls')) {
    return (
      <div className="space-y-4">
        <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)] block">
            Votaciones del Club
          </span>
          <p className="text-[11px] text-[var(--theme-muted)]">
            Decisiones de la comunidad
          </p>
        </div>

        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Opciones
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-[var(--theme-dark)] font-medium">
              <span>🟢 Voto en Tiempo Real</span>
              <span className="font-bold">Activo</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--theme-dark)] font-medium">
              <span>🔒 Cómputo Automático</span>
              <span className="font-bold">100%</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1 text-xs">
          <span className="font-bold text-[var(--theme-dark)]">¿Cómo funciona?</span>
          <p className="text-[11px] text-[var(--theme-muted)] leading-relaxed">
            Las encuestas cerradas determinan qué eventos deportivos y estrenos se transmiten primero.
          </p>
        </div>
      </div>
    );
  }

  // GIVEAWAYS PAGE CONTEXT
  if (pathname.startsWith('/giveaways')) {
    return (
      <div className="space-y-4">
        <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)] block">
            Arena de Sorteos
          </span>
          <p className="text-[11px] text-[var(--theme-muted)]">
            Cuentas VIP y accesos
          </p>
        </div>

        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Mecánica Oficial
          </div>
          <div className="p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-medium text-[var(--theme-dark)]">
              <span>1️⃣</span>
              <span>Anotate gratis con 1 clic</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-[var(--theme-dark)]">
              <span>2️⃣</span>
              <span>Seguí el sorteo de la ruleta</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-[var(--theme-dark)]">
              <span>3️⃣</span>
              <span>Reclamá por DM privado</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUPPORT PAGE CONTEXT
  if (pathname.startsWith('/support')) {
    return (
      <div className="space-y-4">
        <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)] block">
            Canal de Soporte
          </span>
          <p className="text-[11px] text-[var(--theme-muted)]">
            Mensajes directos al staff
          </p>
        </div>

        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Temas Disponibles
          </div>
          {[
            { label: 'Soporte Técnico', icon: '🛠️' },
            { label: 'Sugerir Contenido', icon: '💡' },
            { label: 'Reportar Señal', icon: '🚨' },
            { label: 'Reclamar Premio', icon: '🎁' },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--theme-dark)] bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]"
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ADMIN PAGE CONTEXT
  if (pathname.startsWith('/admin')) {
    return (
      <div className="space-y-4">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
            Central Staff
          </span>
          <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400">
            Módulos de administración
          </p>
        </div>

        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Módulos
          </div>
          {[
            { label: 'Control & Módulos', icon: Shield },
            { label: 'Publicar Contenido', icon: Sparkles },
            { label: 'Gestión Fútbol', icon: Trophy },
            { label: 'Cuentas Privadas', icon: Users },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer"
              >
                <Icon className="h-4 w-4 text-indigo-500" />
                <span>{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SETTINGS PAGE CONTEXT
  if (pathname.startsWith('/settings')) {
    return (
      <div className="space-y-4">
        <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)] block">
            Configuración
          </span>
          <p className="text-[11px] text-[var(--theme-muted)]">
            Personalización de cuenta
          </p>
        </div>

        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Secciones
          </div>
          {[
            { label: 'Temas & Colores', icon: Palette },
            { label: 'Notificaciones', icon: Bell },
            { label: 'Tu Perfil', icon: User },
            { label: 'Seguridad', icon: KeyRound },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer"
              >
                <Icon className="h-4 w-4 text-blue-500" />
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // DEFAULT
  return (
    <div className="space-y-3">
      <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]">
        <span className="text-xs font-bold text-[var(--theme-dark)] block">
          {settings.appName || 'Nuba Club'}
        </span>
        <span className="text-[10px] text-[var(--theme-muted)]">Comunidad Privada</span>
      </div>
    </div>
  );
}
