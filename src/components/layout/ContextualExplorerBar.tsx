'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Film,
  Filter,
  Flame,
  Gift,
  Hash,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  MessageCircle,
  Palette,
  Radio,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Tag,
  Trophy,
  Tv,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export function ContextualExplorerBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isStaff, settings } = useAuth();
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);

  const currentTopic = searchParams.get('topic') || 'ALL';
  const currentSubType = searchParams.get('subType') || 'ALL';
  const currentTag = searchParams.get('tag') || '';
  const currentTab = searchParams.get('tab') || 'FEED';

  useEffect(() => {
    if (pathname.startsWith('/feed')) {
      api
        .get('/posts/tags', {
          params: { topic: currentTopic !== 'ALL' ? currentTopic : undefined },
        })
        .then(({ data }) => {
          if (Array.isArray(data.tags)) {
            setPopularTags(data.tags);
          }
        })
        .catch(() => {});
    }
  }, [pathname, currentTopic]);

  // FEED PAGE CONTEXT
  if (pathname.startsWith('/feed')) {
    const hasActiveFilters =
      currentTopic !== 'ALL' ||
      currentSubType !== 'ALL' ||
      !!currentTag ||
      currentTab !== 'FEED';

    const buildFeedUrl = (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v || v === 'ALL' || (k === 'tab' && v === 'FEED')) {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      });
      const qs = params.toString();
      return qs ? `/feed?${qs}` : '/feed';
    };

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
            Canales temáticos y etiquetas
          </p>
        </div>

        {/* Clear Filters Button if any is active */}
        {hasActiveFilters && (
          <Link
            href="/feed"
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Limpiar todos los filtros</span>
          </Link>
        )}

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
                href={buildFeedUrl({ topic: cat.id, subType: null, tab: null })}
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

        {/* Sub-Filters: Shown when a specific topic is selected */}
        {currentTopic !== 'ALL' && (
          <div className="space-y-1 pt-1 border-t border-[var(--theme-border)]">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)] flex items-center justify-between">
              <span>Sub-categorías</span>
              <span className="text-[10px] font-semibold text-[var(--theme-primary)]">
                {currentTopic === 'FOOTBALL'
                  ? 'Fútbol'
                  : currentTopic === 'STREAMING'
                  ? 'Streaming'
                  : currentTopic === 'TV_CHANNELS'
                  ? 'TV'
                  : 'Noticias'}
              </span>
            </div>

            {/* Sub-options for FOOTBALL */}
            {currentTopic === 'FOOTBALL' && (
              <div className="space-y-0.5">
                {[
                  { id: 'ALL', label: 'Todo Fútbol', tab: 'FEED' },
                  { id: 'MATCH_FEATURE', label: 'Partidos en Vivo', tab: 'FEED' },
                  { id: 'FOOTBALL_POST', label: 'Crónicas y Resúmenes', tab: 'FEED' },
                  { id: 'ALL', label: '🏆 Tabla de Posiciones', tab: 'STANDINGS' },
                  { id: 'ALL', label: '🛡️ Equipos de la Liga', tab: 'TEAMS' },
                ].map((st, idx) => {
                  const active =
                    (st.tab === 'FEED' && currentTab === 'FEED' && currentSubType === st.id) ||
                    (st.tab !== 'FEED' && currentTab === st.tab);
                  return (
                    <Link
                      key={`${st.id}-${st.tab}-${idx}`}
                      href={buildFeedUrl({
                        subType: st.id === 'ALL' ? null : st.id,
                        tab: st.tab === 'FEED' ? null : st.tab,
                      })}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                        active
                          ? 'bg-[var(--theme-surface-hover)] text-[var(--theme-primary)] font-bold border-l-2 border-[var(--theme-primary)]'
                          : 'text-[var(--theme-muted)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)]'
                      )}
                    >
                      <span className="truncate">{st.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Sub-options for STREAMING */}
            {currentTopic === 'STREAMING' && (
              <div className="space-y-0.5">
                {[
                  { id: 'ALL', label: 'Todo Streaming' },
                  { id: 'MOVIE', label: 'Películas' },
                  { id: 'SERIES', label: 'Series' },
                  { id: 'ANIME', label: 'Animes' },
                ].map((st) => {
                  const active = currentSubType === st.id;
                  return (
                    <Link
                      key={st.id}
                      href={buildFeedUrl({ subType: st.id === 'ALL' ? null : st.id })}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                        active
                          ? 'bg-[var(--theme-surface-hover)] text-[var(--theme-primary)] font-bold border-l-2 border-[var(--theme-primary)]'
                          : 'text-[var(--theme-muted)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)]'
                      )}
                    >
                      <span className="truncate">{st.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Sub-options for TV_CHANNELS */}
            {currentTopic === 'TV_CHANNELS' && (
              <div className="space-y-0.5">
                {[
                  { id: 'ALL', label: 'Todos los Canales' },
                  { id: 'PLAYLIST_ADDED', label: 'Listas Agregadas' },
                  { id: 'CHANNEL_HIGHLIGHT', label: 'Canales Destacados' },
                ].map((st) => {
                  const active = currentSubType === st.id;
                  return (
                    <Link
                      key={st.id}
                      href={buildFeedUrl({ subType: st.id === 'ALL' ? null : st.id })}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                        active
                          ? 'bg-[var(--theme-surface-hover)] text-[var(--theme-primary)] font-bold border-l-2 border-[var(--theme-primary)]'
                          : 'text-[var(--theme-muted)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)]'
                      )}
                    >
                      <span className="truncate">{st.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Sub-options for NEWS */}
            {currentTopic === 'NEWS' && (
              <div className="space-y-0.5">
                {[
                  { id: 'ALL', label: 'Todas las Noticias' },
                  { id: 'PREMIUM', label: 'Cuentas Premium' },
                  { id: 'DEMO', label: 'Demos y Pruebas' },
                  { id: 'PROBLEM', label: 'Avisos del Club' },
                ].map((st) => {
                  const active = currentSubType === st.id;
                  return (
                    <Link
                      key={st.id}
                      href={buildFeedUrl({ subType: st.id === 'ALL' ? null : st.id })}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                        active
                          ? 'bg-[var(--theme-surface-hover)] text-[var(--theme-primary)] font-bold border-l-2 border-[var(--theme-primary)]'
                          : 'text-[var(--theme-muted)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)]'
                      )}
                    >
                      <span className="truncate">{st.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Popular Tags / Etiquetas */}
        <div className="space-y-2 pt-1 border-t border-[var(--theme-border)]">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" /> Etiquetas
            </span>
            {currentTag ? (
              <Link
                href={buildFeedUrl({ tag: null })}
                className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Quitar #{currentTag}
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1 px-1">
            {(popularTags.length > 0
              ? popularTags
              : [
                  { tag: 'futbol', count: 2 },
                  { tag: 'envivo', count: 1 },
                  { tag: 'estrenos', count: 1 },
                  { tag: '4k', count: 1 },
                  { tag: 'nubatv', count: 1 },
                  { tag: 'premium', count: 1 },
                  { tag: 'resumen', count: 1 },
                  { tag: 'peliculas', count: 1 },
                ]
            ).map((t) => {
              const active = currentTag.toLowerCase() === t.tag.toLowerCase();
              return (
                <Link
                  key={t.tag}
                  href={buildFeedUrl({ tag: active ? null : t.tag })}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer',
                    active
                      ? 'bg-[var(--theme-primary)] text-white shadow-2xs'
                      : 'bg-[var(--theme-surface-hover)] text-[var(--theme-dark)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-primary)] border border-[var(--theme-border)]'
                  )}
                  title={`Filtrar por #${t.tag}`}
                >
                  <span>#{t.tag}</span>
                  {active ? <span className="text-[10px] ml-0.5">✕</span> : null}
                </Link>
              );
            })}
          </div>
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
