'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  Film,
  Gift,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  Palette,
  Radio,
  Search,
  Sparkles,
  Trophy,
  Tv,
  X,
} from 'lucide-react';
import { api, resolveMediaUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme, WEB_THEMES } from '@/providers/ThemeProvider';
import { RadarSummary, TopicType } from '@/types/nuba';
import { SacAvatar } from '../ui/SacPrimitives';

export function MobileTopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, settings, unreadNotifications, unreadDirectMessages } = useAuth();
  const { theme, setTheme } = useTheme();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [radar, setRadar] = useState<RadarSummary | null>(null);

  const currentTopic = searchParams.get('topic') || 'ALL';

  useEffect(() => {
    api
      .get('/posts/radar')
      .then(({ data }) => setRadar(data))
      .catch(() => {});
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/feed?search=${encodeURIComponent(searchInput.trim())}`);
      setSearchOpen(false);
    }
  };

  const stories = [
    {
      id: 'ALL',
      label: 'Todos',
      sub: 'Feed Club',
      emoji: '✨',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600',
      activeColor: 'ring-blue-500',
      isLive: false,
      badge: null,
      href: '/feed',
    },
    {
      id: 'FOOTBALL',
      label: 'Fútbol',
      sub: radar?.liveMatches && radar.liveMatches.length > 0 ? 'EN VIVO' : 'Partidos',
      emoji: '⚽',
      icon: Trophy,
      color: 'from-emerald-500 to-teal-700',
      activeColor: 'ring-emerald-500',
      isLive: radar?.liveMatches ? radar.liveMatches.length > 0 : false,
      badge: radar?.liveMatches && radar.liveMatches.length > 0 ? `${radar.liveMatches.length} VIVO` : null,
      href: '/feed?topic=FOOTBALL',
    },
    {
      id: 'STREAMING',
      label: 'Estrenos',
      sub: 'Flex 4K',
      emoji: '🎬',
      icon: Film,
      color: 'from-violet-500 to-purple-800',
      activeColor: 'ring-violet-500',
      isLive: false,
      badge: '4K',
      href: '/feed?topic=STREAMING',
    },
    {
      id: 'TV_CHANNELS',
      label: 'NubaTV',
      sub: 'Canales',
      emoji: '📺',
      icon: Tv,
      color: 'from-cyan-500 to-blue-700',
      activeColor: 'ring-cyan-500',
      isLive: true,
      badge: 'HD',
      href: '/feed?topic=TV_CHANNELS',
    },
    {
      id: 'GIVEAWAY',
      label: 'Sorteos',
      sub: radar?.openGiveaways && radar.openGiveaways.length > 0 ? 'Abierto' : 'Premios',
      emoji: '🎁',
      icon: Gift,
      color: 'from-amber-500 to-rose-600',
      activeColor: 'ring-amber-500',
      isLive: radar?.openGiveaways ? radar.openGiveaways.length > 0 : false,
      badge: radar?.openGiveaways && radar.openGiveaways.length > 0 ? '¡HOY!' : null,
      href: '/giveaways',
    },
    {
      id: 'NEWS',
      label: 'Avisos',
      sub: 'Oficial',
      emoji: '📢',
      icon: Radio,
      color: 'from-rose-500 to-pink-600',
      activeColor: 'ring-rose-500',
      isLive: false,
      badge: null,
      href: '/feed?topic=NEWS',
    },
  ];

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-[var(--theme-surface)]/95 backdrop-blur-md border-b border-[var(--theme-border)] shadow-2xs">
      {/* Top Header: Instagram / TikTok style */}
      <div className="flex items-center justify-between px-3.5 py-2">
        {/* Brand with pulse */}
        <Link href="/feed" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            N
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-[var(--theme-dark)]">
                {settings.appName || 'Nuba Club'}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-[var(--theme-muted)] leading-none block">
              Comunidad Privada
            </span>
          </div>
        </Link>

        {/* Right Action Icons: Instagram / TikTok style */}
        <div className="flex items-center gap-1">
          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--theme-dark)] transition-colors cursor-pointer"
            title="Buscar avisos"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Theme Palette Switcher */}
          <button
            onClick={() => {
              const idx = WEB_THEMES.findIndex((t) => t.id === theme);
              const next = WEB_THEMES[(idx + 1) % WEB_THEMES.length];
              setTheme(next.id);
            }}
            className="p-2 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--theme-dark)] transition-transform active:rotate-45 cursor-pointer"
            title="Cambiar tema visual"
          >
            <Palette className="h-4 w-4" />
          </button>

          {/* Notification Bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--theme-dark)] transition-colors cursor-pointer"
            title="Alertas"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            ) : null}
          </Link>

          {/* Direct Staff DM / Support Icon */}
          <Link
            href="/support"
            className="relative p-2 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--theme-dark)] transition-colors cursor-pointer"
            title="Soporte y Consultas"
          >
            <LifeBuoy className="h-4 w-4" />
            {unreadDirectMessages > 0 ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600" />
            ) : null}
          </Link>

          {/* User Profile Avatar with Instagram Story Ring */}
          <Link href="/settings" className="pl-1">
            <div className="p-0.5 rounded-full ring-2 ring-[var(--theme-primary)]">
              <SacAvatar src={user?.avatarUrl} name={user?.displayName || 'Usuario'} size={28} />
            </div>
          </Link>
        </div>
      </div>

      {/* Expandable Search Input */}
      {searchOpen ? (
        <form onSubmit={handleSearchSubmit} className="px-3.5 pb-2.5 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[var(--theme-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar partidos, estrenos, canales, #tags..."
              className="w-full rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] pl-8 pr-8 py-1.5 text-xs text-[var(--theme-dark)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)]"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)] hover:text-[var(--theme-dark)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      ) : null}

      {/* =========================================================================
          INSTAGRAM / TIKTOK STORIES REEL (Channels, Live Signals, Giveaways)
          ========================================================================= */}
      <div className="flex items-center gap-3 overflow-x-auto px-3.5 py-2 scrollbar-none border-t border-[var(--theme-border)]/60">
        {stories.map((st) => {
          const isActive =
            (st.id === 'ALL' && pathname === '/feed' && currentTopic === 'ALL') ||
            (pathname === '/feed' && currentTopic === st.id) ||
            (st.id === 'GIVEAWAY' && pathname === '/giveaways');

          return (
            <Link
              key={st.id}
              href={st.href}
              className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
            >
              {/* Circular Story Bubble */}
              <div className="relative">
                <div
                  className={cn(
                    'p-[2px] rounded-full transition-transform active:scale-95',
                    isActive
                      ? 'ring-2 ring-[var(--theme-primary)] shadow-xs scale-105'
                      : 'ring-1.5 ring-[var(--theme-border)] group-hover:ring-[var(--theme-primary)]/60'
                  )}
                >
                  <div
                    className={cn(
                      'h-12 w-12 rounded-full flex items-center justify-center text-lg bg-gradient-to-tr text-white shadow-2xs',
                      st.color
                    )}
                  >
                    <span>{st.emoji}</span>
                  </div>
                </div>

                {/* Live or Hot Badge */}
                {st.badge ? (
                  <span
                    className={cn(
                      'absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full text-[8px] font-extrabold uppercase border-2 border-[var(--theme-surface)] shadow-2xs',
                      st.isLive
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-[var(--theme-primary)] text-white'
                    )}
                  >
                    {st.badge}
                  </span>
                ) : null}
              </div>

              {/* Label */}
              <div className="text-center w-14">
                <span
                  className={cn(
                    'block text-[11px] font-semibold truncate leading-tight',
                    isActive
                      ? 'text-[var(--theme-primary)] font-bold'
                      : 'text-[var(--theme-dark)]'
                  )}
                >
                  {st.label}
                </span>
                <span className="block text-[9px] text-[var(--theme-muted)] truncate leading-none">
                  {st.sub}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
