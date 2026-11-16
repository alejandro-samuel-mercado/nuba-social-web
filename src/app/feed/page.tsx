'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCheck,
  Filter,
  Flame,
  Gift,
  HelpCircle,
  MessageCircle,
  Radio,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { api, resolveMediaUrl } from '@/lib/api';
import { League, Post, RadarSummary, StandingRow, Team, TopicType } from '@/types/nuba';
import { GlassCard, SacBadge, SacButton } from '@/components/ui/SacPrimitives';
import { PostCardWeb } from '@/components/feed/PostCardWeb';

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven filter states (keeps ContextualExplorerBar and Feed 100% in sync)
  const topic = (searchParams.get('topic') as TopicType | null) || 'ALL';
  const subType = searchParams.get('subType') || 'ALL';
  const tag = searchParams.get('tag') || '';
  const footballTab = (searchParams.get('tab') as 'FEED' | 'STANDINGS' | 'TEAMS' | null) || 'FEED';
  const search = searchParams.get('search') || searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [radar, setRadar] = useState<RadarSummary | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync searchInput when URL changes
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Helper to update URL query params
  const setFilter = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v || v === 'ALL' || (k === 'tab' && v === 'FEED')) {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      });
      // If topic changes, reset subType and tab
      if ('topic' in updates && updates.topic !== searchParams.get('topic')) {
        params.delete('subType');
        params.delete('tab');
      }
      const qs = params.toString();
      router.push(qs ? `/feed?${qs}` : '/feed');
    },
    [router, searchParams]
  );

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [radarRes, postsRes] = await Promise.all([
        api.get('/posts/radar'),
        api.get('/posts', {
          params: {
            topic: topic === 'ALL' ? undefined : topic,
            subType: subType === 'ALL' ? undefined : subType,
            tag: tag ? tag.toLowerCase() : undefined,
            search: search.trim() || undefined,
            limit: 30,
          },
        }),
      ]);
      setRadar(radarRes.data);
      setPosts(postsRes.data.posts || []);
    } finally {
      setLoading(false);
    }
  }, [topic, subType, tag, search]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (topic === 'FOOTBALL') {
      api.get('/football/leagues').then(({ data }) => {
        const list = (data.leagues || []) as League[];
        setLeagues(list);
        if (list.length > 0 && !selectedLeagueId) {
          setSelectedLeagueId(list[0].id);
        }
      });
    }
  }, [topic, selectedLeagueId]);

  useEffect(() => {
    if (topic === 'FOOTBALL' && footballTab === 'STANDINGS' && selectedLeagueId) {
      api.get(`/football/standings/${selectedLeagueId}`).then(({ data }) => {
        setStandings(data.standings || []);
      });
    }
    if (topic === 'FOOTBALL' && footballTab === 'TEAMS') {
      api.get('/football/teams', { params: { leagueId: selectedLeagueId || undefined } }).then(({ data }) => {
        setTeams(data.teams || []);
      });
    }
  }, [topic, footballTab, selectedLeagueId]);

  const markVisited = async () => {
    await api.post('/auth/visit');
    await loadFeed();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ search: searchInput.trim() || null });
  };

  const hasActiveFilters = topic !== 'ALL' || subType !== 'ALL' || !!tag || footballTab !== 'FEED' || !!search;

  return (
    <div className="space-y-4 max-w-3xl mx-auto xl:mx-0 xl:max-w-none">
      {/* =========================================================================
          AMBIENT RADAR STRIP: Live Pulse Status
          ========================================================================= */}
      {radar && (radar.totalNewPosts > 0 || radar.liveMatches.length > 0 || radar.pendingPollsCount > 0 || radar.openGiveaways.length > 0) ? (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-900/60 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-blue-600" />
              <span>Radar en Vivo</span>
            </span>

            {radar.totalNewPosts > 0 ? (
              <button
                onClick={() => void markVisited()}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Marcar visto
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {radar.liveMatches.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-600" />
                {radar.liveMatches.length} Partido(s) en vivo
              </span>
            ) : null}

            {radar.totalNewPosts > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-semibold">
                ✨ {radar.totalNewPosts} Avisos nuevos
              </span>
            ) : null}

            {radar.pendingPollsCount > 0 ? (
              <Link
                href="/polls"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-semibold hover:opacity-90"
              >
                📊 {radar.pendingPollsCount} Encuesta(s)
              </Link>
            ) : null}

            {radar.openGiveaways.length > 0 ? (
              <Link
                href="/giveaways"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold hover:opacity-90"
              >
                🎁 {radar.openGiveaways.length} Sorteo(s)
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* =========================================================================
          TOP CATEGORY BAR: Topic Pills + Search Box
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Topic Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { k: 'ALL', l: 'Todos', c: 0 },
              { k: 'FOOTBALL', l: '⚽ Fútbol', c: radar?.newByTopic?.FOOTBALL || 0 },
              { k: 'STREAMING', l: '🎬 Streaming', c: radar?.newByTopic?.STREAMING || 0 },
              { k: 'TV_CHANNELS', l: '📺 Canales TV', c: radar?.newByTopic?.TV_CHANNELS || 0 },
              { k: 'NEWS', l: '📢 Noticias', c: radar?.newByTopic?.NEWS || 0 },
            ] as Array<{ k: TopicType | 'ALL'; l: string; c: number }>
          ).map((t) => {
            const active = topic === t.k;
            return (
              <button
                key={t.k}
                onClick={() => {
                  setFilter({
                    topic: t.k === 'ALL' ? null : t.k,
                    subType: null,
                    tab: null,
                  });
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[var(--theme-primary)] text-white shadow-xs'
                    : 'bg-[var(--theme-surface)] text-[var(--theme-dark)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)]'
                }`}
              >
                <span>{t.l}</span>
                {t.c > 0 ? (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? 'bg-white text-[var(--theme-primary)]' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {t.c}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64 shrink-0">
          <Search className="h-4 w-4 text-[var(--theme-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => {
              if (searchInput !== search) {
                setFilter({ search: searchInput.trim() || null });
              }
            }}
            placeholder="Buscar por título, contenido o #etiqueta..."
            className="w-full rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] pl-9 pr-8 py-1.5 text-xs text-[var(--theme-dark)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)]"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setFilter({ search: null });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)] hover:text-[var(--theme-dark)] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </form>
      </div>

      {/* =========================================================================
          ACTIVE FILTERS CHIP BAR: Instant Visibility & 1-Click Clear
          ========================================================================= */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-xs">
          <span className="font-bold text-[var(--theme-dark)] flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5 text-[var(--theme-primary)]" />
            <span>Filtros activos:</span>
          </span>

          {topic !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--theme-primary)] text-white text-xs font-semibold shadow-2xs">
              <span>{topic === 'FOOTBALL' ? '⚽ Fútbol' : topic === 'STREAMING' ? '🎬 Streaming' : topic === 'TV_CHANNELS' ? '📺 TV' : '📢 Noticias'}</span>
              <button
                onClick={() => setFilter({ topic: null, subType: null, tab: null })}
                className="hover:opacity-75 cursor-pointer ml-0.5"
                title="Quitar categoría"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {subType !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-dark)] text-xs font-semibold shadow-2xs">
              <span>Subtipo: {subType}</span>
              <button
                onClick={() => setFilter({ subType: null })}
                className="hover:opacity-75 cursor-pointer ml-0.5 text-[var(--theme-muted)] hover:text-rose-500"
                title="Quitar subtipo"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {tag && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-2xs">
              <Tag className="h-3 w-3" />
              <span>#{tag}</span>
              <button
                onClick={() => setFilter({ tag: null })}
                className="hover:opacity-75 cursor-pointer ml-0.5"
                title="Quitar etiqueta"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {footballTab !== 'FEED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-2xs">
              <span>{footballTab === 'STANDINGS' ? '🏆 Tabla de Posiciones' : '🛡️ Equipos'}</span>
              <button
                onClick={() => setFilter({ tab: null })}
                className="hover:opacity-75 cursor-pointer ml-0.5"
                title="Volver al feed de partidos"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-dark)] text-xs font-semibold shadow-2xs">
              <span>&ldquo;{search}&rdquo;</span>
              <button
                onClick={() => {
                  setSearchInput('');
                  setFilter({ search: null });
                }}
                className="hover:opacity-75 cursor-pointer ml-0.5 text-[var(--theme-muted)] hover:text-rose-500"
                title="Borrar búsqueda"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={() => router.push('/feed')}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpiar filtros</span>
          </button>
        </div>
      )}

      {/* Sub-type Filters if Topic is Active */}
      {topic !== 'ALL' ? (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-[var(--theme-muted)] mr-1">Filtrar:</span>
            {(topic === 'FOOTBALL'
              ? [
                  { k: 'ALL', l: 'Todo Fútbol' },
                  { k: 'MATCH_FEATURE', l: 'Partidos' },
                  { k: 'FOOTBALL_POST', l: 'Publicaciones' },
                ]
              : topic === 'STREAMING'
              ? [
                  { k: 'ALL', l: 'Todo' },
                  { k: 'MOVIE', l: 'Películas' },
                  { k: 'SERIES', l: 'Series' },
                  { k: 'ANIME', l: 'Animes' },
                ]
              : topic === 'TV_CHANNELS'
              ? [
                  { k: 'ALL', l: 'Todo TV' },
                  { k: 'PLAYLIST_ADDED', l: 'Listas' },
                  { k: 'CHANNEL_HIGHLIGHT', l: 'Canales' },
                ]
              : [
                  { k: 'ALL', l: 'Todas' },
                  { k: 'PREMIUM', l: 'Premium' },
                  { k: 'DEMO', l: 'Demo' },
                  { k: 'PROBLEM', l: 'Avisos' },
                ]
            ).map((st) => (
              <button
                key={st.k}
                onClick={() => setFilter({ subType: st.k === 'ALL' ? null : st.k })}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                  subType === st.k
                    ? 'bg-[var(--theme-dark)] text-[var(--theme-surface)]'
                    : 'bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)]'
                }`}
              >
                {st.l}
              </button>
            ))}
          </div>

          <Link
            href={`/chats?topic=${topic}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/30 px-3 py-1 text-xs font-semibold text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>
              Chat de{' '}
              {topic === 'FOOTBALL'
                ? 'Fútbol'
                : topic === 'STREAMING'
                ? 'Streaming'
                : topic === 'TV_CHANNELS'
                ? 'Canales TV'
                : 'Noticias'}
            </span>
          </Link>
        </div>
      ) : null}

      {/* Football sub-tabs (Partidos, Tabla, Equipos) */}
      {topic === 'FOOTBALL' ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {(
              [
                { k: 'FEED', l: 'Partidos & Novedades' },
                { k: 'STANDINGS', l: '🏆 Tabla de Posiciones' },
                { k: 'TEAMS', l: '🛡️ Equipos' },
              ] as const
            ).map((ft) => (
              <button
                key={ft.k}
                onClick={() => setFilter({ tab: ft.k === 'FEED' ? null : ft.k })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  footballTab === ft.k
                    ? 'bg-[var(--theme-primary)] text-white shadow-2xs'
                    : 'bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)]'
                }`}
              >
                {ft.l}
              </button>
            ))}
          </div>

          {(footballTab === 'STANDINGS' || footballTab === 'TEAMS') && leagues.length > 0 ? (
            <select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-dark)]"
            >
              {leagues.map((lg) => (
                <option key={lg.id} value={lg.id}>
                  {lg.name} ({lg.season})
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ) : null}

      {/* =========================================================================
          CONTENT STREAM: Posts / Standings / Teams
          ========================================================================= */}
      {topic === 'FOOTBALL' && footballTab === 'STANDINGS' ? (
        <GlassCard className="p-5 overflow-x-auto bg-[var(--theme-surface)] border border-[var(--theme-border)]">
          <h2 className="text-base font-bold text-[var(--theme-dark)] mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Tabla de Posiciones
          </h2>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--theme-border)] text-[var(--theme-muted)] font-semibold">
                <th className="py-2.5 pr-2">#</th>
                <th className="py-2.5">Equipo</th>
                <th className="py-2.5 text-center">PJ</th>
                <th className="py-2.5 text-center">G</th>
                <th className="py-2.5 text-center">E</th>
                <th className="py-2.5 text-center">P</th>
                <th className="py-2.5 text-center">DG</th>
                <th className="py-2.5 text-right">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-border)]">
              {standings.map((r, idx) => (
                <tr key={r.id} className="font-medium text-[var(--theme-dark)]">
                  <td className="py-2.5 pr-2 font-bold text-[var(--theme-muted)]">{r.position || idx + 1}</td>
                  <td className="py-2.5 flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: r.team.colorPrimary, color: r.team.colorSecondary }}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 shadow-2xs"
                    >
                      {r.team.logoUrl ? (
                        <img src={resolveMediaUrl(r.team.logoUrl)!} alt={r.team.name} className="h-4 w-4 object-contain" />
                      ) : (
                        r.team.shortName
                      )}
                    </span>
                    <span className="font-semibold">{r.team.name}</span>
                  </td>
                  <td className="py-2.5 text-center text-[var(--theme-muted)]">{r.played}</td>
                  <td className="py-2.5 text-center text-[var(--theme-muted)]">{r.won}</td>
                  <td className="py-2.5 text-center text-[var(--theme-muted)]">{r.drawn}</td>
                  <td className="py-2.5 text-center text-[var(--theme-muted)]">{r.lost}</td>
                  <td className="py-2.5 text-center text-[var(--theme-muted)]">
                    {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[var(--theme-primary)]">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ) : topic === 'FOOTBALL' && footballTab === 'TEAMS' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {teams.map((t) => (
            <GlassCard key={t.id} className="flex items-center gap-3 p-3.5 bg-[var(--theme-surface)] border border-[var(--theme-border)]">
              <div
                style={{ backgroundColor: t.colorPrimary, color: t.colorSecondary }}
                className="h-11 w-11 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs"
              >
                {t.logoUrl ? (
                  <img src={resolveMediaUrl(t.logoUrl)!} alt={t.name} className="h-7 w-7 object-contain" />
                ) : (
                  t.shortName
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-[var(--theme-dark)] truncate">{t.name}</div>
                <div className="text-xs text-[var(--theme-muted)] truncate">
                  {t.stadium || 'Estadio'} {t.city ? `• ${t.city}` : ''}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : loading ? (
        <GlassCard className="text-center py-12 text-sm text-[var(--theme-muted)] font-medium bg-[var(--theme-surface)] border border-[var(--theme-border)]">
          Cargando avisos...
        </GlassCard>
      ) : posts.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-3 bg-[var(--theme-surface)] border border-[var(--theme-border)]">
          <Sparkles className="h-8 w-8 mx-auto text-[var(--theme-muted)] opacity-60" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-[var(--theme-dark)]">
              No hay avisos que coincidan con los filtros seleccionados.
            </p>
            <p className="text-xs text-[var(--theme-muted)]">
              Probá seleccionando otra categoría o limpiando los filtros actuales.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => router.push('/feed')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--theme-primary)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCardWeb
              key={p.id}
              post={p}
              onUpdated={() => void loadFeed()}
              onTagClick={(clickedTag) => {
                setFilter({ tag: clickedTag });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-sm text-[var(--theme-muted)]">
          Cargando comunidad...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
