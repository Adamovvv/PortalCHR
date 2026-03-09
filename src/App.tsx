import { useEffect, useMemo, useState } from "react";
import { loadContent, syncProfile } from "./lib/api";
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

  const initData = getInitData();
  const telegramUser = getTelegramUser();
  const displayName = [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(" ");
  const marqueeText = content.notice?.title
    ? `${content.notice.title}: ${content.notice.body}`
    : ru.app.marqueeFallback;

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
      const text = `${item.title} ${item.body}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
  }, [content.announcements, query]);

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

        <section className="marquee-card" aria-label="portal-notice">
          <div className="marquee-track">
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
          </div>
        </section>

        <section className="search-card search-card--compact">
          <label className="search-field">
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
                news={filteredNews}
                username={displayName || ru.common.telegramUserFallback}
              />
            ) : null}

            {activeTab === "announcements" ? (
              <AnnouncementsPage announcements={filteredAnnouncements} />
            ) : null}

            {activeTab === "profile" ? <ProfilePage profile={content.profile} /> : null}
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