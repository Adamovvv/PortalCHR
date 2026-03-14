export type ThemeMode = "light" | "dark";

export type AppLanguage = "ru" | "en";

export type Profile = {
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  language: AppLanguage;
  tokenBalance: number;
  farmingStartedAt: string | null;
  farmingEndsAt: string | null;
  referredBy: number | null;
};

export type FarmingState = {
  reward: number;
  durationHours: number;
  startedAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  canClaim: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  telegramId: number;
  firstName: string;
  username: string | null;
  photoUrl: string | null;
  tokenBalance: number;
  isMe: boolean;
};

export type MyLeaderboardEntry = {
  rank: number;
  tokenBalance: number;
};

export type TaskItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  rewardTokens: number;
  actionUrl: string | null;
  icon: string;
  completed: boolean;
  completedAt: string | null;
};

export type Referral = {
  telegramId: number;
  firstName: string;
  username: string | null;
  photoUrl: string | null;
  createdAt: string;
};

export type ReferralSummary = {
  link: string;
  invitedCount: number;
  totalReferralTokens: number;
  invited: Referral[];
};

export type MiniAppData = {
  profile: Profile;
  farming: FarmingState;
  tasks: TaskItem[];
  leaderboard: LeaderboardEntry[];
  myLeaderboardEntry: MyLeaderboardEntry | null;
  referrals: ReferralSummary;
};

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type TelegramBackButton = {
  show?: () => void;
  hide?: () => void;
  onClick?: (callback: () => void) => void;
  offClick?: (callback: () => void) => void;
};

export type TelegramInset = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    start_param?: string;
    user?: TelegramUser;
  };
  colorScheme?: ThemeMode;
  safeAreaInset?: TelegramInset;
  contentSafeAreaInset?: TelegramInset;
  BackButton?: TelegramBackButton;
  expand?: () => void;
  ready?: () => void;
  requestFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  onEvent?: (eventType: string, callback: () => void) => void;
  offEvent?: (eventType: string, callback: () => void) => void;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred?: (type: "error" | "success" | "warning") => void;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
