'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCheck,
  Flame,
  Gift,
  HelpCircle,
  MessageCircle,
  Radio,
  Search,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { api, resolveMediaUrl } from '@/lib/api';
import { League, Post, RadarSummary, StandingRow, Team, TopicType } from '@/types/nuba';
import { GlassCard, SacBadge, SacButton } from '@/components/ui/SacPrimitives';
import { PostCardWeb } from '@/components/feed/PostCardWeb';

export default function FeedPage() {
  const [topic, setTopic] = useState<TopicType | 'ALL'>('ALL');
  const [subType, setSubType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [footballTab, setFootballTab] = useState<'FEED' | 'STANDINGS' | 'TEAMS'>('FEED');

  const [radar, setRadar] = useState<RadarSummary | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [radarRes, postsRes] = await Promise.all([
        api.get('/posts/radar'),
        api.get('/posts', {
          params: {
            topic: topic === 'ALL' ? undefined : topic,
            subType: subType === 'ALL' ? undefined : subType,
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
  }, [topic, subType, search]);

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

  return (
    <div className="space-y-5 max-w-3xl mx-auto xl:mx-0 xl:max-w-none">
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
          TOP CATEGORY BAR: Pills + Search Box
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
                  setTopic(t.k);
                  setSubType('ALL');
                  setFootballTab('FEED');
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{t.l}</span>
                {t.c > 0 ? (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? 'bg-white text-blue-700' : 'bg-rose-600 text-white'
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
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar avisos..."
            className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Sub-type Filters if Topic is Active */}
      {topic !== 'ALL' ? (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Filtrar:</span>
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
                  { k: 'PROBLEM', l: 'Problemas' },
                ]
            ).map((st) => (
              <button
                key={st.k}
                onClick={() => setSubType(st.k)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                  subType === st.k
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {st.l}
              </button>
            ))}
          </div>

          <Link
            href={`/chats?topic=${topic}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat de {topic === 'FOOTBALL' ? 'Fútbol' : topic === 'STREAMING' ? 'Streaming' : topic === 'TV_CHANNELS' ? 'Canales TV' : 'Noticias'}</span>
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
                onClick={() => setFootballTab(ft.k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  footballTab === ft.k
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
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
        <GlassCard className="p-5 overflow-x-auto">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Tabla de Posiciones
          </h2>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {standings.map((r, idx) => (
                <tr key={r.id} className="font-medium text-slate-800 dark:text-slate-200">
                  <td className="py-2.5 pr-2 font-bold text-slate-500">{r.position || idx + 1}</td>
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
                  <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{r.played}</td>
                  <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{r.won}</td>
                  <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{r.drawn}</td>
                  <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{r.lost}</td>
                  <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">
                    {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                  </td>
                  <td className="py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ) : topic === 'FOOTBALL' && footballTab === 'TEAMS' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {teams.map((t) => (
            <GlassCard key={t.id} className="flex items-center gap-3 p-3.5">
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
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{t.name}</div>
                <div className="text-xs text-slate-500 truncate">
                  {t.stadium || 'Estadio'} {t.city ? `• ${t.city}` : ''}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : loading ? (
        <GlassCard className="text-center py-12 text-sm text-slate-500 font-medium">
          Cargando publicaciones...
        </GlassCard>
      ) : posts.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-2">
          <Sparkles className="h-8 w-8 mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No hay avisos en esta sección todavía.
          </p>
          <p className="text-xs text-slate-500">
            Probá seleccionando otra categoría o limpiando la búsqueda.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCardWeb key={p.id} post={p} onUpdated={() => void loadFeed()} />
          ))}
        </div>
      )}
    </div>
  );
}
