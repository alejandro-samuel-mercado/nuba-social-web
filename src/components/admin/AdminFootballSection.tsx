'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, RefreshCw, Search, Shield, Trophy } from 'lucide-react';
import { api, resolveMediaUrl, uploadImageWeb } from '@/lib/api';
import { FeatureVisualMode, League, Match, MatchStatus, StandingRow, Team } from '@/types/nuba';
import { GlassCard, SacBadge, SacButton, SacInput } from '@/components/ui/SacPrimitives';

const MATCH_STATUSES: MatchStatus[] = ['UPCOMING', 'LIVE', 'HALFTIME', 'FINISHED', 'POSTPONED'];

export function AdminFootballSection() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');

  // Form Liga
  const [leagueName, setLeagueName] = useState('');
  const [leagueShort, setLeagueShort] = useState('');
  const [leagueCountry, setLeagueCountry] = useState('Argentina');
  const [leagueSeason, setLeagueSeason] = useState('2026');

  // Form Equipo
  const [teamSearch, setTeamSearch] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamShort, setTeamShort] = useState('');
  const [teamStadium, setTeamStadium] = useState('');
  const [teamCity, setTeamCity] = useState('');
  const [teamColor1, setTeamColor1] = useState('#2563eb');
  const [teamColor2, setTeamColor2] = useState('#0f172a');
  const [teamLogoUrl, setTeamLogoUrl] = useState('');

  // Form Match
  const [matchLeagueId, setMatchLeagueId] = useState('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchday, setMatchday] = useState('Fecha 1');
  const [matchStadium, setMatchStadium] = useState('');
  const [matchLocation, setMatchLocation] = useState('');
  const [broadcastInfo, setBroadcastInfo] = useState('NubaTV + ESPN');
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('UPCOMING');
  const [featureMode, setFeatureMode] = useState<FeatureVisualMode>('AUTO');
  const [featureImageUrl, setFeatureImageUrl] = useState('');
  const [publishPost, setPublishPost] = useState(true);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const teamLogoRef = useRef<HTMLInputElement | null>(null);
  const featureImgRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    const [lgRes, tmRes, mtRes] = await Promise.all([
      api.get('/football/leagues'),
      api.get('/football/teams', { params: { search: teamSearch.trim() || undefined } }),
      api.get('/football/matches'),
    ]);
    const lgList = (lgRes.data.leagues || []) as League[];
    setLeagues(lgList);
    setTeams(tmRes.data.teams || []);
    setMatches(mtRes.data.matches || []);

    if (lgList.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(lgList[0].id);
      setMatchLeagueId(lgList[0].id);
    }
  }, [teamSearch, selectedLeagueId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedLeagueId) return;
    api.get(`/football/standings/${selectedLeagueId}`).then(({ data }) => {
      setStandings(data.standings || []);
    });
  }, [selectedLeagueId]);

  const handleSelectHomeTeam = (id: string) => {
    setHomeTeamId(id);
    const tm = teams.find((t) => t.id === id);
    if (tm) {
      if (tm.stadium) setMatchStadium(tm.stadium);
      if (tm.city) setMatchLocation(tm.city);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      const { data } = await api.post('/football/leagues', {
        name: leagueName.trim(),
        shortName: leagueShort.trim() || null,
        country: leagueCountry.trim(),
        season: leagueSeason.trim(),
      });
      setLeagueName('');
      setLeagueShort('');
      if (data?.league?.id) {
        setSelectedLeagueId(data.league.id);
        setMatchLeagueId(data.league.id);
      }
      setMsg('Liga / Torneo creado correctamente.');
      await loadData();
    } catch (e: any) {
      setErr(e?.message || 'Error al crear liga.');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await api.post('/football/teams', {
        name: teamName.trim(),
        shortName: teamShort.trim(),
        stadium: teamStadium.trim() || null,
        city: teamCity.trim() || null,
        colorPrimary: teamColor1,
        colorSecondary: teamColor2,
        logoUrl: teamLogoUrl || null,
        leagueId: selectedLeagueId || null,
      });
      setTeamName('');
      setTeamShort('');
      setTeamStadium('');
      setTeamCity('');
      setTeamLogoUrl('');
      setMsg('Equipo creado exitosamente.');
      await loadData();
    } catch (e: any) {
      setErr(e?.message || 'Error al crear equipo.');
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchLeagueId || !homeTeamId || !awayTeamId) {
      setErr('Seleccioná liga, equipo local y equipo visitante.');
      return;
    }
    setErr(null);
    setMsg(null);
    try {
      await api.post('/football/matches', {
        leagueId: matchLeagueId,
        homeTeamId,
        awayTeamId,
        matchDate: matchDate ? new Date(matchDate).toISOString() : new Date().toISOString(),
        matchday: matchday.trim() || null,
        stadium: matchStadium.trim() || null,
        location: matchLocation.trim() || null,
        broadcastInfo: broadcastInfo.trim() || null,
        status: matchStatus,
        featureMode,
        featureImageUrl: featureMode === 'CUSTOM_IMAGE' ? featureImageUrl || null : null,
        publishPost,
        postTitle: postTitle.trim() || undefined,
        postContent: postContent.trim() || undefined,
      });
      setPostTitle('');
      setPostContent('');
      setFeatureImageUrl('');
      setMsg('Partido creado y publicado.');
      await loadData();
    } catch (e: any) {
      setErr(e?.message || 'No se pudo crear el partido.');
    }
  };

  const updateMatchScore = async (m: Match, homeScore: number, awayScore: number, status: MatchStatus) => {
    await api.patch(`/football/matches/${m.id}`, { homeScore, awayScore, status });
    await loadData();
    if (selectedLeagueId) {
      const { data } = await api.get(`/football/standings/${selectedLeagueId}`);
      setStandings(data.standings || []);
    }
  };

  const recalculateStandings = async () => {
    if (!selectedLeagueId) return;
    const { data } = await api.post(`/football/standings/${selectedLeagueId}/recalculate`);
    setStandings(data.standings || []);
    setMsg('Tabla de posiciones recalculada.');
  };

  return (
    <div className="space-y-6">
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

      {/* Create Match Feature */}
      <GlassCard className="p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          ⚽ Creador de Partido & Feature Visual
        </h2>

        <form onSubmit={handleCreateMatch} className="space-y-3.5">
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Liga / Torneo</span>
              <select
                value={matchLeagueId}
                onChange={(e) => setMatchLeagueId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="">Elegir liga...</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.season})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipo Local</span>
              <select
                value={homeTeamId}
                onChange={(e) => handleSelectHomeTeam(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="">Elegir local...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipo Visitante</span>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="">Elegir visitante...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            <SacInput
              label="Fecha y Hora"
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />
            <SacInput label="Jornada" value={matchday} onChange={(e) => setMatchday(e.target.value)} />
            <SacInput label="Estadio" value={matchStadium} onChange={(e) => setMatchStadium(e.target.value)} />
            <SacInput label="Lugar / Ciudad" value={matchLocation} onChange={(e) => setMatchLocation(e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <SacInput
              label="Canal / Transmisión"
              value={broadcastInfo}
              onChange={(e) => setBroadcastInfo(e.target.value)}
            />
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Estado</span>
              <select
                value={matchStatus}
                onChange={(e) => setMatchStatus(e.target.value as MatchStatus)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                {MATCH_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Modo de Feature</span>
              <select
                value={featureMode}
                onChange={(e) => setFeatureMode(e.target.value as FeatureVisualMode)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="AUTO">Automático (Colores y Escudos)</option>
                <option value="CUSTOM_IMAGE">Imagen Poster Propia</option>
              </select>
            </label>
          </div>

          {featureMode === 'CUSTOM_IMAGE' ? (
            <div className="flex items-center gap-3">
              <input
                ref={featureImgRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  const url = await uploadImageWeb(file, 'posts');
                  setFeatureImageUrl(url);
                }}
              />
              <button
                type="button"
                onClick={() => featureImgRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <ImageIcon className="h-4 w-4 inline mr-1" /> Subir Banner
              </button>
              {featureImageUrl ? (
                <img
                  src={resolveMediaUrl(featureImageUrl)!}
                  alt="Feature"
                  className="h-12 w-20 rounded-lg border border-slate-200 object-cover"
                />
              ) : null}
            </div>
          ) : null}

          <div className="grid sm:grid-cols-2 gap-3">
            <SacInput
              label="Título del aviso (opcional)"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Auto-generado si lo dejás vacío"
            />
            <SacInput
              label="Nota previa (opcional)"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Detalles sobre el partido..."
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={publishPost} onChange={(e) => setPublishPost(e.target.checked)} className="rounded accent-blue-600" />
            <span>Publicar tarjeta Feature automáticamente en el Feed de Fútbol</span>
          </label>

          <div className="flex justify-end pt-1">
            <SacButton type="submit" variant="primary">
              Crear Partido Feature
            </SacButton>
          </div>
        </form>
      </GlassCard>

      {/* Leagues and Teams */}
      <div className="grid lg:grid-cols-2 gap-5">
        <GlassCard className="p-5 space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Ligas y Torneos
          </h3>
          <form onSubmit={handleCreateLeague} className="grid grid-cols-2 gap-2.5">
            <SacInput label="Nombre Liga" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} required />
            <SacInput label="Sigla" value={leagueShort} onChange={(e) => setLeagueShort(e.target.value)} />
            <SacInput label="País" value={leagueCountry} onChange={(e) => setLeagueCountry(e.target.value)} />
            <SacInput label="Temporada" value={leagueSeason} onChange={(e) => setLeagueSeason(e.target.value)} />
            <div className="col-span-2 flex justify-end pt-1">
              <SacButton type="submit" size="sm" variant="primary">
                Crear Liga
              </SacButton>
            </div>
          </form>
        </GlassCard>

        <GlassCard className="p-5 space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" /> Crear Equipo
          </h3>
          <form onSubmit={handleCreateTeam} className="grid grid-cols-2 gap-2.5">
            <SacInput label="Nombre Equipo" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
            <SacInput label="Sigla (3-4 letras)" value={teamShort} onChange={(e) => setTeamShort(e.target.value)} required />
            <SacInput label="Estadio" value={teamStadium} onChange={(e) => setTeamStadium(e.target.value)} />
            <SacInput label="Ciudad" value={teamCity} onChange={(e) => setTeamCity(e.target.value)} />
            <SacInput label="Color Primario" type="color" value={teamColor1} onChange={(e) => setTeamColor1(e.target.value)} />
            <SacInput label="Color Secundario" type="color" value={teamColor2} onChange={(e) => setTeamColor2(e.target.value)} />
            <div className="col-span-2 flex items-center justify-between gap-3 pt-1">
              <input
                ref={teamLogoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  const url = await uploadImageWeb(file, 'teams');
                  setTeamLogoUrl(url);
                }}
              />
              <button
                type="button"
                onClick={() => teamLogoRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5 inline mr-1" /> Subir Escudo
              </button>
              <SacButton type="submit" size="sm" variant="primary">
                Guardar Equipo
              </SacButton>
            </div>
          </form>
        </GlassCard>
      </div>

      {/* Match Scores and Standings */}
      <div className="grid lg:grid-cols-2 gap-5">
        <GlassCard className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Marcadores en Vivo
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {matches.map((m) => (
              <div key={m.id} className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-900 dark:text-slate-100">
                    {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                  </span>
                  <SacBadge variant={m.status === 'LIVE' ? 'secondary' : 'outline'}>{m.status}</SacBadge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void updateMatchScore(m, m.homeScore + 1, m.awayScore, 'LIVE')}
                    className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-medium"
                  >
                    +1 {m.homeTeam.shortName} ({m.homeScore})
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateMatchScore(m, m.homeScore, m.awayScore + 1, 'LIVE')}
                    className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-medium"
                  >
                    +1 {m.awayTeam.shortName} ({m.awayScore})
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateMatchScore(m, m.homeScore, m.awayScore, 'FINISHED')}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Posiciones
            </h3>
            <button
              type="button"
              onClick={() => void recalculateStandings()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              <RefreshCw className="h-3 w-3" /> Recalcular
            </button>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto text-xs">
            {standings.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
              >
                <span>
                  #{r.position} {r.team.name}
                </span>
                <span>
                  PJ {r.played} • <strong>{r.points} PTS</strong>
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
