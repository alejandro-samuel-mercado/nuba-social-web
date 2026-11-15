export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
export type TopicType = 'FOOTBALL' | 'STREAMING' | 'NEWS' | 'TV_CHANNELS';
export type PostStatus = 'APPROVED' | 'PENDING' | 'HIDDEN';
export type ReactionType = 'LIKE' | 'LOVE' | 'FIRE' | 'STAR' | 'CLAP';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED';
export type FeatureVisualMode = 'AUTO' | 'CUSTOM_IMAGE';
export type ChatMessageType = 'TEXT' | 'STICKER' | 'IMAGE' | 'SUGGESTION';
export type SuggestionStatus = 'OPEN' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
export type GiveawayStatus = 'OPEN' | 'DRAWING' | 'COMPLETED' | 'CANCELLED';
export type ThemeName = 'classic' | 'cute' | 'minimal' | 'concert' | 'oscuro';

export interface User {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive?: boolean;
  isMuted: boolean;
  preferredTheme: ThemeName;
  customColor: string | null;
  lastVisitAt?: string;
  createdAt?: string;
}

export interface SystemSettings {
  id: string;
  appName: string;
  announcementBanner: string | null;
  chatsEnabled: boolean;
  commentsEnabled: boolean;
  likesEnabled: boolean;
  giveawaysEnabled: boolean;
  pollsEnabled: boolean;
  historyEnabled: boolean;
  directChatEnabled: boolean;
  chatImagesEnabled: boolean;
  ratingsEnabled: boolean;
  maxCommentLength: number;
  commentCooldownSec: number;
  chatImageCooldownSec: number;
  blockLinksInComments: boolean;
}

export interface NotificationPreference {
  footballPosts: boolean;
  streamingPosts: boolean;
  newsPosts: boolean;
  tvPosts: boolean;
  topicChats: boolean;
  directMessages: boolean;
  adminSuggestions: boolean;
  polls: boolean;
  giveaways: boolean;
  pushEnabled: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  topic: TopicType | null;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface League {
  id: string;
  name: string;
  shortName: string | null;
  country: string;
  season: string;
  logoUrl: string | null;
  isActive: boolean;
  _count?: { teams: number; matches: number; standings: number };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  stadium: string | null;
  city: string | null;
  country: string | null;
  colorPrimary: string;
  colorSecondary: string;
  leagueId: string | null;
}

export interface Match {
  id: string;
  leagueId: string;
  league: League;
  homeTeamId: string;
  homeTeam: Team;
  awayTeamId: string;
  awayTeam: Team;
  matchDate: string;
  matchday: string | null;
  stadium: string | null;
  location: string | null;
  broadcastInfo: string | null;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  featureMode: FeatureVisualMode;
  featureImageUrl: string | null;
}

export interface StandingRow {
  id: string;
  leagueId: string;
  teamId: string;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  position: number;
}

export interface PostComment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'role'>;
  createdAt: string;
}

export interface Post {
  id: string;
  topic: TopicType;
  subType: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  metadata: Record<string, unknown> | null;
  status: PostStatus;
  isPinned: boolean;
  allowComments: boolean;
  matchId: string | null;
  match: Match | null;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'role'>;
  createdAt: string;
  reactionSummary: {
    total: number;
    counts: Record<ReactionType, number>;
    userReaction: ReactionType | null;
  };
  ratingSummary: {
    average: number;
    count: number;
    userRating: number | null;
  };
  commentCount: number;
  comments?: PostComment[];
}

export interface Sticker {
  code: string;
  label: string;
  emoji: string;
}

export interface TopicChatMessage {
  id: string;
  topic: TopicType;
  messageType: ChatMessageType;
  content: string | null;
  stickerCode: string | null;
  imageUrl: string | null;
  senderId: string;
  sender: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'role'>;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  sender: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'role'>;
  content: string | null;
  images: string[];
  isSuggestion: boolean;
  createdAt: string;
}

export interface DirectThread {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  subject: string;
  topic: string;
  status: SuggestionStatus;
  unreadForAdmin: number;
  unreadForUser: number;
  lastMessageAt: string;
  lastMessage?: DirectMessage | null;
  messages?: DirectMessage[];
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  percentage: number;
}

export interface Poll {
  id: string;
  question: string;
  description: string | null;
  topic: TopicType | null;
  isClosed: boolean;
  createdAt: string;
  totalVoters: number;
  userVotedOptionIds: string[];
  options: PollOption[];
}

export interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prizeDescription: string;
  scheduledAt: string;
  maxEntries: number | null;
  status: GiveawayStatus;
  winner: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'> | null;
  drawnAt: string | null;
  entriesCount: number;
  isEnrolled: boolean;
  participants: Array<Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>>;
}

export interface RadarSummary {
  totalNewPosts: number;
  newByTopic: Record<TopicType, number>;
  liveMatches: Match[];
  pendingPollsCount: number;
  openGiveaways: Array<{ id: string; title: string }>;
  unreadNotifications: number;
  unreadInboxCount: number;
  settings: SystemSettings;
}
