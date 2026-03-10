import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createAnnouncement, deleteAnnouncement, loadContent, syncProfile } from "./lib/api";
import {
  bindTelegramBackButton,
  getInitData,
  getInitialTheme,
  getTelegramUser,
  setupTelegramChrome
} from "./lib/telegram";
import type {
  AnnouncementImageDraft,
  AnnouncementPriceFilter,
  AnnouncementSortMode,
  PortalAnnouncement,
  PortalAnnouncementCategory,
  PortalContent,
  ThemeMode
} from "./types";
import { ru } from "./content/ru";
import { StateCard } from "./components/StateCard";
import { HomePage } from "./pages/HomePage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CreateAnnouncementPage } from "./pages/CreateAnnouncementPage";
import { AnnouncementDetailsPage } from "./pages/AnnouncementDetailsPage";

type ScreenKey = "home" | "announcements" | "profile" | "create-announcement" | "announcement-detail";

const emptyContent: PortalContent = {
  profile: null,
  notice: null,
  news: [],
  announcements: [],
  myAnnouncements: []
};

const tabs: Array<{ key: Exclude<ScreenKey, "create-announcement" | "announcement-detail">; label: string }> = [
  { key: "home", label: ru.nav.home },
  { key: "announcements", label: ru.nav.announcements },
  { key: "profile", label: ru.nav.profile }
];

const MAX_IMAGES = 3;

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PortalAnnouncement | null>(null);
  const [content, setContent] = useState<PortalContent>(emptyContent);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<PortalAnnouncementCategory | "all">("all");
  const [priceFilter, setPriceFilter] = useState<AnnouncementPriceFilter>("all");
  const [sortMode, setSortMode] = useState<AnnouncementSortMode>("newest");
  const [announcementDraft, setAnnouncementDraft] = useState<{
    title: string;
    category: PortalAnnouncementCategory;
    body: string;
    price: string;
    images: AnnouncementImageDraft[];
  }>({
    title: "",
    category: "other",
    body: "",
    price: "",
    images: []
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
          : activeScreen === "create-announcement"
            ? ru.createAnnouncement.title
            : "";

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

  useEffect(() => {
    const shouldShowBackButton = activeScreen === "create-announcement" || activeScreen === "announcement-detail";

    return bindTelegramBackButton(shouldShowBackButton, () => {
      if (activeScreen === "announcement-detail") {
        setActiveScreen("announcements");
        return;
      }

      if (activeScreen === "create-announcement") {
        setActiveScreen("announcements");
      }
    });
  }, [activeScreen]);

  const filteredNews = useMemo(() => {
    return content.news.filter((item) => {
      const text = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
  }, [content.news, query]);

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return [...content.announcements]
      .filter((item) => {
        const text = `${item.title} ${item.body} ${item.category} ${item.authorName}`.toLowerCase();
        return text.includes(normalizedQuery);
      })
      .filter((item) => (categoryFilter === "all" ? true : item.category === categoryFilter))
      .filter((item) => {
        if (priceFilter === "free") {
          return item.price === null;
        }

        if (priceFilter === "paid") {
          return item.price !== null;
        }

        return true;
      })
      .sort((left, right) => {
        if (sortMode === "oldest") {
          return new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime();
        }

        if (sortMode === "cheap") {
          return (left.price ?? 0) - (right.price ?? 0);
        }

        if (sortMode === "expensive") {
          return (right.price ?? 0) - (left.price ?? 0);
        }

        return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
      });
  }, [categoryFilter, content.announcements, priceFilter, query, sortMode]);

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
        price: announcementDraft.price.trim() ? Number(announcementDraft.price) : null,
        images: announcementDraft.images
      });
      setContent((current) => ({
        ...current,
        myAnnouncements: [created, ...current.myAnnouncements]
      }));
      setAnnouncementDraft({ title: "", category: "other", body: "", price: "", images: [] });
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

      if (selectedAnnouncement?.id === announcementId) {
        setSelectedAnnouncement(null);
        setActiveScreen("announcements");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ru.app.loadFailed);
    }
  }

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    if (announcementDraft.images.length + files.length > MAX_IMAGES) {
      setError(ru.createAnnouncement.fileLimitError);
      event.target.value = "";
      return;
    }

    try {
      setError(null);
      const nextImages: AnnouncementImageDraft[] = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error(ru.createAnnouncement.fileTypeError);
        }

        nextImages.push(await prepareImageDraft(file));
      }

      setAnnouncementDraft((current) => ({
        ...current,
        images: [...current.images, ...nextImages]
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ru.createAnnouncement.fileReadError);
    } finally {
      event.target.value = "";
    }
  }

  function handleRemoveImage(index: number) {
    setAnnouncementDraft((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index)
    }));
  }

  function openAnnouncement(announcement: PortalAnnouncement) {
    setSelectedAnnouncement(announcement);
    setActiveScreen("announcement-detail");
  }

  return (
    <div className="app-shell">
      <main className="app-frame">
        {screenTitle ? (
          <section className="screen-header">
            <p className="screen-header__title">{screenTitle}</p>
            {activeScreen === "announcements" ? (
              <button className="primary-action" type="button" onClick={() => setActiveScreen("create-announcement")}>
                {ru.announcements.addButton}
              </button>
            ) : null}
          </section>
        ) : null}

        {activeScreen !== "profile" && activeScreen !== "create-announcement" && activeScreen !== "announcement-detail" && content.notice ? (
          <section className="marquee-card" aria-label={content.notice.title}>
            <div className="marquee-track">
              <span>{content.notice.title}: {content.notice.body}</span>
              <span>{content.notice.title}: {content.notice.body}</span>
            </div>
          </section>
        ) : null}

        {activeScreen !== "profile" && activeScreen !== "create-announcement" && activeScreen !== "announcement-detail" ? (
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

            {activeScreen === "announcements" ? (
              <AnnouncementsPage
                announcements={filteredAnnouncements}
                categoryFilter={categoryFilter}
                priceFilter={priceFilter}
                sortMode={sortMode}
                onCategoryFilterChange={setCategoryFilter}
                onPriceFilterChange={setPriceFilter}
                onSortModeChange={setSortMode}
                onOpenAnnouncement={openAnnouncement}
              />
            ) : null}

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
                onFilesSelected={handleFilesSelected}
                onRemoveImage={handleRemoveImage}
                onSubmit={handleAnnouncementSubmit}
              />
            ) : null}

            {activeScreen === "announcement-detail" && selectedAnnouncement ? (
              <AnnouncementDetailsPage announcement={selectedAnnouncement} />
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
            onClick={() => {
              setActiveScreen(tab.key);
              if (tab.key !== "announcements") {
                setSelectedAnnouncement(null);
              }
            }}
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

function NavIcon({ tab, active }: { tab: Exclude<ScreenKey, "create-announcement" | "announcement-detail">; active: boolean }) {
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

async function prepareImageDraft(file: File): Promise<AnnouncementImageDraft> {
  const dataUrl = await readFileAsDataUrl(file);
  const compressed = await compressImage(dataUrl);

  return {
    name: file.name,
    type: "image/jpeg",
    dataUrl: compressed
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(ru.createAnnouncement.fileReadError));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 1600;
      const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error(ru.createAnnouncement.fileReadError));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.84));
    };
    image.onerror = () => reject(new Error(ru.createAnnouncement.fileReadError));
    image.src = dataUrl;
  });
}
