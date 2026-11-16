'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Film,
  Flame,
  Gift,
  Hash,
  Home,
  LifeBuoy,
  MessageCircle,
  Palette,
  Radio,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  Tv,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { WEB_THEMES, useTheme } from '@/providers/ThemeProvider';
import { SacAvatar, SacBadge, SacButton } from '../ui/SacPrimitives';
import { CommunityPulseSidebar } from './CommunityPulseSidebar';
import { ContextualExplorerBar } from './ContextualExplorerBar';
import { MobileTopBar } from './MobileTopBar';
import { MobileBottomDock } from './MobileBottomDock';
import { MobileMenuSheet } from './MobileMenuSheet';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    loading,
    settings,
    unreadNotifications,
    unreadDirectMessages,
    isStaff,
    activeLiveDraw,
    dismissLiveDraw,
  } = useAuth();
  const { theme, setTheme } = useTheme();
  const [drawPhase, setDrawPhase] = useState<'SPIN' | 'DONE'>('SPIN');
  const [ticker, setTicker] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (!activeLiveDraw) return;
    setDrawPhase('SPIN');
    const pool = activeLiveDraw.participants.length
      ? activeLiveDraw.participants
      : [activeLiveDraw.winner];
    let idx = 0;
    const iv = setInterval(() => {
      idx += 1;
      const p = pool[idx % pool.length];
      setTicker(`${p.displayName} (@${p.username})`);
    }, 100);
    const tm = setTimeout(() => {
      clearInterval(iv);
      setDrawPhase('DONE');
    }, 3000);
    return () => {
      clearInterval(iv);
      clearTimeout(tm);
    };
  }, [activeLiveDraw]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--theme-background)]">
        <div className="app-card max-w-sm w-full p-8 text-center space-y-3">
          <div className="h-12 w-12 mx-auto rounded-full bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white flex items-center justify-center font-bold text-lg shadow-sm animate-pulse">
            N
          </div>
          <h2 className="text-base font-bold text-[var(--theme-dark)]">
            Nuba Club
          </h2>
          <p className="text-xs text-[var(--theme-muted)]">Conectando a la red privada...</p>
        </div>
      </div>
    );
  }

  // Global Primary App Shortcuts (Rail 1)
  const circularShortcuts = [
    { href: '/feed', label: 'Avisos & Feed', icon: Home },
    { href: '/chats', label: 'Salas de Chat', icon: MessageCircle },
    { href: '/polls', label: 'Encuestas', icon: BarChart3 },
    { href: '/giveaways', label: 'Sorteos en Vivo', icon: Gift },
    { href: '/support', label: 'Admin DM & Soporte', icon: LifeBuoy, badge: unreadDirectMessages },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--theme-background)] text-[var(--theme-dark)]">
      {/* =========================================================================
          TIER 1: ULTRA-MODERN CIRCULAR QUICK-ACCESS RAIL (Desktop Only, 68px)
          ========================================================================= */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-17 shrink-0 border-r border-[var(--theme-border)] bg-[var(--theme-surface)] py-4 z-40 sticky top-0 h-screen">
        <div className="flex flex-col items-center gap-3">
          {/* Circular Brand Core Icon */}
          <Link
            href="/feed"
            title="Nuba Club VIP"
            className="group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white font-bold text-lg shadow-sm hover:rounded-xl transition-all cursor-pointer"
          >
            <span>N</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[var(--theme-surface)]" />
          </Link>

          <div className="w-8 h-[1.5px] bg-[var(--theme-border)] my-1" />

          {/* Circular Global Nav Icons */}
          <div className="flex flex-col items-center gap-2.5">
            {circularShortcuts.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 cursor-pointer',
                    active
                      ? 'bg-[var(--theme-primary)] text-white shadow-xs scale-105'
                      : 'text-[var(--theme-muted)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)] hover:scale-105'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-[var(--theme-surface)]">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            {isStaff ? (
              <Link
                href="/admin"
                title="Panel de Control Admin"
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 cursor-pointer',
                  pathname.startsWith('/admin')
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-[var(--theme-muted)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)]'
                )}
              >
                <Shield className="h-5 w-5 text-indigo-500" />
              </Link>
            ) : null}
          </div>
        </div>

        {/* Bottom Actions: Theme Switcher & User Avatar */}
        <div className="flex flex-col items-center gap-3">
          {/* Notifications shortcut */}
          <Link
            href="/notifications"
            title="Centro de Alertas"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--theme-muted)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-600" />
            ) : null}
          </Link>

          {/* Theme Dial */}
          <button
            title="Cambiar Paleta de Color"
            onClick={() => {
              const idx = WEB_THEMES.findIndex((t) => t.id === theme);
              const next = WEB_THEMES[(idx + 1) % WEB_THEMES.length];
              setTheme(next.id);
            }}
            className="h-9 w-9 rounded-full bg-[var(--theme-surface-hover)] flex items-center justify-center text-[var(--theme-dark)] transition-transform active:rotate-45 cursor-pointer shadow-2xs border border-[var(--theme-border)]"
          >
            <Palette className="h-4 w-4" />
          </button>

          {/* User Avatar with Presence Ring */}
          <Link
            href="/settings"
            title={`${user.displayName} (@${user.username})`}
            className="relative group cursor-pointer"
          >
            <div className="p-0.5 rounded-full ring-2 ring-emerald-500/80 group-hover:ring-[var(--theme-primary)] transition-all">
              <SacAvatar src={user.avatarUrl} name={user.displayName} size={32} />
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[var(--theme-surface)]" />
          </Link>
        </div>
      </aside>

      {/* =========================================================================
          TIER 2: CONTEXTUAL EXPLORER BAR (Options, categories, filters for CURRENT page!)
          ========================================================================= */}
      <aside className="hidden lg:flex flex-col justify-between w-60 shrink-0 border-r border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sticky top-0 h-screen overflow-y-auto scrollbar-none z-30">
        <Suspense fallback={<div className="text-xs text-[var(--theme-muted)]">Cargando opciones...</div>}>
          <ContextualExplorerBar />
        </Suspense>

        {/* Ambient Network Status Indicator */}
        <div className="p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-1 mt-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--theme-muted)]">
            <span className="flex items-center gap-1.5 text-[var(--theme-dark)] font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Red Nuba
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% OK</span>
          </div>
          <p className="text-[10px] text-[var(--theme-muted)]">
            Fútbol, TV & Streaming conectados.
          </p>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP BAR (< lg) - Instagram / TikTok Style Top Bar & Stories Reel
          ========================================================================= */}
      <Suspense fallback={<div className="h-14 bg-[var(--theme-surface)] border-b border-[var(--theme-border)]" />}>
        <MobileTopBar />
      </Suspense>

      {/* =========================================================================
          TIER 3: CENTER STREAM + TIER 4: RIGHT COMMUNITY PULSE (Full Width Harmony)
          ========================================================================= */}
      <div className="flex-1 min-w-0 flex justify-between gap-6 px-3 sm:px-6 py-5 overflow-x-hidden">
        {/* Center Main Workstation */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-6">
          {/* Optional Global Announcement */}
          {settings.announcementBanner ? (
            <div className="mb-5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-between">
              <span>📢 {settings.announcementBanner}</span>
            </div>
          ) : null}

          {children}
        </main>

        {/* Right Community Pulse Sidebar (Desktop XL and up, fills the empty side!) */}
        <div className="hidden xl:block">
          <CommunityPulseSidebar />
        </div>
      </div>

      {/* =========================================================================
          MOBILE BOTTOM DOCK (< lg) - Facebook Style 5-Tab Bar
          ========================================================================= */}
      <MobileBottomDock onOpenMenu={() => setMobileMenuOpen(true)} />

      {/* =========================================================================
          MOBILE MENU SHEET (< lg) - Facebook Style Slide-Up Quick Access Menu
          ========================================================================= */}
      <MobileMenuSheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* =========================================================================
          LIVE DRAW MODAL
          ========================================================================= */}
      {activeLiveDraw ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="app-card max-w-md w-full p-6 text-center space-y-4 shadow-xl border-[var(--theme-border)] bg-[var(--theme-surface)] animate-in fade-in zoom-in-95 duration-200">
            <SacBadge variant="accent">🎁 Sorteo en Vivo</SacBadge>
            <h2 className="text-xl font-bold text-[var(--theme-dark)]">
              {activeLiveDraw.title}
            </h2>
            <p className="text-xs text-[var(--theme-muted)]">
              Premio: {activeLiveDraw.prizeDescription}
            </p>

            {drawPhase === 'SPIN' ? (
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] p-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary)]">
                  Mezclando participantes...
                </p>
                <p className="text-lg font-bold text-[var(--theme-dark)] animate-pulse">
                  {ticker}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 dark:border-emerald-800 p-6 flex flex-col items-center gap-2">
                <Trophy className="h-8 w-8 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  ¡Ganador Oficial!
                </span>
                <SacAvatar
                  src={activeLiveDraw.winner.avatarUrl}
                  name={activeLiveDraw.winner.displayName}
                  size={56}
                />
                <p className="text-lg font-bold text-[var(--theme-dark)]">
                  {activeLiveDraw.winner.displayName}
                </p>
                <p className="text-xs text-[var(--theme-muted)]">
                  @{activeLiveDraw.winner.username}
                </p>
              </div>
            )}

            <SacButton
              variant="glass"
              onClick={dismissLiveDraw}
              className="w-full"
            >
              Cerrar
            </SacButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
