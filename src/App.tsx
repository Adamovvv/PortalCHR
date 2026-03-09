import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createAnnouncement,
  createNews,
  loadContent,
  syncProfile,
  updateNotice
} from "./lib/api";
import { getInitData, getInitialTheme, getTelegramUser, setupTelegramChrome } from "./lib/telegram";
import type { PortalContent, ThemeMode } from "./types";
import { ru } from "./content/ru";
import { StateCard } from "./components/StateCard";
import { HomePage } from "./pages/HomePage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { ProfilePage } from "./pages/ProfilePage";

type TabKey = "home" | "announcements" | "profile";

const emptyContent: PortalContent = {
  profile: null,
  notice: null,
  news: [],
  announcements: []
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: ru.nav.home },
  { key: "announcements", label: ru.nav.announcements },
  { key: "profile", label: ru.nav.profile }
];

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [content, setContent] = useState<PortalContent>(emptyContent);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState({ title: "", body: "" });
  const [newsDraft, setNewsDraft] = useState<{ title: string; summary: string; category: string }>({
    title: "",
    summary: "",
    category: ru.common.noticeCategory
  });
  const [announcementDraft, setAnnouncementDraft] = useState({ title: "", body: "" });

  const initData = getInitData();
  const telegramUser = getTelegramUser();
  const displayName = [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(" ");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setupTelegramChrome();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => setTheme(getInitialTheme());
    media.addEventListener("change", updateTheme);

    return () => media.removeEventListener("change", updateTheme);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);

        if (!initData) {
          throw new Error("Открой мини-апп внутри Telegram, чтобы загрузить данные профиля.");
        }

        const profile = await syncProfile(initData);
        const portalContent = await loadContent(initData);
        setContent({ ...portalContent, profile });

        if (portalContent.notice) {
          setNoticeDraft({
            title: portalContent.notice.title,
            body: portalContent.notice.body
          });
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить портал.");
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, [initData]);

  const filteredNews = useMemo(() => {
    return content.news.filter((item) => {
      const text = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
  }, [content.news, query]);

  const filteredAnnouncements = useMemo(() => {
    return content.announcements.filter((item) => {
      const text = `${item.title} ${item.body}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
  }, [content.announcements, query]);

  const profile = content.profile;
  const isAdmin = profile?.isAdmin ?? false;

  async function handleNoticeSubmit(event: FormEvent) {
    event.preventDefault();
    if (!noticeDraft.title.trim() || !noticeDraft.body.trim()) {
      return;
    }

    try {
      setSaving(true);
      const notice = await updateNotice(initData, noticeDraft.title.trim(), noticeDraft.body.trim());
      setContent((current) => ({ ...current, notice }));
    } finally {
      setSaving(false);
    }
  }

  async function handleNewsSubmit(event: FormEvent) {
    event.preventDefault();
    if (!newsDraft.title.trim() || !newsDraft.summary.trim()) {
      return;
    }

    try {
      setSaving(true);
      const news = await createNews(
        initData,
        newsDraft.title.trim(),
        newsDraft.summary.trim(),
        newsDraft.category.trim() || ru.common.noticeCategory
      );
      setContent((current) => ({ ...current, news: [news, ...current.news] }));
      setNewsDraft({ title: "", summary: "", category: ru.common.noticeCategory });
      setActiveTab("home");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnnouncementSubmit(event: FormEvent) {
    event.preventDefault();
    if (!announcementDraft.title.trim() || !announcementDraft.body.trim()) {
      return;
    }

    try {
      setSaving(true);
      const announcement = await createAnnouncement(
        initData,
        announcementDraft.title.trim(),
        announcementDraft.body.trim()
      );
      setContent((current) => ({
        ...current,
        announcements: [announcement, ...current.announcements]
      }));
      setAnnouncementDraft({ title: "", body: "" });
      setActiveTab("announcements");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <main className="app-frame">
        <header className="hero">
          <div>
            <p className="eyebrow">{ru.app.title}</p>
            <h1>{ru.app.subtitle}</h1>
          </div>
        </header>

        <section className="search-card">
          <div className="brand-lockup">
            <div className="logo-mark">PR</div>
            <div>
              <strong>{ru.app.title}</strong>
              <p>{ru.app.brand}</p>
            </div>
          </div>
          <label className="search-field">
            <span>{ru.app.searchLabel}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ru.app.searchPlaceholder}
            />
          </label>
        </section>

        {loading ? <StateCard title={ru.app.loadingTitle} text={ru.app.loadingText} /> : null}
        {error ? <StateCard title={ru.app.errorTitle} text={error} tone="danger" /> : null}

        {!loading && !error ? (
          <>
            {activeTab === "home" ? (
              <HomePage
                notice={content.notice}
                news={filteredNews}
                username={displayName || ru.common.telegramUserFallback}
              />
            ) : null}

            {activeTab === "announcements" ? (
              <AnnouncementsPage announcements={filteredAnnouncements} />
            ) : null}

            {activeTab === "profile" ? (
              <ProfilePage
                profile={profile}
                isAdmin={isAdmin}
                saving={saving}
                noticeDraft={noticeDraft}
                newsDraft={newsDraft}
                announcementDraft={announcementDraft}
                onNoticeDraftChange={setNoticeDraft}
                onNewsDraftChange={setNewsDraft}
                onAnnouncementDraftChange={setAnnouncementDraft}
                onNoticeSubmit={handleNoticeSubmit}
                onNewsSubmit={handleNewsSubmit}
                onAnnouncementSubmit={handleAnnouncementSubmit}
              />
            ) : null}
          </>
        ) : null}
      </main>

      <nav className="bottom-nav" aria-label={ru.app.title}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`bottom-nav__item ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="bottom-nav__icon">
              <NavIcon tab={tab.key} active={activeTab === tab.key} />
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function NavIcon({ tab, active }: { tab: TabKey; active: boolean }) {
  const color = active ? "currentColor" : "currentColor";

  if (tab === "home") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 10.5L12 4L20 10.5V19A1 1 0 0 1 19 20H5A1 1 0 0 1 4 19V10.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 20V13H15V20" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tab === "announcements") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="5" width="14" height="14" rx="3" stroke={color} strokeWidth="1.8" />
        <path d="M8 10H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 14H13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth="1.8" />
      <path d="M5.5 19C6.7 15.9 9.1 14.5 12 14.5C14.9 14.5 17.3 15.9 18.5 19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}