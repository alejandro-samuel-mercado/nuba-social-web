'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, Image as ImageIcon, KeyRound, LogOut, Palette, User as UserIcon } from 'lucide-react';
import { api, uploadImageWeb } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { WEB_THEMES, useTheme } from '@/providers/ThemeProvider';
import { NotificationPreference, ThemeName } from '@/types/nuba';
import { GlassCard, SacAvatar, SacButton, SacInput } from '@/components/ui/SacPrimitives';

const ACCENT_PRESETS = ['#e57a67', '#f472b6', '#8b5cf6', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444'];

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
      setNotice('Contraseña actualizada.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo cambiar la contraseña.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-dark">Personalización y Ajustes</h1>
          <p className="text-sm font-semibold text-dark/70">
            Elegí el estilo SAC de la app, colores personalizados y tus notificaciones.
          </p>
        </div>

        <SacButton variant="danger" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" /> Cerrar Sesión
        </SacButton>
      </div>

      {notice ? (
        <GlassCard className="p-3 bg-emerald-100 border-emerald-700 text-emerald-900 text-sm font-bold">
          {notice}
        </GlassCard>
      ) : null}
      {error ? (
        <GlassCard className="p-3 bg-red-100 border-red-600 text-red-800 text-sm font-bold">
          {error}
        </GlassCard>
      ) : null}

      {/* TEMAS SAC */}
      <GlassCard className="space-y-4">
        <h2 className="text-xl font-black text-dark flex items-center gap-2">
          <Palette className="h-5 w-5 text-secondary" /> Temas Visuales & Color Propio
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WEB_THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => void handleSelectTheme(t.id)}
                className={`rounded-3xl border-[2.5px] p-4 text-left transition-all cursor-pointer ${
                  active
                    ? 'border-dark bg-primary shadow-[4px_4px_0_0_var(--color-dark)]'
                    : 'border-dark/30 bg-white/80 hover:border-dark'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900">{t.label}</span>
                  {active ? <Check className="h-4 w-4 text-slate-900" /> : null}
                </div>
                <p className="text-xs font-semibold text-slate-600 mt-1">{t.tagline}</p>
                <div className="flex gap-1.5 mt-3">
                  {t.swatches.map((hex) => (
                    <span
                      key={hex}
                      style={{ backgroundColor: hex }}
                      className="h-5 w-5 rounded-full border border-slate-900/40"
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-dark/15 pt-4 space-y-2.5">
          <div className="text-xs font-black uppercase text-dark/70">Color de acento personalizado</div>
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENT_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => void handleApplyAccent(hex)}
                style={{ backgroundColor: hex }}
                className={`h-8 w-8 rounded-full border-2 cursor-pointer ${
                  customColor?.toLowerCase() === hex.toLowerCase() ? 'border-dark scale-110' : 'border-white shadow'
                }`}
                title={hex}
              />
            ))}

            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(hexDraft) ? hexDraft : '#e57a67'}
              onChange={(e) => void handleApplyAccent(e.target.value)}
              className="h-9 w-12 rounded-xl border-2 border-dark cursor-pointer bg-white p-0.5"
            />

            <input
              value={hexDraft}
              onChange={(e) => setHexDraft(e.target.value)}
              placeholder="#e57a67"
              className="w-28 rounded-full border-2 border-dark/60 bg-white px-3 py-1 text-xs font-black text-slate-900"
            />

            <SacButton
              size="sm"
              variant="secondary"
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

      {/* PREFERENCIAS DE NOTIFICACIONES */}
      <GlassCard className="space-y-4">
        <h2 className="text-xl font-black text-dark flex items-center gap-2">
          <Bell className="h-5 w-5 text-secondary" /> Preferencias de Notificaciones
        </h2>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {PREF_LABELS.filter((p) => !p.staffOnly || isStaff).map((item) => {
            const checked = Boolean(preferences[item.key]);
            return (
              <label
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dark/25 bg-white/85 px-4 py-3 cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-black text-slate-900">{item.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => void updatePreferences({ [item.key]: e.target.checked })}
                  className="h-4 w-4 accent-secondary"
                />
              </label>
            );
          })}
        </div>
      </GlassCard>

      {/* PERFIL Y SEGURIDAD */}
      <div className="grid md:grid-cols-2 gap-5">
        <GlassCard className="space-y-4">
          <h2 className="text-lg font-black text-dark flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-secondary" /> Tu Cuenta ({user?.role})
          </h2>
          <div className="flex items-center gap-3">
            <SacAvatar src={user?.avatarUrl} name={user?.displayName || 'N'} size={56} />
            <div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <SacButton size="sm" variant="glass" onClick={() => avatarRef.current?.click()}>
                <ImageIcon className="h-3.5 w-3.5" /> Cambiar Avatar
              </SacButton>
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
              label="Bio / estado"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ej: Fan del fútbol y streaming..."
            />
            <SacButton type="submit" variant="primary" size="sm">
              Guardar Perfil
            </SacButton>
          </form>
        </GlassCard>

        <GlassCard className="space-y-4">
          <h2 className="text-lg font-black text-dark flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-secondary" /> Cambiar Contraseña
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
              label="Nueva contraseña (mín. 6 caracteres)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            <SacButton type="submit" variant="secondary" size="sm">
              Actualizar Contraseña
            </SacButton>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
