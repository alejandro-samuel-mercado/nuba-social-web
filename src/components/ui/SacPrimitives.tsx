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
    <div className={cn('sac-card rounded-[2rem] p-5 transition-all', className)}>
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
    primary: 'bg-primary text-dark border-[2.5px] border-dark shadow-[3px_3px_0_0_var(--color-dark)]',
    secondary: 'bg-secondary text-white border-[2.5px] border-dark shadow-[3px_3px_0_0_var(--color-dark)]',
    accent: 'bg-tertiary text-slate-900 border-[2.5px] border-dark shadow-[3px_3px_0_0_var(--color-dark)]',
    glass: 'bg-glass text-dark border-2 border-dark/40 hover:bg-surface',
    outline: 'bg-transparent text-dark border-2 border-dark hover:bg-surface',
    danger: 'bg-red-600 text-white border-[2.5px] border-dark shadow-[3px_3px_0_0_var(--color-dark)]',
  };
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97, y: 1 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition-all disabled:opacity-50 cursor-pointer',
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
    primary: 'bg-primary text-dark border-dark',
    secondary: 'bg-secondary text-white border-dark',
    accent: 'bg-tertiary text-slate-900 border-dark',
    outline: 'bg-surface text-dark border-dark/30',
    dark: 'bg-dark text-white border-dark',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-2 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider',
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
      className="shrink-0 rounded-full border-2 border-dark bg-primary text-dark flex items-center justify-center font-black overflow-hidden"
    >
      {resolved ? (
        <img src={resolved} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: Math.max(11, Math.floor(size * 0.36)) }}>{initials}</span>
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
      {label ? <span className="block text-xs font-black tracking-wide text-dark/90">{label}</span> : null}
      <input
        className={cn(
          'w-full rounded-2xl border-2 border-dark/70 bg-white/90 px-4 py-2.5 text-sm font-semibold text-dark placeholder:text-dark/45 focus:outline-none focus:border-secondary',
          className
        )}
        {...props}
      />
    </label>
  );
}
