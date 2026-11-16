'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ExternalLink,
  MapPin,
  MessageCircle,
  Pin,
  Radio,
  Send,
  Star,
  Tag,
  Trash2,
  Tv,
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

const REACTIONS: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: 'LIKE', emoji: '👍', label: 'Me gusta' },
  { type: 'LOVE', emoji: '❤️', label: 'Me encanta' },
  { type: 'FIRE', emoji: '🔥', label: 'Fuego' },
  { type: 'STAR', emoji: '⭐', label: 'Estrella' },
  { type: 'CLAP', emoji: '👏', label: 'Aplausos' },
];

function TeamCrestWeb({ team }: { team: Team }) {
  const logo = resolveMediaUrl(team.logoUrl);
  return (
    <div className="flex flex-col items-center gap-2 text-center w-24 sm:w-28">
      <div
        style={{
          backgroundColor: team.colorPrimary || '#1e293b',
          color: team.colorSecondary || '#ffffff',
        }}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs border border-white/20 overflow-hidden"
      >
        {logo ? (
          <img src={logo} alt={team.name} className="h-9 w-9 sm:h-10 sm:w-10 object-contain" />
        ) : (
          team.shortName
        )}
      </div>
      <span className="text-xs font-semibold text-[var(--theme-dark)] line-clamp-1">
        {team.name}
      </span>
    </div>
  );
}

