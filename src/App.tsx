import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  createAnnouncement,
  createCommunityItem,
  createQuestionAnswer,
  deleteAnnouncement,
  loadContent,
  syncProfile
} from "./lib/api";
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
  CommunityItemKind,
  PortalAnnouncement,
  PortalAnnouncementCategory,
  PortalCommunityItem,
  PortalContent,
  ThemeMode
} from "./types";
import { hubTabs, ru } from "./content/ru";
import { StateCard } from "./components/StateCard";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CreateAnnouncementPage } from "./pages/CreateAnnouncementPage";
import { AnnouncementDetailsPage } from "./pages/AnnouncementDetailsPage";
import { EventsPage } from "./pages/EventsPage";
import { CommunityBoardPage } from "./pages/CommunityBoardPage";
import { CreateSimplePostPage } from "./pages/CreateSimplePostPage";
import { QuestionsPage } from "./pages/QuestionsPage";
import { QuestionDetailsPage } from "./pages/QuestionDetailsPage";

type ScreenKey =
  | "home"
  | "profile"
  | "create-announcement"
  | "create-problem"
  | "create-lost-found"
  | "create-question"
  | "announcement-detail"
  | "question-detail";

type HomeTabKey = (typeof hubTabs)[number]["key"];

const emptyContent: PortalContent = {
  profile: null,
  notice: null,
  news: [],
  announcements: [],
  myAnnouncements: [],
  problems: [],
  lostFound: [],
  questions: [],
  questionAnswers: []
};

const bottomTabs: Array<{ key: "home" | "profile"; label: string }> = [
  { key: "home", label: ru.nav.home },
  { key: "profile", label: ru.nav.profile }
];

