export type ThemeMode = "light" | "dark";

export type PortalProfile = {
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
};

export type PortalNotice = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

export type PortalNews = {
  id: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
};

export type PortalAnnouncementCategory =
  | "transport"
  | "electronics"
  | "home"
  | "services"
  | "realty"
  | "jobs"
  | "other";

export type PortalAnnouncementStatus = "pending" | "approved" | "rejected";

export type PortalAnnouncement = {
  id: string;
  title: string;
  body: string;
  category: PortalAnnouncementCategory;
  authorName: string;
  authorUsername: string | null;
  authorTelegramId: number;
  price: number | null;
  status: PortalAnnouncementStatus;
  imageUrls: string[];
  publishedAt: string;
};

export type PortalContent = {
  profile: PortalProfile | null;
  notice: PortalNotice | null;
  news: PortalNews[];
  announcements: PortalAnnouncement[];
  myAnnouncements: PortalAnnouncement[];
};

export type AnnouncementImageDraft = {
  name: string;
  type: string;
  dataUrl: string;
};

export type AnnouncementSortMode = "newest" | "oldest" | "cheap" | "expensive";
export type AnnouncementPriceFilter = "all" | "free" | "paid";

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

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  colorScheme?: ThemeMode;
  BackButton?: TelegramBackButton;
  expand?: () => void;
  ready?: () => void;
  requestFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