export function MatchFeatureWeb({ match }: { match: Match }) {
  const customPoster = resolveMediaUrl(match.featureImageUrl);
  const hasScore = ['LIVE', 'HALFTIME', 'FINISHED'].includes(match.status);
  const isLive = match.status === 'LIVE';
  const dt = new Date(match.matchDate).toLocaleString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (match.featureMode === 'CUSTOM_IMAGE' && customPoster) {
    return (
      <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden border border-[var(--theme-border)] shadow-xs">
        <img src={customPoster} alt="Match" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/20">
              {match.league?.name} {match.matchday ? `• ${match.matchday}` : ''}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isLive
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-white/20 text-white backdrop-blur-md'
              }`}
            >
              {isLive ? <Radio className="h-3 w-3" /> : null}
              {match.status}
            </span>
          </div>
          <div className="space-y-1.5 text-white">
            <div className="text-lg sm:text-xl font-bold tracking-tight">
              {match.homeTeam.name}{' '}
              {hasScore ? (
                <span className="text-amber-400 font-extrabold mx-1">
                  {match.homeScore} - {match.awayScore}
                </span>
              ) : (
                ' VS '
              )}{' '}
              {match.awayTeam.name}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
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
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] p-4 space-y-4">
      {/* Match Meta Top */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--theme-border)]">
        <span className="text-xs font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
          <span>⚽</span>
          <span className="text-[var(--theme-dark)] font-bold">{match.league?.name}</span>
          {match.matchday ? (
            <>
              <span className="opacity-40">•</span>
              <span>{match.matchday}</span>
            </>
          ) : null}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            isLive
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
              : match.status === 'FINISHED'
              ? 'bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)]'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
          }`}
        >
          {isLive ? <Radio className="h-3 w-3" /> : null}
          {match.status === 'UPCOMING'
            ? 'PRÓXIMO'
            : match.status === 'LIVE'
            ? 'EN VIVO'
            : match.status === 'HALFTIME'
            ? 'ENTRETIEMPO'
            : match.status === 'FINISHED'
            ? 'FINALIZADO'
            : match.status}
        </span>
      </div>

      {/* Match Scoreboard */}
      <div className="flex items-center justify-around gap-2 py-2">
        <TeamCrestWeb team={match.homeTeam} />

        <div className="text-center space-y-1">
          {hasScore ? (
            <div className="text-3xl font-extrabold tracking-tight text-[var(--theme-dark)]">
              {match.homeScore} - {match.awayScore}
            </div>
          ) : (
            <div className="inline-block rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] px-3.5 py-1 text-xs font-bold text-[var(--theme-dark)]">
              VS
            </div>
          )}
          <div className="text-[11px] text-[var(--theme-muted)] font-medium capitalize">
            {dt}
          </div>
        </div>

        <TeamCrestWeb team={match.awayTeam} />
      </div>

      {/* Match Details Footer */}
      {(match.stadium || match.broadcastInfo) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--theme-border)] text-xs text-[var(--theme-muted)]">
          {match.stadium ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 opacity-70" />
              <span>{match.stadium}</span>
              {match.location ? <span>, {match.location}</span> : null}
            </span>
          ) : <div />}

          {match.broadcastInfo ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--theme-surface)] border border-[var(--theme-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--theme-dark)]">
              <Tv className="h-3 w-3 opacity-70" /> {match.broadcastInfo}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PostCardWeb({
  post,
  onUpdated,
  onTagClick,
}: {
  post: Post;
  onUpdated: () => void;
  onTagClick?: (tag: string) => void;
}) {
  const router = useRouter();
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
    if (!newComment.trim()) return;
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
    <GlassCard className="p-5 space-y-4 bg-[var(--theme-surface)] border border-[var(--theme-border)]">
      {/* Card Header: Author info & Topic Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SacAvatar src={post.author.avatarUrl} name={post.author.displayName} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-sm text-[var(--theme-dark)] truncate">
              <span>{post.author.displayName}</span>
              {post.isPinned ? <Pin className="h-3.5 w-3.5 text-[var(--theme-primary)] fill-[var(--theme-primary)] shrink-0" /> : null}
            </div>
            <div className="text-xs text-[var(--theme-muted)] truncate">
              @{post.author.username} • {timeAgo(post.createdAt)}
            </div>
          </div>
        </div>

        <span
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-[var(--theme-surface-hover)] text-[var(--theme-primary)] border border-[var(--theme-border)]"
        >
          <span>{topicBadge.emoji}</span>
          <span>{topicBadge.label}</span>
        </span>
      </div>

      {/* TOPIC: FOOTBALL */}
      {post.topic === 'FOOTBALL' && post.match ? (
        <div className="space-y-3">
          <MatchFeatureWeb match={post.match} />
          {post.title ? (
            <h3 className="text-base font-bold text-[var(--theme-dark)] leading-snug">
              {post.title}
            </h3>
          ) : null}
          {post.content ? (
            <p className="text-sm text-[var(--theme-dark)] opacity-90 whitespace-pre-line leading-relaxed">
              {post.content}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* TOPIC: STREAMING */}
      {post.topic === 'STREAMING' ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] p-4 flex flex-col sm:flex-row gap-4">
            {resolveMediaUrl(meta.posterUrl) || firstImg ? (
              <img
                src={(resolveMediaUrl(meta.posterUrl) || firstImg)!}
                alt={post.title}
                className="w-24 sm:w-28 aspect-[2/3] rounded-lg object-cover shrink-0 shadow-sm border border-[var(--theme-border)] mx-auto sm:mx-0"
              />
            ) : null}

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <SacBadge variant="primary">
                  {meta.mediaType || meta.contentType || post.subType || 'ESTRENO'}
                </SacBadge>
                {meta.platform || meta.platformName ? (
                  <SacBadge variant="secondary">{meta.platform || meta.platformName}</SacBadge>
                ) : null}
                {meta.releaseYear ? <SacBadge variant="outline">{meta.releaseYear}</SacBadge> : null}
                {(meta.rating ?? meta.tmdbRating) ? (
                  <SacBadge variant="accent">★ TMDB {meta.rating ?? meta.tmdbRating}</SacBadge>
                ) : null}
              </div>

              <h3 className="text-base font-bold text-[var(--theme-dark)] leading-snug">
                {post.title}
              </h3>

              {Array.isArray(meta.genres) && meta.genres.length > 0 ? (
                <p className="text-xs font-medium text-[var(--theme-muted)]">
                  {meta.genres.join(' • ')}
                </p>
              ) : null}

              <p className="text-xs sm:text-sm text-[var(--theme-dark)] opacity-85 leading-relaxed line-clamp-3">
                {meta.synopsis || post.content}
              </p>

              {meta.trailerUrl ? (
                <a
                  href={meta.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--theme-primary)] hover:underline pt-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Ver Trailer Oficial
                </a>
              ) : null}
            </div>
          </div>

          {settings.ratingsEnabled ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] px-3.5 py-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => {
                  const filled = s <= (post.ratingSummary.userRating || Math.round(post.ratingSummary.average));
                  return (
                    <button
                      key={s}
                      onClick={() => void handleRate(s)}
                      className="cursor-pointer p-0.5 hover:scale-110 transition-transform"
                      title={`Calificar ${s} estrellas`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          filled ? 'fill-amber-400 text-amber-500' : 'text-[var(--theme-muted)] opacity-40'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-[var(--theme-muted)] font-medium">
                Promedio: {post.ratingSummary.average} ★ ({post.ratingSummary.count} votos)
                {post.ratingSummary.userRating ? ` • Tu voto: ${post.ratingSummary.userRating}★` : ''}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TOPIC: TV CHANNELS */}
      {post.topic === 'TV_CHANNELS' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--theme-dark)] flex items-center gap-2">
              <Tv className="h-4 w-4 text-cyan-600" />
              <span>{post.title}</span>
            </h3>
            {meta.totalChannels ? (
              <SacBadge variant="secondary">{meta.totalChannels} canales</SacBadge>
            ) : null}
          </div>

          {meta.playlistName || (Array.isArray(meta.categories) && meta.categories.length > 0) ? (
            <div className="flex flex-wrap gap-1.5">
              {meta.playlistName ? <SacBadge variant="dark">Lista: {meta.playlistName}</SacBadge> : null}
              {Array.isArray(meta.categories)
                ? meta.categories.slice(0, 5).map((cat: any, idx: number) => (
                    <SacBadge key={`cat-${idx}`} variant="primary">
                      {typeof cat === 'string' ? cat : cat?.name || String(cat)}
                    </SacBadge>
                  ))
                : null}
            </div>
          ) : null}

          <p className="text-sm text-[var(--theme-dark)] opacity-90 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>

          {Array.isArray(meta.featuredChannels) && meta.featuredChannels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {meta.featuredChannels.slice(0, 12).map((ch: any, idx: number) => (
                <div
                  key={`${ch.name}-${idx}`}
                  className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-hover)] p-2"
                >
                  {ch.logo ? (
                    <img src={ch.logo} alt={ch.name} className="h-6 w-6 object-contain rounded" />
                  ) : (
                    <Tv className="h-4 w-4 text-[var(--theme-muted)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-[var(--theme-dark)]">{ch.name}</div>
                    <div className="truncate text-[10px] text-[var(--theme-muted)]">
                      {ch.category?.name || ch.groupTitle || 'TV'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TOPIC: NEWS OR NORMAL FOOTBALL */}
      {(post.topic === 'NEWS' || (post.topic === 'FOOTBALL' && !post.match)) ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {post.subType !== 'GENERAL' ? (
              <SacBadge variant={post.subType === 'PROBLEM' ? 'accent' : 'primary'}>
                {post.subType}
              </SacBadge>
            ) : null}
            <h3 className="text-base font-bold text-[var(--theme-dark)]">
              {post.title}
            </h3>
          </div>

          <p className="text-sm text-[var(--theme-dark)] opacity-90 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>

          {firstImg ? (
            <img
              src={firstImg}
              alt={post.title}
              className="w-full max-h-96 rounded-xl border border-[var(--theme-border)] object-cover shadow-xs"
            />
          ) : null}
        </div>
      ) : null}

      {/* Post Tags / Etiquetas */}
      {Array.isArray(post.tags) && post.tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Tag className="h-3 w-3 text-[var(--theme-muted)] shrink-0" />
          {post.tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                if (onTagClick) {
                  onTagClick(t);
                } else {
                  router.push(`/feed?tag=${encodeURIComponent(t)}`);
                }
              }}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--theme-surface-hover)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white border border-[var(--theme-border)] transition-colors cursor-pointer"
              title={`Filtrar por etiqueta #${t}`}
            >
              <span>#{t}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Action Bar (Reactions & Comments) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--theme-border)]">
        {settings.likesEnabled ? (
          <div className="flex flex-wrap items-center gap-1">
            {REACTIONS.map((r) => {
              const active = post.reactionSummary.userReaction === r.type;
              const cnt = post.reactionSummary.counts[r.type] || 0;
              return (
                <button
                  key={r.type}
                  onClick={() => void handleReact(r.type)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors border ${
                    active
                      ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                      : 'bg-[var(--theme-surface-hover)] text-[var(--theme-dark)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]'
                  }`}
                  title={r.label}
                >
                  <span>{r.emoji}</span>
                  {cnt > 0 ? <span className="font-bold text-[11px]">{cnt}</span> : null}
                </button>
              );
            })}
          </div>
        ) : <div />}

        {settings.commentsEnabled ? (
          <button
            onClick={() => void toggleComments()}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-dark)] hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentCount} Comentarios</span>
          </button>
        ) : null}
      </div>

      {/* Collapsible Comments Section */}
      {showComments && settings.commentsEnabled ? (
        <div className="space-y-3 pt-3 border-t border-[var(--theme-border)]">
          {loadingComments ? (
            <p className="text-xs text-[var(--theme-muted)] py-2 text-center">Cargando comentarios...</p>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {comments.map((c) => {
                const canDelete = isStaff || c.authorId === user?.id;
                return (
                  <div
                    key={c.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]"
                  >
                    <SacAvatar src={c.author.avatarUrl} name={c.author.displayName} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--theme-dark)]">
                          {c.author.displayName}
                        </span>
                        {canDelete ? (
                          <button
                            onClick={() => void handleDeleteComment(c.id)}
                            className="text-[var(--theme-muted)] hover:text-rose-600 cursor-pointer p-0.5"
                            title="Eliminar comentario"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-[var(--theme-dark)] opacity-90 mt-0.5 whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 ? (
                <p className="text-xs text-[var(--theme-muted)] py-2 text-center">Aún no hay comentarios.</p>
              ) : null}
            </div>
          )}

          {post.allowComments ? (
            <form onSubmit={handleAddComment} className="space-y-1.5">
              {commentError ? <p className="text-xs text-rose-600 font-medium">{commentError}</p> : null}
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={settings.maxCommentLength}
                  placeholder={`Escribí un comentario (máx. ${settings.maxCommentLength} caracteres)...`}
                  className="flex-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3.5 py-1.5 text-xs text-[var(--theme-dark)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                />
                <SacButton type="submit" variant="primary" size="sm">
                  <Send className="h-3.5 w-3.5" />
                </SacButton>
              </div>
            </form>
          ) : (
            <p className="text-xs text-[var(--theme-muted)] font-medium">Comentarios cerrados en esta publicación.</p>
          )}
        </div>
      ) : null}
    </GlassCard>
  );
}