const MAX_IMAGES = 3;

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [activeHomeTab, setActiveHomeTab] = useState<HomeTabKey>("news");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PortalAnnouncement | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<PortalCommunityItem | null>(null);
  const [content, setContent] = useState<PortalContent>(emptyContent);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [submittingCommunity, setSubmittingCommunity] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<PortalAnnouncementCategory | "all">("all");
  const [priceFilter, setPriceFilter] = useState<AnnouncementPriceFilter>("all");
  const [sortMode, setSortMode] = useState<AnnouncementSortMode>("newest");
  const [questionAnswerDraft, setQuestionAnswerDraft] = useState("");
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
  const [communityDraft, setCommunityDraft] = useState({ title: "", body: "" });

  const initData = getInitData();
  const telegramUser = getTelegramUser();

  const screenTitle =
    activeScreen === "home"
      ? ru.app.subtitle
      : activeScreen === "profile"
        ? ru.profile.title
        : activeScreen === "create-announcement"
          ? ru.createAnnouncement.title
          : activeScreen === "create-problem"
            ? ru.createProblem.title
            : activeScreen === "create-lost-found"
              ? ru.createLostFound.title
              : activeScreen === "create-question"
                ? ru.createQuestion.title
                : activeScreen === "question-detail"
                  ? ru.questions.detailTitle
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
    const shouldShowBackButton = activeScreen !== "home" && activeScreen !== "profile";

    return bindTelegramBackButton(shouldShowBackButton, () => {
      if (activeScreen === "announcement-detail" || activeScreen === "question-detail") {
        setActiveScreen("home");
        return;
      }

      setActiveScreen("home");
    });
  }, [activeScreen]);

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return [...content.announcements]
      .filter((item) => `${item.title} ${item.body} ${item.category} ${item.authorName}`.toLowerCase().includes(normalizedQuery))
      .filter((item) => (categoryFilter === "all" ? true : item.category === categoryFilter))
      .filter((item) => {
        if (priceFilter === "free") return item.price === null;
        if (priceFilter === "paid") return item.price !== null;
        return true;
      })
      .sort((left, right) => {
        if (sortMode === "oldest") return new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime();
        if (sortMode === "cheap") return (left.price ?? 0) - (right.price ?? 0);
        if (sortMode === "expensive") return (right.price ?? 0) - (left.price ?? 0);
        return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
      });
  }, [categoryFilter, content.announcements, priceFilter, query, sortMode]);

  const filteredProblems = useMemo(() => filterCommunityItems(content.problems, query), [content.problems, query]);
  const filteredLostFound = useMemo(() => filterCommunityItems(content.lostFound, query), [content.lostFound, query]);
  const filteredQuestions = useMemo(() => filterCommunityItems(content.questions, query), [content.questions, query]);
  const filteredNews = useMemo(
    () => content.news.filter((item) => `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(query.toLowerCase())),
    [content.news, query]
  );
  const selectedQuestionAnswers = useMemo(
    () => content.questionAnswers.filter((item) => item.questionId === selectedQuestion?.id),
    [content.questionAnswers, selectedQuestion]
  );

  async function handleAnnouncementSubmit(event: FormEvent) {
    event.preventDefault();
    if (!announcementDraft.title.trim() || !announcementDraft.body.trim()) return;

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
      setContent((current) => ({ ...current, myAnnouncements: [created, ...current.myAnnouncements] }));
      setAnnouncementDraft({ title: "", category: "other", body: "", price: "", images: [] });
      setActiveScreen("profile");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ru.app.loadFailed);
    } finally {
      setSubmittingAnnouncement(false);
    }
  }

  async function handleCommunitySubmit(event: FormEvent, kind: CommunityItemKind) {
    event.preventDefault();
    if (!communityDraft.title.trim() || !communityDraft.body.trim()) return;

    try {
      setSubmittingCommunity(true);
      setError(null);
      const created = (await createCommunityItem(initData, {
        kind,
        title: communityDraft.title.trim(),
        body: communityDraft.body.trim()
      })) as PortalCommunityItem;

      setContent((current) => ({
        ...current,
        problems: kind === "problem" ? [created, ...current.problems] : current.problems,
        lostFound: kind === "lost_found" ? [created, ...current.lostFound] : current.lostFound,
        questions: kind === "question" ? [created, ...current.questions] : current.questions
      }));
      setCommunityDraft({ title: "", body: "" });
      setActiveScreen("home");
      setActiveHomeTab(kind === "problem" ? "problems" : kind === "lost_found" ? "lost-found" : "answers");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ru.app.loadFailed);
    } finally {
      setSubmittingCommunity(false);
    }
  }

  async function handleQuestionAnswerSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedQuestion || !questionAnswerDraft.trim()) return;

    try {
      setSubmittingAnswer(true);
      setError(null);
      const created = await createQuestionAnswer(initData, selectedQuestion.id, questionAnswerDraft.trim());
      setContent((current) => ({ ...current, questionAnswers: [...current.questionAnswers, created] }));
      setQuestionAnswerDraft("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ru.app.loadFailed);
    } finally {
      setSubmittingAnswer(false);
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

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    if (announcementDraft.images.length + files.length > MAX_IMAGES) {
      setError(ru.createAnnouncement.fileLimitError);
      event.target.value = "";
      return;
    }

    try {
      setError(null);
      const nextImages: AnnouncementImageDraft[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) throw new Error(ru.createAnnouncement.fileTypeError);
        nextImages.push(await prepareImageDraft(file));
      }
      setAnnouncementDraft((current) => ({ ...current, images: [...current.images, ...nextImages] }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ru.createAnnouncement.fileReadError);
    } finally {
      event.target.value = "";
    }
  }

  function handleRemoveImage(index: number) {
    setAnnouncementDraft((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }));
  }

  function openAnnouncement(announcement: PortalAnnouncement) {
    setSelectedAnnouncement(announcement);
    setActiveScreen("announcement-detail");
  }

  function openQuestion(question: PortalCommunityItem) {
    setSelectedQuestion(question);
    setActiveScreen("question-detail");
  }

  return (
    <div className="app-shell">
      <main className="app-frame">
        {screenTitle ? (
          <section className="screen-header">
            <p className="screen-header__title">{screenTitle}</p>
          </section>
        ) : null}

        {activeScreen === "home" && content.notice ? (
          <section className="marquee-card" aria-label={content.notice.title}>
            <div className="marquee-track">
              <span>{content.notice.title}: {content.notice.body}</span>
              <span>{content.notice.title}: {content.notice.body}</span>
            </div>
          </section>
        ) : null}

        {activeScreen === "home" ? (
          <>
            <label className="search-field">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ru.app.searchPlaceholder} />
            </label>

            <section className="hub-tabs" aria-label={ru.hub.tabsAria}>
              {hubTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`hub-tab ${activeHomeTab === tab.key ? "is-active" : ""}`}
                  onClick={() => setActiveHomeTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </section>
          </>
        ) : null}

        {loading ? <StateCard title={ru.app.loadingTitle} text={ru.app.loadingText} /> : null}
        {error ? <StateCard title={ru.app.errorTitle} text={error} tone="danger" /> : null}

        {!loading && !error ? (
          <>
            {activeScreen === "home" && activeHomeTab === "news" ? <EventsPage events={filteredNews} /> : null}

            {activeScreen === "home" && activeHomeTab === "announcements" ? (
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

            {activeScreen === "home" && activeHomeTab === "problems" ? (
              <CommunityBoardPage
                title={ru.problems.title}
                addLabel={ru.problems.addButton}
                emptyTitle={ru.problems.emptyTitle}
                emptyText={ru.problems.emptyText}
                items={filteredProblems}
                onAdd={() => setActiveScreen("create-problem")}
              />
            ) : null}

            {activeScreen === "home" && activeHomeTab === "lost-found" ? (
              <CommunityBoardPage
                title={ru.lostFound.title}
                addLabel={ru.lostFound.addButton}
                emptyTitle={ru.lostFound.emptyTitle}
                emptyText={ru.lostFound.emptyText}
                items={filteredLostFound}
                onAdd={() => setActiveScreen("create-lost-found")}
              />
            ) : null}

            {activeScreen === "home" && activeHomeTab === "answers" ? (
              <QuestionsPage items={filteredQuestions} onAdd={() => setActiveScreen("create-question")} onOpen={openQuestion} />
            ) : null}

            {activeScreen === "profile" ? (
              <ProfilePage profile={content.profile} announcements={content.myAnnouncements} onDeleteAnnouncement={handleAnnouncementDelete} />
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

            {activeScreen === "create-problem" ? (
              <CreateSimplePostPage
                eyebrow={ru.createProblem.eyebrow}
                title={ru.createProblem.title}
                subtitle={ru.createProblem.subtitle}
                titleValue={communityDraft.title}
                bodyValue={communityDraft.body}
                titlePlaceholder={ru.createProblem.namePlaceholder}
                bodyPlaceholder={ru.createProblem.bodyPlaceholder}
                submitting={submittingCommunity}
                onTitleChange={(value) => setCommunityDraft((current) => ({ ...current, title: value }))}
                onBodyChange={(value) => setCommunityDraft((current) => ({ ...current, body: value }))}
                onSubmit={(event) => handleCommunitySubmit(event, "problem")}
              />
            ) : null}

            {activeScreen === "create-lost-found" ? (
              <CreateSimplePostPage
                eyebrow={ru.createLostFound.eyebrow}
                title={ru.createLostFound.title}
                subtitle={ru.createLostFound.subtitle}
                titleValue={communityDraft.title}
                bodyValue={communityDraft.body}
                titlePlaceholder={ru.createLostFound.namePlaceholder}
                bodyPlaceholder={ru.createLostFound.bodyPlaceholder}
                submitting={submittingCommunity}
                onTitleChange={(value) => setCommunityDraft((current) => ({ ...current, title: value }))}
                onBodyChange={(value) => setCommunityDraft((current) => ({ ...current, body: value }))}
                onSubmit={(event) => handleCommunitySubmit(event, "lost_found")}
              />
            ) : null}

            {activeScreen === "create-question" ? (
              <CreateSimplePostPage
                eyebrow={ru.createQuestion.eyebrow}
                title={ru.createQuestion.title}
                subtitle={ru.createQuestion.subtitle}
                titleValue={communityDraft.title}
                bodyValue={communityDraft.body}
                titlePlaceholder={ru.createQuestion.namePlaceholder}
                bodyPlaceholder={ru.createQuestion.bodyPlaceholder}
                submitting={submittingCommunity}
                onTitleChange={(value) => setCommunityDraft((current) => ({ ...current, title: value }))}
                onBodyChange={(value) => setCommunityDraft((current) => ({ ...current, body: value }))}
                onSubmit={(event) => handleCommunitySubmit(event, "question")}
              />
            ) : null}

            {activeScreen === "announcement-detail" && selectedAnnouncement ? <AnnouncementDetailsPage announcement={selectedAnnouncement} /> : null}

            {activeScreen === "question-detail" && selectedQuestion ? (
              <QuestionDetailsPage
                question={selectedQuestion}
                answers={selectedQuestionAnswers}
                answerDraft={questionAnswerDraft}
                submitting={submittingAnswer}
                onAnswerDraftChange={setQuestionAnswerDraft}
                onSubmitAnswer={handleQuestionAnswerSubmit}
              />
            ) : null}
          </>
        ) : null}
      </main>

      <nav className="bottom-nav" aria-label={ru.app.title}>
        {bottomTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`bottom-nav__item ${activeScreen === tab.key ? "is-active" : ""}`}
            onClick={() => {
              setActiveScreen(tab.key);
              setSelectedAnnouncement(null);
              setSelectedQuestion(null);
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

function NavIcon({ tab, active }: { tab: "home" | "profile"; active: boolean }) {
  const color = active ? "currentColor" : "currentColor";

  if (tab === "home") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 10.5L12 4L20 10.5V19A1 1 0 0 1 19 20H5A1 1 0 0 1 4 19V10.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 20V13H15V20" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
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

function filterCommunityItems(items: PortalCommunityItem[], query: string) {
  const normalizedQuery = query.toLowerCase();
  return items.filter((item) => `${item.title} ${item.body} ${item.authorName}`.toLowerCase().includes(normalizedQuery));
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
