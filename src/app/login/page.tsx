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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="flex justify-center gap-2">
          {WEB_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              title={t.label}
              style={{ backgroundColor: t.swatches[1] }}
              className={`h-6 w-6 rounded-full border-2 cursor-pointer transition-transform ${
                theme === t.id ? 'border-dark scale-125' : 'border-white/70 opacity-75'
              }`}
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          <SacBadge variant="primary">Comunidad Privada • Acceso Cerrado</SacBadge>
          <h1 className="font-display text-4xl font-black text-dark tracking-tight">Nuba Club</h1>
          <p className="text-sm font-semibold text-dark/70">
            Fútbol en vivo, estrenos Streaming, canales NubaTV, encuestas y sorteos.
          </p>
        </div>

        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl border-2 border-dark bg-secondary text-white flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-dark">Iniciar Sesión</h2>
              <p className="text-xs font-semibold text-dark/60">
                Ingresá con tu cuenta asignada por administración
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border-2 border-red-600 bg-red-100 px-3.5 py-2.5 text-xs font-bold text-red-800">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <SacInput
              label="Usuario o Email"
              placeholder="ej. admin o usuario1"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <span className="block text-xs font-black text-dark/90">Contraseña</span>
              <div className="flex gap-2">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border-2 border-dark/70 bg-white/90 px-4 py-2.5 text-sm font-semibold text-dark focus:outline-none focus:border-secondary"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="h-11 w-11 shrink-0 rounded-2xl border-2 border-dark/70 bg-surface flex items-center justify-center cursor-pointer"
                >
                  {showPass ? <EyeOff className="h-4 w-4 text-dark" /> : <Eye className="h-4 w-4 text-dark" />}
                </button>
              </div>
            </div>

            <SacButton type="submit" variant="secondary" size="lg" disabled={loading} className="w-full">
              <Sparkles className="h-4 w-4" />
              {loading ? 'Ingresando...' : 'Entrar al Club'}
            </SacButton>
          </form>

          <div className="flex items-start gap-2 rounded-2xl border border-dark/20 bg-surface/80 p-3 text-[11px] font-semibold text-dark/70">
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue mt-0.5" />
            <span>
              No existe registro público ni contenido visible sin iniciar sesión. Si necesitás una cuenta, solicitásela al administrador.
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
