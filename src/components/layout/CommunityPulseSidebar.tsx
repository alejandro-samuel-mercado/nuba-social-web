'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ExternalLink,
  Flame,
  Gift,
  LifeBuoy,
  Radio,
  Sparkles,
  Trophy,
  Tv,
  Users,
} from 'lucide-react';
import { api, resolveMediaUrl } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Giveaway, Match, Team } from '@/types/nuba';
import { SacAvatar, SacBadge, SacButton } from '../ui/SacPrimitives';

const POPULAR_CHANNELS = [
  { id: '1', name: 'ESPN Premium', category: 'Deportes', logo: '⚽' },
  { id: '2', name: 'TNT Sports', category: 'Deportes', logo: '🏆' },
  { id: '3', name: 'Star+ Live', category: 'Streaming', logo: '⭐' },
  { id: '4', name: 'HBO Max VIP', category: 'Cine', logo: '🎬' },
  { id: '5', name: 'Fox Sports 1', category: 'Deportes', logo: '🏎️' },
  { id: '6', name: 'Nuba Cinema', category: 'Estrenos', logo: '🍿' },
];

export function CommunityPulseSidebar() {
  const { user, isStaff } = useAuth();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [activeGiveaway, setActiveGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchPulseData = async () => {
      try {
        const [matchesRes, giveawaysRes] = await Promise.all([
          api.get('/football/matches').catch(() => ({ data: { matches: [] } })),
          api.get('/giveaways').catch(() => ({ data: { giveaways: [] } })),
        ]);

        if (!mounted) return;

        const allMatches: Match[] = matchesRes.data.matches || [];
        const live = allMatches.filter((m) => m.status === 'LIVE');
        setLiveMatches(live);

        const upcoming = allMatches.find((m) => m.status === 'UPCOMING');
        setNextMatch(upcoming || allMatches[0] || null);

        const gList: Giveaway[] = giveawaysRes.data.giveaways || [];
        setActiveGiveaway(gList[0] || null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchPulseData();
    const interval = setInterval(fetchPulseData, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="w-80 2xl:w-84 shrink-0 flex flex-col gap-4 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto pr-1 scrollbar-none">
      {/* =========================================================================
          WIDGET 1: LIVE MATCH OR NEXT CLASH SCOREBOARD
          ========================================================================= */}
      <div className="app-card p-4 space-y-3.5 bg-[var(--theme-surface)] border border-[var(--theme-border)]">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveMatches.length > 0 ? 'bg-rose-500' : 'bg-[var(--theme-primary)]'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveMatches.length > 0 ? 'bg-rose-600' : 'bg-[var(--theme-primary)]'}`} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)]">
              {liveMatches.length > 0 ? 'Partidos en Vivo' : 'Próximo Encuentro'}
            </span>
          </div>

          <Link
            href="/feed?topic=FOOTBALL"
            className="text-[11px] font-semibold text-[var(--theme-primary)] hover:underline"
          >
            Ver fixture
          </Link>
        </div>

        {liveMatches.length > 0 ? (
          <div className="space-y-3">
            {liveMatches.slice(0, 2).map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-2.5"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--theme-muted)] font-medium">
                  <span className="truncate max-w-[140px]">{m.league?.shortName || m.league?.name}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full text-[10px]">
                    <Radio className="h-3 w-3 animate-pulse" /> EN VIVO
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      style={{ backgroundColor: m.homeTeam.colorPrimary }}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-2xs border border-white/20"
                    >
                      {m.homeTeam.shortName.slice(0, 2)}
                    </div>
                    <span className="text-xs font-bold text-[var(--theme-dark)] truncate">
                      {m.homeTeam.shortName}
                    </span>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-[var(--theme-dark)] text-[var(--theme-surface)] font-extrabold text-sm tracking-widest shrink-0">
                    {m.homeScore} - {m.awayScore}
                  </div>

                  <div className="flex items-center justify-end gap-2 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--theme-dark)] truncate text-right">
                      {m.awayTeam.shortName}
                    </span>
                    <div
                      style={{ backgroundColor: m.awayTeam.colorPrimary }}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-2xs border border-white/20"
                    >
                      {m.awayTeam.shortName.slice(0, 2)}
                    </div>
                  </div>
                </div>

                {m.broadcastInfo ? (
                  <div className="text-[10px] text-[var(--theme-muted)] font-medium flex items-center gap-1 pt-1 border-t border-[var(--theme-border)]">
                    <Tv className="h-3 w-3 opacity-70" />
                    <span className="truncate">{m.broadcastInfo}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : nextMatch ? (
          <div className="p-3.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[var(--theme-muted)] font-medium">
              <span className="truncate">{nextMatch.league?.name || 'Torneo Oficial'}</span>
              <span className="font-semibold text-[var(--theme-primary)]">
                {new Date(nextMatch.matchDate).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex items-center justify-around gap-2 py-1">
              <div className="text-center space-y-1">
                <div
                  style={{ backgroundColor: nextMatch.homeTeam.colorPrimary }}
                  className="h-10 w-10 mx-auto rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs border border-white/20"
                >
                  {nextMatch.homeTeam.shortName}
                </div>
                <div className="text-[11px] font-bold text-[var(--theme-dark)] truncate max-w-[80px]">
                  {nextMatch.homeTeam.shortName}
                </div>
              </div>

              <div className="h-7 w-7 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center text-[10px] font-bold text-[var(--theme-muted)]">
                VS
              </div>

              <div className="text-center space-y-1">
                <div
                  style={{ backgroundColor: nextMatch.awayTeam.colorPrimary }}
                  className="h-10 w-10 mx-auto rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs border border-white/20"
                >
                  {nextMatch.awayTeam.shortName}
                </div>
                <div className="text-[11px] font-bold text-[var(--theme-dark)] truncate max-w-[80px]">
                  {nextMatch.awayTeam.shortName}
                </div>
              </div>
            </div>

            {nextMatch.stadium ? (
              <div className="text-[10px] text-[var(--theme-muted)] text-center truncate">
                🏟️ {nextMatch.stadium}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-[var(--theme-muted)] py-3 text-center font-medium">
            No hay partidos programados hoy.
          </p>
        )}
      </div>

      {/* =========================================================================
          WIDGET 2: ACTIVE GIVEAWAY SPOTLIGHT
          ========================================================================= */}
      {activeGiveaway ? (
        <div className="app-card p-4 space-y-3 bg-[var(--theme-surface)] border border-[var(--theme-border)]">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)] flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-[var(--theme-secondary)]" /> Sorteo Activo
            </span>
            <span className="text-[10px] font-bold text-[var(--theme-primary)] bg-[var(--theme-surface-hover)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
              🎟️ {activeGiveaway.entriesCount} anotados
            </span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-[var(--theme-dark)] line-clamp-1">
              {activeGiveaway.title}
            </h4>
            <div className="p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]">
              <div className="text-[10px] font-bold uppercase text-[var(--theme-primary)]">
                Premio
              </div>
              <div className="text-xs font-bold text-[var(--theme-dark)] truncate">
                🎁 {activeGiveaway.prizeDescription}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[var(--theme-muted)]">
              📅 {new Date(activeGiveaway.scheduledAt).toLocaleDateString('es-AR')}
            </span>
            <Link
              href="/giveaways"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--theme-primary)] text-white text-xs font-semibold shadow-2xs hover:brightness-110 transition-all"
            >
              Participar
            </Link>
          </div>
        </div>
      ) : null}

      {/* =========================================================================
          WIDGET 3: SQUARED TV CHANNEL TILES (Geometric Harmony)
          ========================================================================= */}
      <div className="app-card p-4 space-y-3 bg-[var(--theme-surface)] border border-[var(--theme-border)]">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-dark)] flex items-center gap-1.5">
            <Tv className="h-4 w-4 text-cyan-600" /> Canales Rápidos
          </span>
          <Link
            href="/feed?topic=TV_CHANNELS"
            className="text-[11px] font-semibold text-[var(--theme-primary)] hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {/* 3x2 Square Channel Grid */}
        <div className="grid grid-cols-3 gap-2">
          {POPULAR_CHANNELS.map((ch) => (
            <Link
              key={ch.id}
              href="/feed?topic=TV_CHANNELS"
              className="group aspect-square rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] p-2 flex flex-col items-center justify-center text-center hover:border-[var(--theme-primary)] transition-all cursor-pointer shadow-2xs"
            >
              <span className="text-xl mb-1 group-hover:scale-110 transition-transform">
                {ch.logo}
              </span>
              <span className="text-[10px] font-bold text-[var(--theme-dark)] leading-tight truncate w-full">
                {ch.name}
              </span>
              <span className="text-[9px] text-[var(--theme-muted)] font-medium">
                {ch.category}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* =========================================================================
          WIDGET 4: DIRECT ADMIN SUPPORT PILL
          ========================================================================= */}
      <div className="p-3.5 rounded-xl bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1.5">
            <LifeBuoy className="h-4 w-4" /> ¿Necesitás Ayuda?
          </span>
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <p className="text-[11px] text-white/85 leading-relaxed">
          Reportá partidos con señal caída o solicitá nuevas series al staff.
        </p>
        <Link
          href="/support"
          className="block w-full text-center py-1.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold transition-colors"
        >
          Abrir Mensaje Directo
        </Link>
      </div>
    </aside>
  );
}
