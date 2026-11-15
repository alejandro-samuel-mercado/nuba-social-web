'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  MessageCircle,
  Pin,
  Radio,
  Send,
  Star,
  Trash2,
  Tv,
  ExternalLink,
} from 'lucide-react';
import { api, resolveMediaUrl } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { Match, Post, PostComment, ReactionType, Team, TopicType } from '@/types/nuba';
import { GlassCard, SacAvatar, SacBadge, SacButton } from '../ui/SacPrimitives';

const TOPIC_INFO: Record<TopicType, { label: string; emoji: string }> = {
  FOOTBALL: { label: 'Fútbol', emoji: '⚽' },
  STREAMING: { label: 'Streaming', emoji: '🎬' },
  NEWS: { label: 'Noticias', emoji: '📢' },
  TV_CHANNELS: { label: 'Canales TV', emoji: '📺' },
};

const REACTIONS: Array<{ type: ReactionType; emoji: string }> = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'LOVE', emoji: '❤️' },
  { type: 'FIRE', emoji: '🔥' },
  { type: 'STAR', emoji: '⭐' },
  { type: 'CLAP', emoji: '👏' },
];

function TeamCrestWeb({ team }: { team: Team }) {
  const logo = resolveMediaUrl(team.logoUrl);
  return (
    <div className="flex flex-col items-center gap-1.5 text-center w-28">
      <div
        style={{ backgroundColor: team.colorPrimary, color: team.colorSecondary }}
        className="h-14 w-14 rounded-2xl border-2 border-white flex items-center justify-center font-black text-base overflow-hidden shadow-md"
      >
        {logo ? <img src={logo} alt={team.name} className="h-10 w-10 object-contain" /> : team.shortName}
      </div>
      <span className="text-xs sm:text-sm font-black text-white leading-tight">{team.name}</span>
    </div>
  );
}

