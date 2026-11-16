'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { WEB_THEMES, useTheme } from '@/providers/ThemeProvider';
import { GlassCard, SacBadge, SacButton, SacInput } from '@/components/ui/SacPrimitives';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/feed');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
      router.replace('/feed');
    } catch (err: any) {
      setError(err?.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--theme-background)] text-[var(--theme-dark)]">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white items-center justify-center font-bold text-xl shadow-md shadow-blue-500/25 mb-1">
            N
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Nuba Club
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Avisos de Fútbol en vivo, estrenos Streaming, Canales TV, sorteos y comunidad privada.
          </p>
        </div>

        {/* Login Card */}
        <GlassCard className="p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-slate-500">
              Ingresá con las credenciales provistas por la administración
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <SacInput
              label="Usuario o Email"
              placeholder="ej. admin o usuario1"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contraseña
              </span>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <SacButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full font-semibold"
            >
              {loading ? 'Verificando...' : 'Entrar al Club'}
            </SacButton>
          </form>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Acceso exclusivo. Si no contás con una cuenta, contactá al administrador.
            </span>
          </div>
        </GlassCard>

        {/* Theme Swatches */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Tema:</span>
          {WEB_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              title={t.label}
              style={{ backgroundColor: t.swatches[1] }}
              className={`h-4 w-4 rounded-full border transition-all cursor-pointer ${
                theme === t.id
                  ? 'ring-2 ring-blue-500 scale-125 border-white'
                  : 'border-slate-300 opacity-60 hover:opacity-100'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
