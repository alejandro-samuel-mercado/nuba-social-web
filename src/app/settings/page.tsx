'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, Image as ImageIcon, KeyRound, LogOut, Palette, User as UserIcon } from 'lucide-react';
import { api, uploadImageWeb } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { WEB_THEMES, useTheme } from '@/providers/ThemeProvider';
import { NotificationPreference, ThemeName } from '@/types/nuba';
import { GlassCard, SacAvatar, SacButton, SacInput } from '@/components/ui/SacPrimitives';

const ACCENT_PRESETS = ['#2563eb', '#6366f1', '#e11d48', '#8b5cf6', '#10b981', '#0ea5e9', '#f59e0b'];

const PREF_LABELS: Array<{ key: keyof NotificationPreference; label: string; staffOnly?: boolean }> = [
  { key: 'footballPosts', label: '⚽ Publicaciones y partidos de Fútbol' },
  { key: 'streamingPosts', label: '🎬 Estrenos y títulos de Streaming' },
  { key: 'newsPosts', label: '📢 Noticias y anuncios del club' },
  { key: 'tvPosts', label: '📺 Listas y novedades de Canales TV' },
  { key: 'polls', label: '📊 Nuevas encuestas' },
  { key: 'giveaways', label: '🎁 Sorteos abiertos y resultados en vivo' },
  { key: 'directMessages', label: '📩 Respuestas en Chat Directo / Admin DM' },
  { key: 'topicChats', label: '💬 Mensajes en chats grupales por tema' },
  { key: 'adminSuggestions', label: '🚨 Alertas de sugerencias (Staff)', staffOnly: true },
  { key: 'pushEnabled', label: '🔔 Activar sistema general de alertas' },
];

export default function SettingsPage() {
  const { user, preferences, isStaff, updatePreferences, refreshSession, signOut } = useAuth();
  const { theme, customColor, setTheme, setCustomColor } = useTheme();

  const [hexDraft, setHexDraft] = useState(customColor || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setHexDraft(customColor || '');
  }, [customColor]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSelectTheme = async (next: ThemeName) => {
    setTheme(next);
    await api.patch('/auth/profile', { preferredTheme: next }).catch(() => {});
  };

  const handleApplyAccent = async (hex: string | null) => {
    setCustomColor(hex);
    setHexDraft(hex || '');
    await api.patch('/auth/profile', { customColor: hex }).catch(() => {});
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    try {
      await api.patch('/auth/profile', {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
      });
      await refreshSession();
      setNotice('Perfil actualizado correctamente.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el perfil.');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const url = await uploadImageWeb(file, 'avatars');
      await api.patch('/auth/profile', { avatarUrl: url });
      await refreshSession();
      setNotice('Foto de perfil actualizada.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo subir la imagen.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setNotice('Contraseña actualizada correctamente.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo cambiar la contraseña.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-blue-600" />
            <span>Personalización y Cuenta</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ajustá el tema visual, colores de acento, alertas y datos de perfil.
          </p>
        </div>

        <SacButton variant="danger" size="sm" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" /> Cerrar Sesión
        </SacButton>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* THEMES & ACCENTS */}
      <GlassCard className="p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Palette className="h-5 w-5 text-indigo-600" /> Temas Visuales
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WEB_THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => void handleSelectTheme(t.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-500 shadow-2xs'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.label}</span>
                  {active ? <Check className="h-4 w-4 text-blue-600" /> : null}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.tagline}</p>
                <div className="flex gap-1.5 mt-2.5">
                  {t.swatches.map((hex) => (
                    <span
                      key={hex}
                      style={{ backgroundColor: hex }}
                      className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700"
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Accent Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Color de acento personalizado
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => void handleApplyAccent(hex)}
                style={{ backgroundColor: hex }}
                className={`h-7 w-7 rounded-full transition-transform cursor-pointer ${
                  customColor?.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-blue-600 scale-110' : 'opacity-80 hover:opacity-100'
                }`}
                title={hex}
              />
            ))}

            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(hexDraft) ? hexDraft : '#2563eb'}
              onChange={(e) => void handleApplyAccent(e.target.value)}
              className="h-8 w-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
            />

            <input
              value={hexDraft}
              onChange={(e) => setHexDraft(e.target.value)}
              placeholder="#2563eb"
              className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
            />

            <SacButton
              size="sm"
              variant="primary"
              onClick={() => {
                if (/^#[0-9a-fA-F]{6}$/.test(hexDraft)) {
                  void handleApplyAccent(hexDraft);
                }
              }}
            >
              Aplicar
            </SacButton>

            {customColor ? (
              <SacButton size="sm" variant="glass" onClick={() => void handleApplyAccent(null)}>
                Restablecer
              </SacButton>
            ) : null}
          </div>
        </div>
      </GlassCard>

      {/* NOTIFICATION PREFERENCES */}
      <GlassCard className="p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" /> Preferencias de Notificaciones
        </h2>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {PREF_LABELS.filter((p) => !p.staffOnly || isStaff).map((item) => {
            const checked = Boolean(preferences[item.key]);
            return (
              <label
                key={item.key}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => void updatePreferences({ [item.key]: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </label>
            );
          })}
        </div>
      </GlassCard>

      {/* ACCOUNT & SECURITY */}
      <div className="grid sm:grid-cols-2 gap-5">
        <GlassCard className="p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-blue-600" /> Tu Perfil ({user?.role})
          </h2>

          <div className="flex items-center gap-3">
            <SacAvatar src={user?.avatarUrl} name={user?.displayName || 'N'} size={50} />
            <div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <ImageIcon className="h-3.5 w-3.5" /> Cambiar Foto
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <SacInput
              label="Nombre visible"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <SacInput
              label="Estado / Biografía"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fan del fútbol y streaming..."
            />
            <div className="flex justify-end pt-1">
              <SacButton type="submit" variant="primary" size="sm">
                Guardar Perfil
              </SacButton>
            </div>
          </form>
        </GlassCard>

        <GlassCard className="p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-500" /> Cambiar Contraseña
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <SacInput
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <SacInput
              label="Nueva contraseña (mín. 6)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            <div className="flex justify-end pt-1">
              <SacButton type="submit" variant="primary" size="sm">
                Actualizar Contraseña
              </SacButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
