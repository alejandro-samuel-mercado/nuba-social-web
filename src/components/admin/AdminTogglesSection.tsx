'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, LifeBuoy, Plus, Shield, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { SystemSettings } from '@/types/nuba';
import { GlassCard, SacButton, SacInput } from '@/components/ui/SacPrimitives';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  pendingPosts: number;
  liveMatches: number;
  upcomingMatches: number;
  openPolls: number;
  openGiveaways: number;
  unreadThreads: number;
}

interface RestrictedWord {
  id: string;
  word: string;
}

const FEATURE_SWITCHES: Array<{ key: keyof SystemSettings; label: string }> = [
  { key: 'chatsEnabled', label: '💬 Salas de Chat por Tema' },
  { key: 'commentsEnabled', label: '💭 Comentarios en Publicaciones' },
  { key: 'likesEnabled', label: '👍 Reacciones / Likes' },
  { key: 'ratingsEnabled', label: '⭐ Calificaciones (1 a 5★)' },
  { key: 'pollsEnabled', label: '📊 Encuestas Interactivas' },
  { key: 'giveawaysEnabled', label: '🎁 Sorteos de Cuentas' },
  { key: 'historyEnabled', label: '🏆 Historial Público de Sorteos y Ganadores' },
  { key: 'directChatEnabled', label: '📩 Chat Directo & Sugerencias al Admin' },
  { key: 'chatImagesEnabled', label: '🖼️ Imágenes en Chats Grupales' },
  { key: 'blockLinksInComments', label: '🔗 Bloquear URLs en Comentarios y Chats' },
];

