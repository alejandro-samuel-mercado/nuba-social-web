'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, MessageCircle, Radio, Search, Shield, Trophy } from 'lucide-react';
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
    <div className="space-y-5">
      {/* Radar de Novedades */}
      {radar && (radar.totalNewPosts > 0 || radar.liveMatches.length > 0 || radar.pendingPollsCount > 0 || radar.openGiveaways.length > 0) ? (
        <GlassCard className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-black text-dark">
              <Radio className="h-4 w-4 text-secondary" />
              <span>Radar de Novedades</span>
            </div>
            {radar.totalNewPosts > 0 ? (
              <button
                onClick={() => void markVisited()}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-blue hover:underline cursor-pointer"
              >
                <CheckCheck className="h-4 w-4" /> Marcar todo visto
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {radar.liveMatches.length > 0 ? (
              <SacBadge variant="secondary">🔴 {radar.liveMatches.length} Partidos EN VIVO</SacBadge>
            ) : null}
            {radar.totalNewPosts > 0 ? (
              <SacBadge variant="primary">✨ {radar.totalNewPosts} Avisos nuevos</SacBadge>
            ) : null}
            {radar.pendingPollsCount > 0 ? (
              <Link href="/polls">
                <SacBadge variant="accent">📊 {radar.pendingPollsCount} Encuesta(s) sin votar</SacBadge>
              </Link>
            ) : null}
            {radar.openGiveaways.length > 0 ? (
              <Link href="/giveaways">
                <SacBadge variant="secondary">🎁 {radar.openGiveaways.length} Sorteo(s) activos</SacBadge>
              </Link>
            ) : null}
          </div>
        </GlassCard>
      ) : null}

      {/* Filtros de Tema + Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { k: 'ALL', l: 'Todos', c: 0 },
              { k: 'FOOTBALL', l: '⚽ Fútbol', c: radar?.newByTopic?.FOOTBALL || 0 },
              { k: 'STREAMING', l: '🎬 Streaming', c: radar?.newByTopic?.STREAMING || 0 },
              { k: 'TV_CHANNELS', l: '📺 Canales TV', c: radar?.newByTopic?.TV_CHANNELS || 0 },
              { k: 'NEWS', l: '📢 Noticias', c: radar?.newByTopic?.NEWS || 0 },
            ] as Array<{ k: TopicType | 'ALL'; l: string; c: number }>
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => {
                setTopic(t.k);
                setSubType('ALL');
                setFootballTab('FEED');
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 border-dark px-4 py-2 text-xs font-black cursor-pointer transition ${
                topic === t.k ? 'bg-secondary text-white shadow-[3px_3px_0_0_var(--color-dark)]' : 'bg-glass text-dark hover:bg-surface'
              }`}
            >
              <span>{t.l}</span>
              {t.c > 0 ? <span className="rounded-full bg-red-600 px-1.5 text-[10px] text-white">{t.c}</span> : null}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 text-dark/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar avisos..."
            className="w-full rounded-full border-2 border-dark bg-glass pl-10 pr-4 py-2 text-xs font-bold text-dark focus:outline-none"
          />
        </div>
      </div>

      {/* Filtros de subtipo + acceso directo al chat del tema */}
      {topic !== 'ALL' ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
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
                className={`rounded-full border border-dark/40 px-3 py-1 text-[11px] font-black cursor-pointer transition ${
                  subType === st.k ? 'bg-dark text-white' : 'bg-surface text-dark hover:bg-white'
                }`}
              >
                {st.l}
              </button>
            ))}
          </div>

          <Link
            href={`/chats?topic=${topic}`}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-dark bg-primary px-3.5 py-1.5 text-xs font-black text-on-primary shadow-[2px_2px_0_0_var(--color-dark)] hover:opacity-95"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Chat de{' '}
            {topic === 'FOOTBALL'
              ? 'Fútbol'
              : topic === 'STREAMING'
                ? 'Streaming'
                : topic === 'TV_CHANNELS'
                  ? 'Canales TV'
                  : 'Noticias'}
          </Link>
        </div>
      ) : null}

      {/* Subnavegación Fútbol */}
      {topic === 'FOOTBALL' ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(
              [
                { k: 'FEED', l: 'Partidos & Publicaciones' },
                { k: 'STANDINGS', l: '🏆 Tabla de Posiciones' },
                { k: 'TEAMS', l: '🛡️ Equipos' },
              ] as const
            ).map((ft) => (
              <SacButton
                key={ft.k}
                size="sm"
                variant={footballTab === ft.k ? 'primary' : 'glass'}
                onClick={() => setFootballTab(ft.k)}
              >
                {ft.l}
              </SacButton>
            ))}
          </div>

          {(footballTab === 'STANDINGS' || footballTab === 'TEAMS') && leagues.length > 0 ? (
            <select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="rounded-full border-2 border-dark bg-white px-4 py-1.5 text-xs font-black text-dark"
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

      {/* Tabla de Posiciones */}
      {topic === 'FOOTBALL' && footballTab === 'STANDINGS' ? (
        <GlassCard className="overflow-x-auto">
          <h2 className="text-lg font-black text-dark mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" /> Tabla de Posiciones
          </h2>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-dark text-dark/70 font-black">
                <th className="py-2 pr-2">#</th>
                <th className="py-2">Equipo</th>
                <th className="py-2 text-center">PJ</th>
                <th className="py-2 text-center">G</th>
                <th className="py-2 text-center">E</th>
                <th className="py-2 text-center">P</th>
                <th className="py-2 text-center">DG</th>
                <th className="py-2 text-right">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((r, idx) => (
                <tr key={r.id} className="border-b border-dark/10 font-bold">
                  <td className="py-2.5 pr-2 font-black">{r.position || idx + 1}</td>
                  <td className="py-2.5 flex items-center gap-2">
                    <span
                      style={{ backgroundColor: r.team.colorPrimary, color: r.team.colorSecondary }}
                      className="h-7 w-7 rounded-lg border border-dark flex items-center justify-center text-[10px] font-black overflow-hidden"
                    >
                      {r.team.logoUrl ? (
                        <img src={resolveMediaUrl(r.team.logoUrl)!} alt={r.team.name} className="h-5 w-5 object-contain" />
                      ) : (
                        r.team.shortName
                      )}
                    </span>
                    <span>{r.team.name}</span>
                  </td>
                  <td className="py-2.5 text-center">{r.played}</td>
                  <td className="py-2.5 text-center">{r.won}</td>
                  <td className="py-2.5 text-center">{r.drawn}</td>
                  <td className="py-2.5 text-center">{r.lost}</td>
                  <td className="py-2.5 text-center">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
                  <td className="py-2.5 text-right font-black text-secondary">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ) : topic === 'FOOTBALL' && footballTab === 'TEAMS' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <GlassCard key={t.id} className="flex items-center gap-3 p-4">
              <div
                style={{ backgroundColor: t.colorPrimary, color: t.colorSecondary }}
                className="h-12 w-12 rounded-2xl border-2 border-dark flex items-center justify-center font-black shrink-0"
              >
                {t.logoUrl ? <img src={resolveMediaUrl(t.logoUrl)!} alt={t.name} className="h-8 w-8 object-contain" /> : t.shortName}
              </div>
              <div className="min-w-0">
                <div className="font-black text-dark truncate">{t.name}</div>
                <div className="text-xs font-semibold text-dark/65 truncate">
                  {t.stadium || 'Estadio'} {t.city ? `• ${t.city}` : ''}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : loading ? (
        <GlassCard className="text-center py-12 font-bold text-dark/65">Cargando avisos...</GlassCard>
      ) : posts.length === 0 ? (
        <GlassCard className="text-center py-12 font-bold text-dark/65">
          No hay publicaciones en esta sección todavía.
        </GlassCard>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          {posts.map((p) => (
            <PostCardWeb key={p.id} post={p} onUpdated={() => void loadFeed()} />
          ))}
        </div>
      )}
    </div>
  );
}
