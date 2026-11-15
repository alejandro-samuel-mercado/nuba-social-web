'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE, api } from '@/lib/api';
import { NotificationPreference, SystemSettings, User } from '@/types/nuba';
import { useTheme } from './ThemeProvider';

const DEFAULT_SETTINGS: SystemSettings = {
  id: 'singleton',
  appName: 'Nuba Club',
  announcementBanner: null,
  chatsEnabled: true,
  commentsEnabled: true,
  likesEnabled: true,
  giveawaysEnabled: true,
  pollsEnabled: true,
  historyEnabled: true,
  directChatEnabled: true,
  chatImagesEnabled: true,
  ratingsEnabled: true,
  maxCommentLength: 400,
  commentCooldownSec: 5,
  chatImageCooldownSec: 45,
  blockLinksInComments: true,
};

const DEFAULT_PREFS: NotificationPreference = {
  footballPosts: true,
  streamingPosts: true,
  newsPosts: true,
  tvPosts: true,
  topicChats: false,
  directMessages: true,
  adminSuggestions: true,
  polls: true,
  giveaways: true,
  pushEnabled: true,
};

export interface LiveDrawEvent {
  giveawayId: string;
  title: string;
  prizeDescription: string;
  drawnAt: string;
  winner: { id: string; username: string; displayName: string; avatarUrl: string | null };
  participants: Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>;
}

interface AuthContextType {
  user: User | null;
  settings: SystemSettings;
  preferences: NotificationPreference;
  unreadNotifications: number;
  unreadDirectMessages: number;
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  socket: Socket | null;
  activeLiveDraw: LiveDrawEvent | null;
  dismissLiveDraw: () => void;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  updatePreferences: (patch: Partial<NotificationPreference>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, setCustomColor } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [preferences, setPreferences] = useState<NotificationPreference>(DEFAULT_PREFS);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadDirectMessages, setUnreadDirectMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeLiveDraw, setActiveLiveDraw] = useState<LiveDrawEvent | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      if (data.settings) setSettings(data.settings);
      if (data.preferences) setPreferences(data.preferences);
      setUnreadNotifications(data.unreadNotifications || 0);
      setUnreadDirectMessages(data.unreadDirectMessages || 0);
      if (data.user?.preferredTheme) setTheme(data.user.preferredTheme);
      setCustomColor(data.user?.customColor ?? null);
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('nuba_club_token');
      }
    } finally {
      setLoading(false);
    }
  }, [setTheme, setCustomColor]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('nuba_club_token') : null;
    const s = io(API_BASE, {
      auth: token ? { token } : undefined,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    s.on('settings:updated', (next: SystemSettings) => setSettings(next));
    s.on('notification:new', () => setUnreadNotifications((n) => n + 1));
    s.on('giveaway:live_draw', (ev: LiveDrawEvent) => setActiveLiveDraw(ev));
    s.on('direct:thread_new', () => void refreshSession());
    s.on('direct:thread_updated', () => void refreshSession());
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?.id, refreshSession]);

  const signIn = async (identifier: string, password: string) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    if (typeof window !== 'undefined' && data.token) {
      window.localStorage.setItem('nuba_club_token', data.token);
    }
    setUser(data.user);
    if (data.settings) setSettings(data.settings);
    if (data.preferences) setPreferences(data.preferences);
    if (data.user?.preferredTheme) setTheme(data.user.preferredTheme);
    setCustomColor(data.user?.customColor ?? null);
    await refreshSession();
  };

  const signOut = async () => {
    await api.post('/auth/logout').catch(() => {});
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('nuba_club_token');
    }
    setUser(null);
  };

  const updatePreferences = async (patch: Partial<NotificationPreference>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
    const { data } = await api.put('/notifications/preferences', patch);
    if (data?.preferences) setPreferences(data.preferences);
  };

  const isStaff = Boolean(user && ['SUPERADMIN', 'ADMIN', 'MODERATOR'].includes(user.role));
  const isAdmin = Boolean(user && ['SUPERADMIN', 'ADMIN'].includes(user.role));

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        preferences,
        unreadNotifications,
        unreadDirectMessages,
        loading,
        isStaff,
        isAdmin,
        socket,
        activeLiveDraw,
        dismissLiveDraw: () => setActiveLiveDraw(null),
        signIn,
        signOut,
        refreshSession,
        setSettings,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
