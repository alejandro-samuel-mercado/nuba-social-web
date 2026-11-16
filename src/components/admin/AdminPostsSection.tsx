'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Pin,
  Search,
  Sparkles,
  Trash2,
  Tv,
} from 'lucide-react';
import { api, resolveMediaUrl, uploadImageWeb } from '@/lib/api';
import { Post, TopicType } from '@/types/nuba';
import { GlassCard, SacBadge, SacButton, SacInput } from '@/components/ui/SacPrimitives';

interface ExternalStreamItem {
  source: 'streamflex' | 'nexoplay' | 'tmdb';
  externalId?: string;
  tmdbId: number | null;
  mediaType: string;
  title: string;
  originalTitle?: string | null;
  synopsis: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres?: string[];
  trailerUrl?: string | null;
  platform?: string;
}

interface NubaChannel {
  id?: string;
  name: string;
  logo?: string | null;
  country?: string | null;
  groupTitle?: string | null;
  category?: { id?: string; name?: string } | null;
}

export function AdminPostsSection() {
  const [topic, setTopic] = useState<TopicType>('STREAMING');
  const [subType, setSubType] = useState('MOVIE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tagsText, setTagsText] = useState('');
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  // Importer Streaming
  const [streamSource, setStreamSource] = useState<'streamflex' | 'nexoplay' | 'tmdb'>('streamflex');
  const [streamTypeFilter, setStreamTypeFilter] = useState<'ALL' | 'MOVIE' | 'SERIES'>('ALL');
  const [streamQuery, setStreamQuery] = useState('');
  const [streamPage, setStreamPage] = useState(1);
  const [streamTotalPages, setStreamTotalPages] = useState(1);
  const [streamResults, setStreamResults] = useState<ExternalStreamItem[]>([]);
  const [loadingStream, setLoadingStream] = useState(false);

  // Extractor NubaTV
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tvSearch, setTvSearch] = useState('');
  const [tvChannels, setTvChannels] = useState<NubaChannel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<NubaChannel[]>([]);
  const [loadingTv, setLoadingTv] = useState(false);

  // Moderation
  const [posts, setPosts] = useState<Post[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadPosts = useCallback(async () => {
    const { data } = await api.get('/posts', { params: { status: 'ALL', limit: 30 } });
    setPosts(data.posts || []);
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (topic === 'STREAMING') setSubType('MOVIE');
    else if (topic === 'NEWS') setSubType('GENERAL');
    else if (topic === 'TV_CHANNELS') setSubType('PLAYLIST_ADDED');
    else setSubType('FOOTBALL_POST');
  }, [topic]);

  const searchExternalStreaming = async (targetPage = 1) => {
    setLoadingStream(true);
    setErr(null);
    try {
      if (streamSource === 'tmdb') {
        if (!streamQuery.trim()) {
          setErr('Escribí un título para buscar en TMDB.');
          setLoadingStream(false);
          return;
        }
        const { data } = await api.get('/integrations/tmdb/search', {
          params: { query: streamQuery.trim() },
        });
        setStreamResults(data.results || []);
        setStreamPage(1);
        setStreamTotalPages(1);
      } else {
        const { data } = await api.get('/integrations/streamflex/content', {
          params: {
            source: streamSource,
            search: streamQuery.trim() || undefined,
            type: streamTypeFilter === 'ALL' ? undefined : streamTypeFilter,
            page: targetPage,
            limit: 12,
          },
        });
        setStreamResults(data.items || []);
        setStreamPage(data.meta?.page || targetPage);
        setStreamTotalPages(Math.max(1, Number(data.meta?.totalPages) || 1));
      }
    } catch (e: any) {
      setErr(e?.message || 'No se pudo consultar la API externa.');
    } finally {
      setLoadingStream(false);
    }
  };

  const pickExternalItem = async (item: ExternalStreamItem) => {
    setErr(null);
    try {
      let enriched: any = item;
      if (item.source !== 'tmdb' && item.externalId) {
        const { data } = await api.get(`/integrations/streamflex/content/${item.externalId}`, {
          params: { source: item.source },
        });
        if (data?.item) enriched = data.item;
      }

      const resolvedMediaType = enriched.mediaType || item.mediaType;
      setTopic('STREAMING');
      setSubType(resolvedMediaType === 'SERIES' ? 'SERIES' : resolvedMediaType === 'ANIME' ? 'ANIME' : 'MOVIE');
      setTitle(enriched.title || item.title);
      setContent(enriched.synopsis || item.synopsis || 'Nuevo estreno disponible.');
      setImages(enriched.posterUrl ? [enriched.posterUrl] : []);
      setTagsText(Array.isArray(enriched.genres) ? enriched.genres.join(', ') : '');
      setMetadata({
        source: item.source,
        externalId: item.externalId || null,
        tmdbId: enriched.tmdbId || item.tmdbId || null,
        mediaType: enriched.mediaType || item.mediaType,
        posterUrl: enriched.posterUrl || item.posterUrl,
        backdropUrl: enriched.backdropUrl || item.backdropUrl,
        synopsis: enriched.synopsis || item.synopsis,
        releaseYear: enriched.releaseYear || item.releaseYear,
        rating: enriched.rating || item.rating,
        genres: enriched.genres || item.genres || [],
        trailerUrl: enriched.trailerUrl || item.trailerUrl || null,
        platform: enriched.platform || item.platform || item.source,
      });
      setMsg(`Cargado "${enriched.title}" con metadatos automáticos.`);
    } catch {
      setTitle(item.title);
      setContent(item.synopsis || 'Estreno destacado.');
      setMetadata({
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        synopsis: item.synopsis,
        releaseYear: item.releaseYear,
        rating: item.rating,
        mediaType: item.mediaType,
      });
    }
  };

  const loadNubaTvSummary = async () => {
    setLoadingTv(true);
    setErr(null);
    try {
      const { data } = await api.get('/integrations/nubatv/summary');
      const rawPlaylists = Array.isArray(data.playlists) ? data.playlists : data.playlists?.data || [];
      const rawCategories = Array.isArray(data.categories) ? data.categories : data.categories?.data || [];
      setPlaylists(rawPlaylists);
      setCategories(rawCategories);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo consultar nubatv-api.');
    } finally {
      setLoadingTv(false);
    }
  };

  const searchNubaTvChannels = async () => {
    setLoadingTv(true);
    setErr(null);
    try {
      const { data } = await api.get('/integrations/nubatv/channels', {
        params: {
          playlistId: selectedPlaylist || undefined,
          categoryId: selectedCategory || undefined,
          search: tvSearch.trim() || undefined,
          limit: 24,
        },
      });
      setTvChannels(data.channels || []);
    } catch (e: any) {
      setErr(e?.message || 'Error consultando canales de NubaTV.');
    } finally {
      setLoadingTv(false);
    }
  };

  const applySelectedChannelsToPost = () => {
    const sourceList = selectedChannels.length > 0 ? selectedChannels : tvChannels.slice(0, 12);
    if (sourceList.length === 0) return;
    const plObj = playlists.find((p: any) => p.id === selectedPlaylist);
    const catObj = categories.find((c: any) => c.id === selectedCategory);
    setTopic('TV_CHANNELS');
    setSubType(plObj ? 'PLAYLIST_ADDED' : 'CHANNEL_HIGHLIGHT');
    if (!title.trim()) {
      setTitle(
        plObj
          ? `📺 Nueva lista "${plObj.name || plObj.title}" con ${sourceList.length} canales`
          : `📺 ${sourceList.length} canales actualizados en NubaTV`
      );
    }
    if (!content.trim()) {
      setContent(
        `Canales incorporados/verificados desde NubaTV: ${sourceList
          .slice(0, 8)
          .map((c) => c.name)
          .join(', ')}.`
      );
    }
    const categoryNames = Array.from(
      new Set(
        [
          catObj?.name,
          ...sourceList.map((c) => c.category?.name || c.groupTitle).filter(Boolean),
        ].filter(Boolean)
      )
    ).slice(0, 6);
    setMetadata({
      totalChannels: sourceList.length,
      playlistName: plObj?.name || plObj?.title || undefined,
      categories: categoryNames,
      featuredChannels: sourceList.slice(0, 12).map((c) => ({
        name: c.name,
        logo: c.logo || null,
        category: c.category || null,
        groupTitle: c.groupTitle || null,
        country: c.country || null,
      })),
    });
    setMsg(`Se importaron ${sourceList.length} canales a la publicación.`);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await uploadImageWeb(file, 'posts');
    setImages((prev) => [...prev, url]);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      await api.post('/posts', {
        topic,
        subType,
        title: title.trim(),
        content: content.trim(),
        images,
        tags: tagsText
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        metadata,
        isPinned,
        allowComments,
      });
      setTitle('');
      setContent('');
      setImages([]);
      setTagsText('');
      setMetadata(null);
      setIsPinned(false);
      setMsg('Publicación creada y notificada correctamente.');
      await loadPosts();
    } catch (e: any) {
      setErr(e?.message || 'Error al publicar.');
    } finally {
      setSaving(false);
    }
  };

  const togglePostStatus = async (post: Post) => {
    const nextStatus = post.status === 'APPROVED' ? 'HIDDEN' : 'APPROVED';
    await api.patch(`/posts/${post.id}`, { status: nextStatus });
    await loadPosts();
  };

  const togglePostPin = async (post: Post) => {
    await api.patch(`/posts/${post.id}`, { isPinned: !post.isPinned });
    await loadPosts();
  };

  const deletePost = async (id: string) => {
    await api.delete(`/posts/${id}`);
    setPosts((prev) => prev.filter((p) => p.id !== id));
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

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" /> Creador Inteligente de Publicaciones
        </h2>

        {/* Topic Selector */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'STREAMING', label: '🎬 Streaming (API + TMDB)' },
              { id: 'TV_CHANNELS', label: '📺 Canales TV (NubaTV API)' },
              { id: 'FOOTBALL', label: '⚽ Fútbol (Post normal)' },
              { id: 'NEWS', label: '📢 Noticias / Problemas / Demos' },
            ] as Array<{ id: TopicType; label: string }>
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTopic(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                topic === t.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Streaming Importer */}
        {topic === 'STREAMING' ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Importar catálogo (Flex-Streaming / NexoPlay + TMDB)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={streamSource}
                onChange={(e) => {
                  setStreamSource(e.target.value as any);
                  setStreamPage(1);
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="streamflex">Flex-Streaming API</option>
                <option value="nexoplay">NexoPlay API</option>
                <option value="tmdb">TMDB Directo</option>
              </select>
              {streamSource !== 'tmdb' ? (
                <div className="flex items-center gap-1">
                  {(['ALL', 'MOVIE', 'SERIES'] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setStreamTypeFilter(tf)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer ${
                        streamTypeFilter === tf
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {tf === 'ALL' ? 'Todo' : tf === 'MOVIE' ? 'Películas' : 'Series'}
                    </button>
                  ))}
                </div>
              ) : null}
              <input
                value={streamQuery}
                onChange={(e) => setStreamQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void searchExternalStreaming(1);
                  }
                }}
                placeholder="Buscar película, serie o anime..."
                className="flex-1 min-w-[180px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
              <SacButton type="button" size="sm" variant="primary" onClick={() => void searchExternalStreaming(1)}>
                <Search className="h-3.5 w-3.5" /> {loadingStream ? 'Buscando...' : 'Consultar'}
              </SacButton>
            </div>

            {streamResults.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pt-1">
                {streamResults.map((it, idx) => (
                  <button
                    key={`${it.externalId || it.tmdbId}-${idx}`}
                    type="button"
                    onClick={() => void pickExternalItem(it)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-left hover:border-blue-500 cursor-pointer transition-colors shadow-2xs"
                  >
                    {it.posterUrl ? (
                      <img src={it.posterUrl} alt={it.title} className="h-12 w-9 rounded-md object-cover shrink-0" />
                    ) : null}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{it.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {it.mediaType} {it.releaseYear ? `• ${it.releaseYear}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* NubaTV Importer */}
        {topic === 'TV_CHANNELS' ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tv className="h-4 w-4 text-cyan-600" /> Extractor NubaTV API
              </span>
              <button
                type="button"
                onClick={() => void loadNubaTvSummary()}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cargar Listas & Categorías
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedPlaylist}
                onChange={(e) => setSelectedPlaylist(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="">Todas las playlists</option>
                {playlists.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                value={tvSearch}
                onChange={(e) => setTvSearch(e.target.value)}
                placeholder="Buscar canal..."
                className="flex-1 min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />

              <SacButton type="button" size="sm" variant="primary" onClick={() => void searchNubaTvChannels()}>
                {loadingTv ? 'Cargando...' : 'Buscar Canales'}
              </SacButton>
            </div>

            {tvChannels.length > 0 ? (
              <div className="space-y-2">
                <div className="grid sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                  {tvChannels.map((ch, idx) => {
                    const checked = selectedChannels.some((s) => s.name === ch.name);
                    return (
                      <button
                        key={`${ch.id || ch.name}-${idx}`}
                        type="button"
                        onClick={() =>
                          setSelectedChannels((prev) =>
                            checked ? prev.filter((x) => x.name !== ch.name) : [...prev, ch]
                          )
                        }
                        className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-left text-xs font-medium cursor-pointer ${
                          checked
                            ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{ch.name}</span>
                        {checked ? <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
                <SacButton type="button" size="sm" variant="secondary" onClick={applySelectedChannelsToPost}>
                  Importar {selectedChannels.length > 0 ? selectedChannels.length : Math.min(12, tvChannels.length)} canales
                </SacButton>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Post Form */}
        <form onSubmit={handleCreatePost} className="space-y-3.5">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <SacInput
                label="Título de la publicación"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subtipo
              </span>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                {topic === 'STREAMING' ? (
                  <>
                    <option value="MOVIE">Película</option>
                    <option value="SERIES">Serie</option>
                    <option value="ANIME">Anime</option>
                  </>
                ) : topic === 'NEWS' ? (
                  <>
                    <option value="GENERAL">Anuncio General</option>
                    <option value="PREMIUM">Novedad Premium</option>
                    <option value="DEMO">Demo / Prueba</option>
                    <option value="PROBLEM">Problema / Aviso Técnico</option>
                  </>
                ) : topic === 'TV_CHANNELS' ? (
                  <>
                    <option value="PLAYLIST_ADDED">Nueva Lista / Playlist</option>
                    <option value="CHANNEL_HIGHLIGHT">Canales Destacados</option>
                    <option value="FIX">Corrección de Señal</option>
                  </>
                ) : (
                  <>
                    <option value="FOOTBALL_POST">Publicación Normal</option>
                    <option value="NEWS">Noticia Futbolera</option>
                  </>
                )}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Contenido / Sinopsis
            </span>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </label>

          <SacInput
            label="Etiquetas separadas por coma"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="estreno, accion, 4k"
          />

          <div className="flex flex-wrap items-center gap-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <ImageIcon className="h-4 w-4" /> Subir Imagen ({images.length})
            </button>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="rounded accent-blue-600" />
              <span>Fijar arriba</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} className="rounded accent-blue-600" />
              <span>Permitir comentarios</span>
            </label>
          </div>

          {images.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {images.map((im) => (
                <img
                  key={im}
                  src={resolveMediaUrl(im)!}
                  alt="Preview"
                  className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="flex justify-end pt-1">
            <SacButton type="submit" variant="primary" disabled={saving}>
              {saving ? 'Publicando...' : 'Publicar Aviso'}
            </SacButton>
          </div>
        </form>
      </GlassCard>

      {/* Moderation List */}
      <GlassCard className="p-5 space-y-3.5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Moderación de Publicaciones ({posts.length})
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SacBadge variant={p.status === 'APPROVED' ? 'primary' : 'outline'}>{p.status}</SacBadge>
                  <span className="text-[11px] font-bold text-slate-400">{p.topic}</span>
                  {p.isPinned ? <span className="text-[10px] font-bold text-blue-600">FIJADO</span> : null}
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate mt-1">
                  {p.title}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void togglePostPin(p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 cursor-pointer"
                  title="Fijar/Soltar"
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void togglePostStatus(p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={p.status === 'APPROVED' ? 'Ocultar' : 'Aprobar'}
                >
                  {p.status === 'APPROVED' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => void deletePost(p.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
