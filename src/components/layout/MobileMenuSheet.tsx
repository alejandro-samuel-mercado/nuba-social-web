'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Film,
  Gift,
  KeyRound,
  LifeBuoy,
  LogOut,
  MessageCircle,
  Palette,
  Shield,
  Sparkles,
  Trophy,
  Tv,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme, WEB_THEMES } from '@/providers/ThemeProvider';
import { SacAvatar } from '../ui/SacPrimitives';

export function MobileMenuSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, isStaff, signOut, settings } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Container: Facebook Mobile Style */}
      <div className="bg-[var(--theme-surface)] rounded-t-3xl border-t border-[var(--theme-border)] max-h-[85vh] overflow-y-auto p-4 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-250">
        {/* Handle / Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
          <div className="w-8" />
          <div className="w-10 h-1 rounded-full bg-[var(--theme-border-strong)] opacity-50" />
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--theme-surface-hover)] text-[var(--theme-muted)] hover:text-[var(--theme-dark)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card (Facebook Profile Banner Style) */}
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-0.5 rounded-full ring-2 ring-[var(--theme-primary)]">
              <SacAvatar src={user?.avatarUrl} name={user?.displayName || 'Usuario'} size={44} />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--theme-dark)] flex items-center gap-1.5">
                <span>{user?.displayName || 'Mi Perfil'}</span>
                {isStaff && user?.role ? (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {user.role}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[var(--theme-muted)]">@{user?.username || 'usuario'}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[var(--theme-primary)] group-hover:underline">
            Ver perfil →
          </span>
        </Link>

        {/* Quick Grid Shortcuts (2 Columns, Facebook Style) */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-muted)] block mb-2 px-1">
            Accesos Rápidos
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {isStaff ? (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100 transition-colors"
              >
                <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">
                    Panel Staff
                  </span>
                  <span className="block text-[10px] text-indigo-700/80 dark:text-indigo-400 truncate">
                    Control club
                  </span>
                </div>
              </Link>
            ) : null}

            <Link
              href="/support"
              onClick={onClose}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface)] transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[var(--theme-dark)] truncate">
                  Soporte & DMs
                </span>
                <span className="block text-[10px] text-[var(--theme-muted)] truncate">
                  Ayuda oficial
                </span>
              </div>
            </Link>

            <Link
              href="/chats"
              onClick={onClose}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface)] transition-colors"
            >
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[var(--theme-dark)] truncate">
                  Salas Comunitarias
                </span>
                <span className="block text-[10px] text-[var(--theme-muted)] truncate">
                  4 temáticas
                </span>
              </div>
            </Link>

            <Link
              href="/feed?topic=TV_CHANNELS"
              onClick={onClose}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface)] transition-colors"
            >
              <div className="p-2 rounded-lg bg-cyan-600 text-white shrink-0">
                <Tv className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[var(--theme-dark)] truncate">
                  Canales NubaTV
                </span>
                <span className="block text-[10px] text-[var(--theme-muted)] truncate">
                  Señales en HD
                </span>
              </div>
            </Link>

            <Link
              href="/polls"
              onClick={onClose}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface)] transition-colors"
            >
              <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[var(--theme-dark)] truncate">
                  Encuestas
                </span>
                <span className="block text-[10px] text-[var(--theme-muted)] truncate">
                  Votaciones en vivo
                </span>
              </div>
            </Link>

            <Link
              href="/giveaways"
              onClick={onClose}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface)] transition-colors"
            >
              <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
                <Gift className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[var(--theme-dark)] truncate">
                  Sorteos VIP
                </span>
                <span className="block text-[10px] text-[var(--theme-muted)] truncate">
                  Ruleta de premios
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Theme Swatch Selector */}
        <div className="p-3.5 rounded-2xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--theme-dark)]">
            <span className="flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-[var(--theme-primary)]" />
              <span>Tema Visual</span>
            </span>
            <span className="text-[11px] font-semibold text-[var(--theme-primary)] capitalize">
              {WEB_THEMES.find((t) => t.id === theme)?.label}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {WEB_THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'p-2 rounded-xl flex flex-col items-center gap-1 transition-all border cursor-pointer',
                    active
                      ? 'border-[var(--theme-primary)] bg-[var(--theme-surface)] shadow-xs scale-105'
                      : 'border-transparent hover:bg-[var(--theme-surface)]/60'
                  )}
                >
                  <div
                    style={{ backgroundColor: t.swatches[0] }}
                    className="h-6 w-6 rounded-full shadow-2xs border border-black/10 flex items-center justify-center text-white"
                  >
                    {active ? <CheckCircle2 className="h-3 w-3" /> : null}
                  </div>
                  <span className="text-[9px] font-bold text-[var(--theme-dark)] truncate w-full text-center">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings & Logout Actions */}
        <div className="space-y-1.5 pt-1">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-xl text-xs font-semibold text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-[var(--theme-muted)]" />
              <span>Configuración & Seguridad</span>
            </div>
            <span>→</span>
          </Link>

          <button
            onClick={() => {
              onClose();
              void signOut();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