export function AdminTogglesSection() {
  const { settings, setSettings, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [words, setWords] = useState<RestrictedWord[]>([]);
  const [newWord, setNewWord] = useState('');

  const [banner, setBanner] = useState(settings.announcementBanner || '');
  const [appName, setAppName] = useState(settings.appName);
  const [maxLen, setMaxLen] = useState(String(settings.maxCommentLength));
  const [commentCooldown, setCommentCooldown] = useState(String(settings.commentCooldownSec));
  const [imgCooldown, setImgCooldown] = useState(String(settings.chatImageCooldownSec));
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [dashRes, setRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/settings'),
      ]);
      setStats(dashRes.data.stats || null);
      if (setRes.data.settings) {
        const s: SystemSettings = setRes.data.settings;
        setSettings(s);
        setBanner(s.announcementBanner || '');
        setAppName(s.appName);
        setMaxLen(String(s.maxCommentLength));
        setCommentCooldown(String(s.commentCooldownSec));
        setImgCooldown(String(s.chatImageCooldownSec));
      }
      setWords(setRes.data.restrictedWords || []);
    } catch (e: any) {
      setErr(e?.message || 'Error al cargar panel.');
    }
  }, [setSettings]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const toggleSetting = async (key: keyof SystemSettings, value: boolean) => {
    if (!isAdmin) return;
    setErr(null);
    setMsg(null);
    try {
      const { data } = await api.put('/admin/settings', { [key]: value });
      if (data?.settings) setSettings(data.settings);
      setMsg('Configuración actualizada al instante.');
    } catch (e: any) {
      setErr(e?.message || 'Solo Admin/Superadmin puede cambiar ajustes globales.');
    }
  };

  const saveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setErr(null);
    setMsg(null);
    try {
      const { data } = await api.put('/admin/settings', {
        appName: appName.trim() || 'Nuba Club',
        announcementBanner: banner.trim() || null,
        maxCommentLength: Number(maxLen) || 400,
        commentCooldownSec: Number(commentCooldown) || 5,
        chatImageCooldownSec: Number(imgCooldown) || 45,
      });
      if (data?.settings) setSettings(data.settings);
      setMsg('Límites y banner guardados.');
    } catch (e: any) {
      setErr(e?.message || 'Error guardando límites.');
    }
  };

  const addWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    setErr(null);
    try {
      const { data } = await api.post('/admin/restricted-words', { word: newWord.trim() });
      setNewWord('');
      if (data?.word) {
        setWords((prev) =>
          prev.some((w) => w.id === data.word.id) ? prev : [...prev, data.word]
        );
      }
    } catch (e: any) {
      setErr(e?.message || 'No se pudo agregar la palabra.');
    }
  };

  const deleteWord = async (id: string) => {
    await api.delete(`/admin/restricted-words/${id}`);
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="space-y-5">
      {msg ? (
        <GlassCard className="p-3 bg-emerald-100 border-emerald-700 text-emerald-900 text-sm font-bold">
          {msg}
        </GlassCard>
      ) : null}
      {err ? (
        <GlassCard className="p-3 bg-red-100 border-red-600 text-red-800 text-sm font-bold">
          {err}
        </GlassCard>
      ) : null}

      {/* Métricas */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-black text-dark">{stats.activeUsers}/{stats.totalUsers}</div>
            <div className="text-xs font-extrabold text-dark/65">Usuarios activos</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-black text-dark">{stats.totalPosts}</div>
            <div className="text-xs font-extrabold text-dark/65">Publicaciones ({stats.pendingPosts} pend.)</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-black text-secondary">{stats.liveMatches}</div>
            <div className="text-xs font-extrabold text-dark/65">Partidos EN VIVO ({stats.upcomingMatches} próx.)</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-black text-dark">{stats.openPolls} / {stats.openGiveaways}</div>
            <div className="text-xs font-extrabold text-dark/65">Encuestas / Sorteos abiertos</div>
          </GlassCard>
          <Link href="/support">
            <GlassCard className="p-4 text-center hover:bg-primary/40 cursor-pointer">
              <div className="text-2xl font-black text-red-600">{stats.unreadThreads}</div>
              <div className="text-xs font-extrabold text-dark/80 flex items-center justify-center gap-1">
                <LifeBuoy className="h-3.5 w-3.5" /> Inbox sin leer
              </div>
            </GlassCard>
          </Link>
        </div>
      ) : null}

      {/* Módulos en Tiempo Real */}
      <GlassCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black text-dark flex items-center gap-2">
            <Shield className="h-5 w-5 text-secondary" /> Módulos Activos del Club
          </h2>
          {!isAdmin ? (
            <span className="text-xs font-black text-red-600">
              Solo SUPERADMIN/ADMIN pueden modificar interruptores globales.
            </span>
          ) : null}
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5">
          {FEATURE_SWITCHES.map((item) => {
            const val = Boolean(settings[item.key]);
            return (
              <label
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dark/25 bg-white/85 px-4 py-3 cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-black text-slate-900">{item.label}</span>
                <input
                  type="checkbox"
                  checked={val}
                  disabled={!isAdmin}
                  onChange={(e) => void toggleSetting(item.key, e.target.checked)}
                  className="h-4 w-4 accent-secondary"
                />
              </label>
            );
          })}
        </div>
      </GlassCard>

      {/* Banner y Límites */}
      <div className="grid lg:grid-cols-2 gap-5">
        <GlassCard className="space-y-3">
          <h3 className="text-lg font-black text-dark flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-secondary" /> Banner & Límites Anti-Spam
          </h3>
          <form onSubmit={saveMeta} className="space-y-3">
            <SacInput
              label="Nombre de la Plataforma"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
            <SacInput
              label="Banner de Aviso Global (vacío para ocultar)"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="Ej: Hoy transmisión del clásico a las 21:00hs"
            />
            <div className="grid grid-cols-3 gap-2">
              <SacInput
                label="Máx chars coment."
                type="number"
                value={maxLen}
                onChange={(e) => setMaxLen(e.target.value)}
              />
              <SacInput
                label="Cooldown coment (s)"
                type="number"
                value={commentCooldown}
                onChange={(e) => setCommentCooldown(e.target.value)}
              />
              <SacInput
                label="Cooldown img (s)"
                type="number"
                value={imgCooldown}
                onChange={(e) => setImgCooldown(e.target.value)}
              />
            </div>
            <SacButton type="submit" variant="primary" size="sm" disabled={!isAdmin}>
              Guardar Banner y Límites
            </SacButton>
          </form>
        </GlassCard>

        {/* Palabras Restringidas */}
        <GlassCard className="space-y-3">
          <h3 className="text-lg font-black text-dark">Filtro de Palabras Prohibidas</h3>
          <form onSubmit={addWord} className="flex gap-2">
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Agregar palabra restringida..."
              className="flex-1 rounded-full border-2 border-dark/60 bg-white px-4 py-1.5 text-sm font-bold text-slate-900"
            />
            <SacButton type="submit" size="sm" variant="secondary">
              <Plus className="h-4 w-4" /> Agregar
            </SacButton>
          </form>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-1">
            {words.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-dark bg-white px-3 py-1 text-xs font-black text-slate-900"
              >
                {w.word}
                <button
                  type="button"
                  onClick={() => void deleteWord(w.id)}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
            {words.length === 0 ? (
              <p className="text-xs font-semibold text-dark/60">Sin palabras bloqueadas.</p>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
