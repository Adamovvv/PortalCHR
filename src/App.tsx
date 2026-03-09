import { FormEvent, useEffect, useMemo, useState } from "react";
import { createAnnouncement, deleteAnnouncement, loadContent, syncProfile } from "./lib/api";
import { getInitData, getInitialTheme, getTelegramUser, setupTelegramChrome } from "./lib/telegram";
import type { PortalAnnouncementCategory, PortalContent, ThemeMode } from "./types";
import { ru } from "./content/ru";
import { StateCard } from "./components/StateCard";
import { HomePage } from "./pages/HomePage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CreateAnnouncementPage } from "./pages/CreateAnnouncementPage";

type ScreenKey = "home" | "announcements" | "profile" | "create-announcement";

const emptyContent: PortalContent = {
  profile: null,
  notice: null,
  news: [],
  announcements: [],
  myAnnouncements: []
};

const tabs: Array<{ key: Exclude<ScreenKey, "create-announcement">; label: string }> = [
  { key: "home", label: ru.nav.home },
  { key: "announcements", label: ru.nav.announcements },
  { key: "profile", label: ru.nav.profile }
];

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [content, setContent] = useState<PortalContent>(emptyContent);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState<{
    title: string;
    category: PortalAnnouncementCategory;
    body: string;
    price: string;
  }>({
    title: "",
    category: "other",
    body: "",
    price: ""
  });

  const initData = getInitData();
  const telegramUser = getTelegramUser();
  const displayName = [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(" ");

  const screenTitle =
    activeScreen === "home"
      ? ru.app.subtitle
      : activeScreen === "announcements"
        ? ru.announcements.title
        : activeScreen === "profile"
          ? ru.profile.title
          : ru.createAnnouncement.title;

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
          throw new Error(ru.app.openInsideTelegram);
        }

        const profile = await syncProfile(initData);
        const portalContent = await loadContent(initData);
        setContent({ ...portalContent, profile });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : ru.app.loadFailed);
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
      const text = `${item.title} ${item.body} ${item.category} ${item.authorName}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
  }, [content.announcements, query]);

  async function handleAnnouncementSubmit(event: FormEvent) {
    event.preventDefault();
    if (!announcementDraft.title.trim() || !announcementDraft.body.trim()) {
      return;
    }

    try {
      setSubmittingAnnouncement(true);
      setError(null);
      const created = await createAnnouncement(initData, {
        title: announcementDraft.title.trim(),
        body: announcementDraft.body.trim(),
        category: announcementDraft.category,
        price: announcementDraft.price.trim() ? Number(announcementDraft.price) : null
      });
      setContent((current) => ({
        ...current,
        myAnnouncements: [created, ...current.myAnnouncements]
      }));
      setAnnouncementDraft({ title: "", category: "other", body: "", price: "" });
      setActiveScreen("profile");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ru.app.loadFailed);
    } finally {
      setSubmittingAnnouncement(false);
    }
  }

  async function handleAnnouncementDelete(announcementId: string) {
    try {
      setError(null);
      await deleteAnnouncement(initData, announcementId);
      setContent((current) => ({
        ...current,
        myAnnouncements: current.myAnnouncements.filter((item) => item.id !== announcementId),
        announcements: current.announcements.filter((item) => item.id !== announcementId)
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ru.app.loadFailed);
    }
  }

  return (
    <div className="app-shell">
      <main className="app-frame">
        <section className="screen-header">
          <p className="screen-header__title">{screenTitle}</p>
          {activeScreen === "announcements" ? (
            <button className="primary-action" type="button" onClick={() => setActiveScreen("create-announcement")}>
              {ru.announcements.addButton}
            </button>
          ) : null}
        </section>

        {activeScreen !== "profile" && activeScreen !== "create-announcement" ? (
          <label className="search-field">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ru.app.searchPlaceholder}
            />
          </label>
        ) : null}

        {loading ? <StateCard title={ru.app.loadingTitle} text={ru.app.loadingText} /> : null}
        {error ? <StateCard title={ru.app.errorTitle} text={error} tone="danger" /> : null}

        {!loading && !error ? (
          <>
            {activeScreen === "home" ? (
              <HomePage news={filteredNews} username={displayName || ru.common.telegramUserFallback} />
            ) : null}

            {activeScreen === "announcements" ? <AnnouncementsPage announcements={filteredAnnouncements} /> : null}

            {activeScreen === "profile" ? (
              <ProfilePage
                profile={content.profile}
                announcements={content.myAnnouncements}
                onDeleteAnnouncement={handleAnnouncementDelete}
              />
            ) : null}

            {activeScreen === "create-announcement" ? (
              <CreateAnnouncementPage
                draft={announcementDraft}
                submitting={submittingAnnouncement}
                onDraftChange={setAnnouncementDraft}
                onBack={() => setActiveScreen("announcements")}
                onSubmit={handleAnnouncementSubmit}
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
            className={`bottom-nav__item ${activeScreen === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveScreen(tab.key)}
          >
            <span className="bottom-nav__icon">
              <NavIcon tab={tab.key} active={activeScreen === tab.key} />
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function NavIcon({ tab, active }: { tab: Exclude<ScreenKey, "create-announcement">; active: boolean }) {
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