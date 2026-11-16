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
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          {msg}
        </div>
      ) : null}
      {err ? (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
          {err}
        </div>
      ) : null}

      {/* Metrics Row */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <GlassCard className="p-3.5 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.activeUsers}/{stats.totalUsers}</div>
            <div className="text-[11px] font-medium text-slate-500">Usuarios activos</div>
          </GlassCard>
          <GlassCard className="p-3.5 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.totalPosts}</div>
            <div className="text-[11px] font-medium text-slate-500">Publicaciones ({stats.pendingPosts} pend.)</div>
          </GlassCard>
          <GlassCard className="p-3.5 text-center">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.liveMatches}</div>
            <div className="text-[11px] font-medium text-slate-500">Partidos EN VIVO ({stats.upcomingMatches} próx.)</div>
          </GlassCard>
          <GlassCard className="p-3.5 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.openPolls} / {stats.openGiveaways}</div>
            <div className="text-[11px] font-medium text-slate-500">Encuestas / Sorteos</div>
          </GlassCard>
          <Link href="/support">
            <GlassCard className="p-3.5 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <div className="text-xl font-bold text-rose-600">{stats.unreadThreads}</div>
              <div className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
                <LifeBuoy className="h-3.5 w-3.5 text-rose-500" /> Inbox sin leer
              </div>
            </GlassCard>
          </Link>
        </div>
      ) : null}

      {/* Feature Switches */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" /> Módulos Activos del Club
          </h2>
          {!isAdmin ? (
            <span className="text-xs text-rose-600 font-medium">
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
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={val}
                  disabled={!isAdmin}
                  onChange={(e) => void toggleSetting(item.key, e.target.checked)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </label>
            );
          })}
        </div>
      </GlassCard>

      {/* Banner & Restrictions */}
      <div className="grid lg:grid-cols-2 gap-5">
        <GlassCard className="p-5 space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" /> Banner & Límites Anti-Spam
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
                label="Máx chars"
                type="number"
                value={maxLen}
                onChange={(e) => setMaxLen(e.target.value)}
              />
              <SacInput
                label="Cooldown com. (s)"
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
            <div className="flex justify-end pt-1">
              <SacButton type="submit" variant="primary" size="sm" disabled={!isAdmin}>
                Guardar Ajustes
              </SacButton>
            </div>
          </form>
        </GlassCard>

        {/* Restricted Words */}
        <GlassCard className="p-5 space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Filtro de Palabras Prohibidas
          </h3>
          <form onSubmit={addWord} className="flex gap-2">
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Agregar palabra a restringir..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
            />
            <SacButton type="submit" size="sm" variant="primary">
              <Plus className="h-4 w-4" /> Agregar
            </SacButton>
          </form>

          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
            {words.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <span>{w.word}</span>
                <button
                  type="button"
                  onClick={() => void deleteWord(w.id)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
            {words.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Sin palabras bloqueadas.</p>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
