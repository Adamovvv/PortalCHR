import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createAnnouncement,
  createNews,
  loadContent,
  syncProfile,
  updateNotice
} from "./lib/api";
import { getInitData, getInitialTheme, getTelegramUser, setupTelegramChrome } from "./lib/telegram";
import type {
  PortalAnnouncement,
  PortalContent,
  PortalNews,
  PortalNotice,
  PortalProfile,
  ThemeMode
} from "./types";

type TabKey = "home" | "announcements" | "profile";

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "Главная", icon: "?" },
  { key: "announcements", label: "Объявления", icon: "?" },
  { key: "profile", label: "Профиль", icon: "?" }
];

const emptyContent: PortalContent = {
  profile: null,
  notice: null,
  news: [],
  announcements: []
};

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [content, setContent] = useState<PortalContent>(emptyContent);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState({ title: "", body: "" });
  const [newsDraft, setNewsDraft] = useState({ title: "", summary: "", category: "Новости" });
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
        newsDraft.category.trim() || "Новости"
      );
      setContent((current) => ({ ...current, news: [news, ...current.news] }));
      setNewsDraft({ title: "", summary: "", category: "Новости" });
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
            <p className="eyebrow">Портал Республики</p>
            <h1>Единое пространство новостей, объявлений и сервиса</h1>
          </div>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Светлая тема" : "Темная тема"}
          </button>
        </header>

        <section className="search-card">
          <div className="brand-lockup">
            <div className="logo-mark">PR</div>
            <div>
              <strong>Портал Республики</strong>
              <p>Мини-апп Telegram</p>
            </div>
          </div>
          <label className="search-field">
            <span>Поиск по новостям и объявлениям</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Например: дороги, школы, медицина"
            />
          </label>
        </section>

        {loading ? <StateCard title="Загрузка" text="Подключаю Telegram и Supabase..." /> : null}
        {error ? <StateCard title="Ошибка" text={error} tone="danger" /> : null}

        {!loading && !error ? (
          <>
            {activeTab === "home" ? (
              <HomeTab
                notice={content.notice}
                news={filteredNews}
                username={displayName || "Пользователь Telegram"}
              />
            ) : null}

            {activeTab === "announcements" ? (
              <AnnouncementsTab announcements={filteredAnnouncements} />
            ) : null}

            {activeTab === "profile" ? (
              <ProfileTab
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

      <nav className="bottom-nav" aria-label="Навигация">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`bottom-nav__item ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="bottom-nav__icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function HomeTab({
  notice,
  news,
  username
}: {
  notice: PortalNotice | null;
  news: PortalNews[];
  username: string;
}) {
  return (
    <>
      <section className="welcome-card">
        <p className="eyebrow">Добро пожаловать</p>
        <h2>{username}</h2>
        <p>Здесь собраны важные сообщения администрации, актуальные новости и объявления портала.</p>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Сообщение администрации</p>
            <h3>Информационное сообщение</h3>
          </div>
          {notice ? <span className="pill">Обновлено {formatDate(notice.updatedAt)}</span> : null}
        </div>
        {notice ? (
          <article className="notice-card">
            <h4>{notice.title}</h4>
            <p>{notice.body}</p>
          </article>
        ) : (
          <StateCard title="Пока пусто" text="Администратор еще не публиковал сообщение для пользователей." />
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Лента</p>
            <h3>Актуальные новости</h3>
          </div>
          <span className="pill">{news.length} материалов</span>
        </div>
        <div className="stack">
          {news.length ? (
            news.map((item) => (
              <article className="content-card" key={item.id}>
                <div className="content-card__meta">
                  <span className="pill">{item.category}</span>
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
              </article>
            ))
          ) : (
            <StateCard title="Новостей нет" text="Добавь первую новость через `/admin` или админ-блок профиля." />
          )}
        </div>
      </section>
    </>
  );
}

function AnnouncementsTab({ announcements }: { announcements: PortalAnnouncement[] }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Раздел</p>
          <h3>Объявления</h3>
        </div>
        <span className="pill">{announcements.length} записей</span>
      </div>

      <div className="stack">
        {announcements.length ? (
          announcements.map((item) => (
            <article className="content-card" key={item.id}>
              <div className="content-card__meta">
                <span className="pill">Объявление</span>
                <span>{formatDate(item.publishedAt)}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </article>
          ))
        ) : (
          <StateCard title="Нет объявлений" text="Список объявлений появится после первой публикации." />
        )}
      </div>
    </section>
  );
}

type ProfileTabProps = {
  profile: PortalProfile | null;
  isAdmin: boolean;
  saving: boolean;
  noticeDraft: { title: string; body: string };
  newsDraft: { title: string; summary: string; category: string };
  announcementDraft: { title: string; body: string };
  onNoticeDraftChange: (value: { title: string; body: string }) => void;
  onNewsDraftChange: (value: { title: string; summary: string; category: string }) => void;
  onAnnouncementDraftChange: (value: { title: string; body: string }) => void;
  onNoticeSubmit: (event: FormEvent) => Promise<void>;
  onNewsSubmit: (event: FormEvent) => Promise<void>;
  onAnnouncementSubmit: (event: FormEvent) => Promise<void>;
};

function ProfileTab(props: ProfileTabProps) {
  const {
    profile,
    isAdmin,
    saving,
    noticeDraft,
    newsDraft,
    announcementDraft,
    onNoticeDraftChange,
    onNewsDraftChange,
    onAnnouncementDraftChange,
    onNoticeSubmit,
    onNewsSubmit,
    onAnnouncementSubmit
  } = props;

  return (
    <>
      <section className="profile-card">
        <div className="avatar">
          {profile?.photoUrl ? <img src={profile.photoUrl} alt={profile.firstName} /> : <span>PR</span>}
        </div>
        <div>
          <h3>{[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Профиль"}</h3>
          <p>@{profile?.username || "username отсутствует"}</p>
          <p>ID Telegram: {profile?.telegramId ?? "не определен"}</p>
        </div>
        {isAdmin ? <span className="pill pill--accent">Админ</span> : null}
      </section>

      {isAdmin ? (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Админка</p>
                <h3>Сообщение для пользователей</h3>
              </div>
            </div>
            <form className="editor" onSubmit={(event) => void onNoticeSubmit(event)}>
              <input
                value={noticeDraft.title}
                onChange={(event) => onNoticeDraftChange({ ...noticeDraft, title: event.target.value })}
                placeholder="Заголовок сообщения"
              />
              <textarea
                value={noticeDraft.body}
                onChange={(event) => onNoticeDraftChange({ ...noticeDraft, body: event.target.value })}
                placeholder="Текст сообщения для пользователей портала"
                rows={4}
              />
              <button className="primary-button" disabled={saving} type="submit">
                Сохранить сообщение
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Админка</p>
                <h3>Добавить новость</h3>
              </div>
            </div>
            <form className="editor" onSubmit={(event) => void onNewsSubmit(event)}>
              <input
                value={newsDraft.title}
                onChange={(event) => onNewsDraftChange({ ...newsDraft, title: event.target.value })}
                placeholder="Заголовок новости"
              />
              <input
                value={newsDraft.category}
                onChange={(event) => onNewsDraftChange({ ...newsDraft, category: event.target.value })}
                placeholder="Категория"
              />
              <textarea
                value={newsDraft.summary}
                onChange={(event) => onNewsDraftChange({ ...newsDraft, summary: event.target.value })}
                placeholder="Краткое описание новости"
                rows={4}
              />
              <button className="primary-button" disabled={saving} type="submit">
                Опубликовать новость
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Админка</p>
                <h3>Добавить объявление</h3>
              </div>
            </div>
            <form className="editor" onSubmit={(event) => void onAnnouncementSubmit(event)}>
              <input
                value={announcementDraft.title}
                onChange={(event) =>
                  onAnnouncementDraftChange({ ...announcementDraft, title: event.target.value })
                }
                placeholder="Заголовок объявления"
              />
              <textarea
                value={announcementDraft.body}
                onChange={(event) =>
                  onAnnouncementDraftChange({ ...announcementDraft, body: event.target.value })
                }
                placeholder="Текст объявления"
                rows={4}
              />
              <button className="primary-button" disabled={saving} type="submit">
                Опубликовать объявление
              </button>
            </form>
          </section>
        </>
      ) : (
        <StateCard
          title="Стандартный профиль"
          text="Профиль создается автоматически из данных Telegram. Админ-инструменты доступны только ID из TELEGRAM_ADMIN_IDS."
        />
      )}
    </>
  );
}

function StateCard({
  title,
  text,
  tone = "neutral"
}: {
  title: string;
  text: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <section className={`state-card ${tone === "danger" ? "state-card--danger" : ""}`}>
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
