'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Gift,
  Home,
  LifeBuoy,
  MessageCircle,
  Palette,
  Settings,
  Shield,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { WEB_THEMES, useTheme } from '@/providers/ThemeProvider';
import { SacAvatar, SacBadge, SacButton } from '../ui/SacPrimitives';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, settings, unreadNotifications, unreadDirectMessages, isStaff, activeLiveDraw, dismissLiveDraw } =
    useAuth();
  const { theme, setTheme } = useTheme();
  const [drawPhase, setDrawPhase] = useState<'SPIN' | 'DONE'>('SPIN');
  const [ticker, setTicker] = useState('');

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="sac-card rounded-3xl px-8 py-6 text-center space-y-2">
          <div className="font-display text-2xl font-black text-dark">Nuba Club</div>
          <p className="text-sm font-semibold text-dark/60">Verificando sesión privada...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/feed', label: 'Avisos', icon: Home },
    { href: '/chats', label: 'Chats', icon: MessageCircle },
    { href: '/polls', label: 'Encuestas', icon: BarChart3 },
    { href: '/giveaways', label: 'Sorteos', icon: Gift },
    { href: '/support', label: 'Admin DM', icon: LifeBuoy, badge: unreadDirectMessages },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      {/* Mobile Compact Header (< md) */}
      <header className="flex md:hidden sticky top-3 z-40 mx-auto w-[95%] items-center justify-between rounded-full sac-card px-4 py-2 mt-3">
        <Link href="/feed" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl border-2 border-dark bg-primary text-dark flex items-center justify-center font-black text-base">
            N
          </span>
          <span className="font-display text-base font-black tracking-tight text-dark">
            {settings.appName}
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href="/support"
            className="relative h-8 w-8 rounded-full border-2 border-dark/40 bg-surface flex items-center justify-center"
            title="Admin DM & Sugerencias"
          >
            <LifeBuoy className="h-3.5 w-3.5 text-dark" />
            {unreadDirectMessages > 0 ? (
              <span className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                {unreadDirectMessages}
              </span>
            ) : null}
          </Link>

          <button
            title="Rotar Tema Rápido"
            onClick={() => {
              const idx = WEB_THEMES.findIndex((t) => t.id === theme);
              const next = WEB_THEMES[(idx + 1) % WEB_THEMES.length];
              setTheme(next.id);
            }}
            className="h-8 w-8 rounded-full border-2 border-dark/40 bg-surface flex items-center justify-center cursor-pointer"
          >
            <Palette className="h-3.5 w-3.5 text-dark" />
          </button>

          <Link
            href="/notifications"
            className="relative h-8 w-8 rounded-full border-2 border-dark/40 bg-surface flex items-center justify-center"
            title="Notificaciones"
          >
            <Bell className="h-3.5 w-3.5 text-dark" />
            {unreadNotifications > 0 ? (
              <span className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                {unreadNotifications}
              </span>
            ) : null}
          </Link>

          <Link href="/settings">
            <SacAvatar src={user.avatarUrl} name={user.displayName} size={32} />
          </Link>
        </div>
      </header>

      {/* TopNav Flotante estilo SAC */}
      <header className="hidden md:flex sticky top-4 z-40 mx-auto w-[95%] max-w-6xl items-center justify-between rounded-full sac-card px-5 py-2.5 mt-4">
        <Link href="/feed" className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-2xl border-2 border-dark bg-primary text-dark flex items-center justify-center font-black text-lg">
            N
          </span>
          <span className="font-display text-xl font-black tracking-tight text-dark">
            {settings.appName}
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition-all',
                  active
                    ? 'bg-secondary text-white border-2 border-dark shadow-[2px_2px_0_0_var(--color-dark)]'
                    : 'text-dark/80 hover:bg-surface'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] text-white font-black">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          {isStaff ? (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black border-2 border-dark transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-dark text-white'
                  : 'bg-primary text-dark hover:brightness-95'
              )}
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <button
            title="Rotar Tema Rápido"
            onClick={() => {
              const idx = WEB_THEMES.findIndex((t) => t.id === theme);
              const next = WEB_THEMES[(idx + 1) % WEB_THEMES.length];
              setTheme(next.id);
            }}
            className="h-9 w-9 rounded-full border-2 border-dark/40 bg-surface flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
          >
            <Palette className="h-4 w-4 text-dark" />
          </button>

          <Link
            href="/notifications"
            className="relative h-9 w-9 rounded-full border-2 border-dark/40 bg-surface flex items-center justify-center hover:bg-primary transition-colors"
          >
            <Bell className="h-4 w-4 text-dark" />
            {unreadNotifications > 0 ? (
              <span className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1.5 text-[10px] font-black text-white">
                {unreadNotifications}
              </span>
            ) : null}
          </Link>

          <Link href="/settings" className="flex items-center gap-2 pl-1">
            <SacAvatar src={user.avatarUrl} name={user.displayName} size={36} />
          </Link>
        </div>
      </header>

      {/* Banner Global */}
      {settings.announcementBanner ? (
        <div className="mx-auto mt-4 w-[95%] max-w-6xl rounded-full border-2 border-dark bg-primary px-5 py-2 text-center text-xs font-black text-dark shadow-[3px_3px_0_0_var(--color-dark)]">
          ✨ {settings.announcementBanner}
        </div>
      ) : null}

      <main className="mx-auto w-[95%] max-w-6xl pt-5">{children}</main>

      {/* Mobile Bottom Pill Bar estilo SAC */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-full sac-card px-2 py-2 flex items-center justify-around">
        {[
          ...navItems.slice(0, 4),
          isStaff ? { href: '/admin', label: 'Admin', icon: Shield } : { href: '/settings', label: 'Ajustes', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center rounded-full px-3 py-1.5 text-[10px] font-black transition-all',
                active ? 'bg-secondary text-white border-2 border-dark' : 'text-dark/75'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Ruleta En Vivo Modal Global */}
      {activeLiveDraw ? (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sac-card rounded-[2.5rem] p-6 max-w-md w-full text-center space-y-4 bg-white">
            <SacBadge variant="secondary">🎁 Sorteo en Vivo</SacBadge>
            <h2 className="text-2xl font-black text-dark">{activeLiveDraw.title}</h2>
            <p className="text-sm font-bold text-dark/70">Premio: {activeLiveDraw.prizeDescription}</p>
            {drawPhase === 'SPIN' ? (
              <div className="rounded-3xl border-2 border-dark bg-surface p-6 space-y-2">
                <p className="text-xs font-black uppercase text-dark/60">Mezclando participantes...</p>
                <p className="text-xl font-black text-secondary">{ticker}</p>
              </div>
            ) : (
              <div className="rounded-3xl border-[3px] border-dark bg-primary p-6 flex flex-col items-center gap-2">
                <Trophy className="h-10 w-10 text-dark" />
                <span className="text-xs font-black uppercase tracking-wider text-dark">¡GANADOR OFICIAL!</span>
                <SacAvatar src={activeLiveDraw.winner.avatarUrl} name={activeLiveDraw.winner.displayName} size={64} />
                <p className="text-xl font-black text-dark">{activeLiveDraw.winner.displayName}</p>
                <p className="text-sm font-bold text-dark/70">@{activeLiveDraw.winner.username}</p>
              </div>
            )}
            <SacButton variant="glass" onClick={dismissLiveDraw} className="w-full">
              Cerrar
            </SacButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