export function MatchFeatureWeb({ match }: { match: Match }) {
  const customPoster = resolveMediaUrl(match.featureImageUrl);
  const hasScore = ['LIVE', 'HALFTIME', 'FINISHED'].includes(match.status);
  const dt = new Date(match.matchDate).toLocaleString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (match.featureMode === 'CUSTOM_IMAGE' && customPoster) {
    return (
      <div className="relative h-60 rounded-3xl border-[2.5px] border-dark overflow-hidden">
        <img src={customPoster} alt="Match" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-extrabold text-white border border-white/30">
              {match.league?.name} {match.matchday ? `• ${match.matchday}` : ''}
            </span>
            <SacBadge variant={match.status === 'LIVE' ? 'secondary' : 'primary'}>{match.status}</SacBadge>
          </div>
          <div className="space-y-1 text-white">
            <div className="text-xl font-black">
              {match.homeTeam.name} {hasScore ? `${match.homeScore} - ${match.awayScore}` : 'VS'} {match.awayTeam.name}
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-bold text-white/85">
              <span>📅 {dt}</span>
              {match.stadium ? <span>🏟️ {match.stadium}</span> : null}
              {match.broadcastInfo ? <span>📺 {match.broadcastInfo}</span> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: `linear-gradient(125deg, ${match.homeTeam.colorPrimary || '#059669'} 0%, #0f172a 50%, ${
          match.awayTeam.colorPrimary || '#1d4ed8'
        } 100%)`,
      }}
      className="rounded-3xl border-[2.5px] border-dark overflow-hidden text-white"
    >
      <div className="bg-slate-950/60 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-extrabold">
            ⚽ {match.league?.name} {match.matchday ? `• ${match.matchday}` : ''}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase ${
              match.status === 'LIVE' ? 'bg-red-500 text-white' : 'bg-emerald-400 text-slate-950'
            }`}
          >
            {match.status === 'LIVE' ? <Radio className="h-3 w-3" /> : null}
            {match.status}
          </span>
        </div>

        <div className="flex items-center justify-around gap-2 py-1">
          <TeamCrestWeb team={match.homeTeam} />
          <div className="text-center space-y-1.5">
            {hasScore ? (
              <div className="text-3xl sm:text-4xl font-black tracking-wider">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="inline-block rounded-full border-2 border-white bg-amber-300 px-4 py-1 text-sm font-black text-slate-950">
                VS
              </div>
            )}
            <div className="text-[11px] font-bold text-slate-200 capitalize">{dt}</div>
          </div>
          <TeamCrestWeb team={match.awayTeam} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3 text-xs font-bold text-slate-200">
          <div className="flex items-center gap-3 flex-wrap">
            {match.stadium ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                {match.stadium}
                {match.location ? `, ${match.location}` : ''}
              </span>
            ) : null}
          </div>
          {match.broadcastInfo ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-0.5 text-[11px] font-black text-slate-950">
              <Tv className="h-3 w-3" /> {match.broadcastInfo}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PostCardWeb({ post, onUpdated }: { post: Post; onUpdated: () => void }) {
  const { user, settings, isStaff } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.comments || []);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const meta = (post.metadata || {}) as Record<string, any>;
  const topicBadge = TOPIC_INFO[post.topic];
  const firstImg = resolveMediaUrl(post.images?.[0]);

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next) {
      setLoadingComments(true);
      try {
        const { data } = await api.get(`/posts/${post.id}`);
        setComments(data.post?.comments || []);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleReact = async (type: ReactionType) => {
    await api.post(`/posts/${post.id}/react`, { type });
    onUpdated();
  };

  const handleRate = async (score: number) => {
    await api.post(`/posts/${post.id}/rate`, { score });
    onUpdated();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content: newComment.trim() });
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
      onUpdated();
    } catch (err: any) {
      setCommentError(err?.message || 'No se pudo comentar');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await api.delete(`/posts/${post.id}/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    onUpdated();
  };

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SacAvatar src={post.author.avatarUrl} name={post.author.displayName} size={42} />
          <div>
            <div className="flex items-center gap-1.5 font-black text-sm text-dark">
              <span>{post.author.displayName}</span>
              {post.isPinned ? <Pin className="h-3.5 w-3.5 text-secondary" /> : null}
            </div>
            <div className="text-xs font-semibold text-dark/60">
              @{post.author.username} • {timeAgo(post.createdAt)}
            </div>
          </div>
        </div>
        <SacBadge variant="primary">
          {topicBadge.emoji} {topicBadge.label}
        </SacBadge>
      </div>

      {/* FÚTBOL */}
      {post.topic === 'FOOTBALL' && post.match ? (
        <div className="space-y-3">
          <MatchFeatureWeb match={post.match} />
          <h3 className="text-lg font-black text-dark">{post.title}</h3>
          <p className="text-sm text-dark/80 whitespace-pre-line">{post.content}</p>
        </div>
      ) : null}

      {/* STREAMING WINDOW */}
      {post.topic === 'STREAMING' ? (
        <div className="space-y-3">
          <div className="relative rounded-3xl border-[2.5px] border-dark overflow-hidden bg-slate-900 text-white">
            {resolveMediaUrl(meta.backdropUrl) || firstImg ? (
              <img
                src={(resolveMediaUrl(meta.backdropUrl) || firstImg)!}
                alt={post.title}
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
            ) : null}
            <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-900/60">
              {resolveMediaUrl(meta.posterUrl) || firstImg ? (
                <img
                  src={(resolveMediaUrl(meta.posterUrl) || firstImg)!}
                  alt={post.title}
                  className="w-28 sm:w-32 aspect-[2/3] rounded-2xl border-2 border-white object-cover shrink-0 shadow-lg"
                />
              ) : null}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  <SacBadge variant="primary">
                    {meta.mediaType || meta.contentType || post.subType || 'ESTRENO'}
                  </SacBadge>
                  {meta.platform || meta.platformName ? (
                    <SacBadge variant="secondary">{meta.platform || meta.platformName}</SacBadge>
                  ) : null}
                  {meta.releaseYear ? <SacBadge variant="dark">{meta.releaseYear}</SacBadge> : null}
                  {(meta.rating ?? meta.tmdbRating) ? (
                    <SacBadge variant="accent">TMDB {meta.rating ?? meta.tmdbRating}</SacBadge>
                  ) : null}
                </div>
                <h3 className="text-xl font-black text-white">{post.title}</h3>
                {Array.isArray(meta.genres) && meta.genres.length > 0 ? (
                  <p className="text-xs font-bold text-amber-300">{meta.genres.join(' • ')}</p>
                ) : null}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {meta.synopsis || post.content}
                </p>
                {meta.trailerUrl ? (
                  <a
                    href={meta.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-black text-amber-300 hover:underline pt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ver Trailer
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {settings.ratingsEnabled ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dark/20 bg-surface px-4 py-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => {
                  const filled = s <= (post.ratingSummary.userRating || Math.round(post.ratingSummary.average));
                  return (
                    <button
                      key={s}
                      onClick={() => void handleRate(s)}
                      className="cursor-pointer p-0.5"
                      title={`Calificar ${s} estrellas`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          filled ? 'fill-amber-400 text-amber-500' : 'text-dark/30'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-extrabold text-dark/75">
                Promedio: {post.ratingSummary.average} ★ ({post.ratingSummary.count} votos)
                {post.ratingSummary.userRating ? ` • Tu voto: ${post.ratingSummary.userRating}★` : ''}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* CANALES DE TV */}
      {post.topic === 'TV_CHANNELS' ? (
        <div className="rounded-3xl border-2 border-dark bg-surface/90 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-black text-dark flex items-center gap-2">
              <Tv className="h-5 w-5 text-blue" /> {post.title}
            </h3>
            {meta.totalChannels ? <SacBadge variant="secondary">{meta.totalChannels} canales</SacBadge> : null}
          </div>
          {meta.playlistName || (Array.isArray(meta.categories) && meta.categories.length > 0) || (Array.isArray(meta.countries) && meta.countries.length > 0) || (Array.isArray(meta.languages) && meta.languages.length > 0) ? (
            <div className="flex flex-wrap gap-1.5">
              {meta.playlistName ? <SacBadge variant="dark">Lista: {meta.playlistName}</SacBadge> : null}
              {Array.isArray(meta.categories)
                ? meta.categories.slice(0, 5).map((cat: any, idx: number) => (
                    <SacBadge key={`cat-${idx}`} variant="primary">
                      {typeof cat === 'string' ? cat : cat?.name || String(cat)}
                    </SacBadge>
                  ))
                : null}
              {Array.isArray(meta.countries)
                ? meta.countries.slice(0, 4).map((country: any, idx: number) => (
                    <SacBadge key={`country-${idx}`} variant="outline">
                      {typeof country === 'string' ? country : country?.name || country?.code || String(country)}
                    </SacBadge>
                  ))
                : null}
              {Array.isArray(meta.languages)
                ? meta.languages.slice(0, 4).map((lang: any, idx: number) => (
                    <SacBadge key={`lang-${idx}`} variant="accent">
                      {typeof lang === 'string' ? lang : lang?.name || lang?.code || String(lang)}
                    </SacBadge>
                  ))
                : null}
            </div>
          ) : null}
          <p className="text-sm text-dark/80 whitespace-pre-line">{post.content}</p>
          {Array.isArray(meta.featuredChannels) && meta.featuredChannels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {meta.featuredChannels.slice(0, 12).map((ch: any, idx: number) => (
                <div
                  key={`${ch.name}-${idx}`}
                  className="flex items-center gap-2 rounded-2xl border border-dark/20 bg-white/80 p-2"
                >
                  {ch.logo ? (
                    <img src={ch.logo} alt={ch.name} className="h-7 w-7 object-contain rounded" />
                  ) : (
                    <Tv className="h-5 w-5 text-blue shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-dark">{ch.name}</div>
                    <div className="truncate text-[10px] font-bold text-dark/60">
                      {ch.category?.name || ch.groupTitle || ch.country || 'TV'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* POST NORMAL FÚTBOL O NOTICIAS */}
      {(post.topic === 'NEWS' || (post.topic === 'FOOTBALL' && !post.match)) ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {post.subType !== 'GENERAL' ? (
              <SacBadge variant={post.subType === 'PROBLEM' ? 'secondary' : 'accent'}>
                {post.subType}
              </SacBadge>
            ) : null}
            <h3 className="text-lg font-black text-dark">{post.title}</h3>
          </div>
          <p className="text-sm text-dark/80 whitespace-pre-line">{post.content}</p>
          {firstImg ? (
            <img
              src={firstImg}
              alt={post.title}
              className="w-full max-h-96 rounded-2xl border-2 border-dark object-cover"
            />
          ) : null}
        </div>
      ) : null}

      {/* BARRA DE ACCIONES */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dark/15 pt-3">
        {settings.likesEnabled ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {REACTIONS.map((r) => {
              const active = post.reactionSummary.userReaction === r.type;
              const cnt = post.reactionSummary.counts[r.type] || 0;
              return (
                <button
                  key={r.type}
                  onClick={() => void handleReact(r.type)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold cursor-pointer transition ${
                    active ? 'bg-primary border-dark text-dark' : 'bg-surface border-dark/20 text-dark/80 hover:bg-primary/40'
                  }`}
                >
                  <span>{r.emoji}</span>
                  {cnt > 0 ? <span>{cnt}</span> : null}
                </button>
              );
            })}
          </div>
        ) : <div />}

        {settings.commentsEnabled ? (
          <button
            onClick={() => void toggleComments()}
            className="inline-flex items-center gap-1.5 rounded-full border border-dark/25 bg-surface px-3.5 py-1.5 text-xs font-black text-dark cursor-pointer hover:bg-primary/50"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{post.commentCount} Comentarios</span>
          </button>
        ) : null}
      </div>

      {showComments && settings.commentsEnabled ? (
        <div className="space-y-3 rounded-2xl border border-dark/20 bg-surface/60 p-3.5">
          {loadingComments ? (
            <p className="text-xs font-bold text-dark/60">Cargando comentarios...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.map((c) => {
                const canDelete = isStaff || c.authorId === user?.id;
                return (
                  <div key={c.id} className="flex items-start gap-2.5 rounded-xl bg-white/80 p-2.5 border border-dark/15">
                    <SacAvatar src={c.author.avatarUrl} name={c.author.displayName} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-dark">{c.author.displayName}</span>
                        {canDelete ? (
                          <button
                            onClick={() => void handleDeleteComment(c.id)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            title="Eliminar comentario"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-dark/85 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 ? (
                <p className="text-xs font-semibold text-dark/55">Aún no hay comentarios.</p>
              ) : null}
            </div>
          )}

          {post.allowComments ? (
            <form onSubmit={handleAddComment} className="space-y-1.5">
              {commentError ? <p className="text-xs font-bold text-red-600">{commentError}</p> : null}
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={settings.maxCommentLength}
                  placeholder={`Comentar (máx. ${settings.maxCommentLength} chars${
                    settings.blockLinksInComments ? ', sin URLs' : ''
                  })...`}
                  className="flex-1 rounded-full border-2 border-dark/60 bg-white px-4 py-1.5 text-xs font-semibold text-dark focus:outline-none"
                />
                <SacButton type="submit" variant="secondary" size="sm">
                  <Send className="h-3.5 w-3.5" />
                </SacButton>
              </div>
            </form>
          ) : (
            <p className="text-xs font-bold text-dark/60">Comentarios cerrados en esta publicación.</p>
          )}
        </div>
      ) : null}
    </GlassCard>
  );
}
