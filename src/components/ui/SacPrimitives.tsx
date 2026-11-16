'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/api';

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('app-card p-5 transition-all duration-200', className)}>
      {children}
    </div>
  );
}

export function SacButton({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'glass' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary:
      'bg-[var(--theme-primary)] hover:brightness-110 text-white shadow-sm border border-black/10 active:scale-[0.98]',
    secondary:
      'bg-[var(--theme-secondary)] hover:brightness-110 text-white shadow-sm border border-black/10 active:scale-[0.98]',
    accent:
      'bg-[var(--theme-surface-hover)] text-[var(--theme-primary)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)] active:scale-[0.98]',
    glass:
      'bg-[var(--theme-surface-hover)] text-[var(--theme-dark)] border border-[var(--theme-border)] hover:brightness-95 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-[var(--theme-surface-hover)] text-[var(--theme-dark)] border border-[var(--theme-border-strong)] active:scale-[0.98]',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-700/30 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 font-medium',
    md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2 font-semibold',
    lg: 'px-5 py-2.5 text-sm sm:text-base rounded-xl gap-2.5 font-semibold',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none font-semibold',
        variants[variant],
        sizes[size],
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

export function SacBadge({
  children,
  className,
  variant = 'primary',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'dark';
}) {
  const variants = {
    primary:
      'bg-[var(--theme-surface-hover)] text-[var(--theme-primary)] border border-[var(--theme-border-strong)]',
    secondary:
      'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
    accent:
      'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
    outline:
      'bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)]',
    dark:
      'bg-slate-900 text-white border border-slate-700 dark:bg-white dark:text-slate-900',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-normal',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SacAvatar({
  src,
  name,
  size = 40,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const resolved = resolveMediaUrl(src);
  const initials = (name || 'N')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full border border-[var(--theme-border)] bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white flex items-center justify-center font-bold overflow-hidden shadow-xs"
    >
      {resolved ? (
        <img src={resolved} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: Math.max(11, Math.floor(size * 0.38)) }}>{initials}</span>
      )}
    </div>
  );
}

export function SacInput({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="block text-xs font-semibold text-[var(--theme-dark)] opacity-90">
          {label}
        </span>
      ) : null}
      <input
        className={cn(
          'w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3.5 py-2 text-sm text-[var(--theme-dark)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] transition-all shadow-2xs',
          className
        )}
        {...props}
      />
    </label>
  );
}
