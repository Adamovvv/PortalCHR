import { useEffect, useRef, useState } from "react";
import { claimFarming, claimTask, loadAppData, startFarming, submitGameScore, updateLanguage } from "./lib/api";
import { bindTelegramBackButton, getInitData, getInitialTheme, impact, notify, openTelegramLink, setupTelegramChrome } from "./lib/telegram";
import type { AppLanguage, MiniAppData, TaskItem, ThemeMode } from "./types";

type Screen = "home" | "rating" | "tasks" | "friends" | "game" | "game-result";
type SpawnItem = { id: number; x: number; y: number; type: "token" | "bomb"; expiresAt: number };
type GameResultState = { score: number; addedTokens: number; isError: boolean } | null;

type Dictionary = {
  nav: Record<Exclude<Screen, "game" | "game-result">, string>;
  loading: string;
  openInsideTelegram: string;
  mainTitle: string;
  mainSubtitle: string;
  farmStart: string;
  farmClaim: string;
  farmActive: string;
  profile: string;
  language: string;
  play: string;
  tasksTitle: string;
  ratingTitle: string;
  friendsTitle: string;
  leaderboardTop: string;
  myPlace: string;
  yourFriends: string;
  copyLink: string;
  copied: string;
  invitedEmpty: string;
  complete: string;
  completed: string;
  open: string;
  gameFinished: string;
  gameSubmitError: string;
  gameReward: string;
  bombPenalty: string;
  farmReady: string;
  totalTokens: string;
  invitedCount: string;
  farmingEndsIn: string;
  seconds: string;
  errorLoad: string;
  collectedTokens: string;
  resultTitle: string;
  resultSubtitle: string;
  resultScore: string;
  resultReward: string;
  resultDone: string;
  resultRetry: string;
};

const text: Record<AppLanguage, Dictionary> = {
  ru: {
    nav: { home: "Главная", rating: "Рейтинг", tasks: "Задания", friends: "Друзья" },
    loading: "Загрузка мини-приложения...",
    openInsideTelegram: "Открой мини-приложение внутри Telegram.",
    mainTitle: "Фарм токенов",
    mainSubtitle: "Запускай фарм каждые 6 часов, выполняй задания и добирай токены в свайп-игре.",
    farmStart: "Начать фарминг",
    farmClaim: "Забрать награду",
    farmActive: "Фарминг активен",
    profile: "Профиль",
    language: "Язык",
    play: "Игра свайпы",
    tasksTitle: "Задания",
    ratingTitle: "Топ 100 игроков",
    friendsTitle: "Друзья и рефералы",
    leaderboardTop: "Лидеры по токенам",
    myPlace: "Мое место",
    yourFriends: "Приглашенные",
    copyLink: "Копировать ссылку",
    copied: "Ссылка скопирована",
    invitedEmpty: "Пока никто не присоединился по вашей ссылке.",
    complete: "Выполнить",
    completed: "Выполнено",
    open: "Открыть",
    gameFinished: "Игра окончена",
    gameSubmitError: "Не удалось сохранить результат игры.",
    gameReward: "Награда",
    bombPenalty: "Бомба -10",
    farmReady: "Фарм завершен",
    totalTokens: "Токены",
    invitedCount: "Друзей",
    farmingEndsIn: "До завершения",
    seconds: "сек",
    errorLoad: "Не удалось загрузить данные",
    collectedTokens: "Собрано",
    resultTitle: "Результат игры",
    resultSubtitle: "Свайп-сессия завершена. Награда уже учтена в балансе.",
    resultScore: "Собрано",
    resultReward: "Получено",
    resultDone: "На главную",
    resultRetry: "Сыграть еще"
  },
  en: {
    nav: { home: "Home", rating: "Rating", tasks: "Tasks", friends: "Friends" },
    loading: "Loading mini app...",
    openInsideTelegram: "Open this mini app inside Telegram.",
    mainTitle: "Token farming",
    mainSubtitle: "Run farming every 6 hours, complete tasks, and collect extra tokens in the swipe game.",
    farmStart: "Start farming",
    farmClaim: "Claim reward",
    farmActive: "Farming active",
    profile: "Profile",
    language: "Language",
    play: "Swipe game",
    tasksTitle: "Tasks",
    ratingTitle: "Top 100 players",
    friendsTitle: "Friends and referrals",
    leaderboardTop: "Leaders by tokens",
    myPlace: "My place",
    yourFriends: "Invited users",
    copyLink: "Copy link",
    copied: "Link copied",
    invitedEmpty: "No invited users yet.",
    complete: "Complete",
    completed: "Completed",
    open: "Open",
    gameFinished: "Game finished",
    gameSubmitError: "Failed to save game result.",
    gameReward: "Reward",
    bombPenalty: "Bomb -10",
    farmReady: "Farming complete",
    totalTokens: "Tokens",
    invitedCount: "Friends",
    farmingEndsIn: "Time left",
    seconds: "sec",
    errorLoad: "Failed to load data",
    collectedTokens: "Collected",
    resultTitle: "Game result",
    resultSubtitle: "Your swipe session is complete. The reward is already added to your balance.",
    resultScore: "Collected",
    resultReward: "Reward",
    resultDone: "Back home",
    resultRetry: "Play again"
  }
};

const GAME_DURATION_MS = 30_000;
const ITEM_LIFETIME_MS = 1_000;
const SPAWN_INTERVAL_MS = 450;
const BOT_USERNAME = "portalchr_bot";

export function App() {
  const initData = getInitData();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [screen, setScreen] = useState<Screen>("home");
  const [appData, setAppData] = useState<MiniAppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [gameItems, setGameItems] = useState<SpawnItem[]>([]);
  const [gameScore, setGameScore] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(GAME_DURATION_MS);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameResultText, setGameResultText] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResultState>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const gameIdRef = useRef(1);
  const gameScoreRef = useRef(0);

  const language = appData?.profile.language ?? "ru";
  const t = text[language];
  const farmDiff = appData?.farming.endsAt ? new Date(appData.farming.endsAt).getTime() - now : null;
  const farmCanClaim = Boolean(appData?.farming.endsAt && (farmDiff ?? 0) <= 0);
  const farmIsActive = Boolean(appData?.farming.endsAt && (farmDiff ?? 0) > 0);
  const referralLink = buildBotReferralLink(appData?.referrals.link ?? "", BOT_USERNAME);

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
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        if (!initData) {
          throw new Error(text.ru.openInsideTelegram);
        }

        const data = await loadAppData(initData);
        setAppData(data);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : text.ru.errorLoad);
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, [initData]);

  useEffect(() => bindTelegramBackButton(screen === "game", () => {
    finishGame(false);
    setScreen("home");
  }), [screen]);

  useEffect(() => {
    if (screen !== "game") {
      setGameRunning(false);
      setGameItems([]);
      return;
    }

    gameScoreRef.current = 0;
    setGameScore(0);
    setGameResultText(null);
    setGameResult(null);
    setGameRunning(true);
    setGameTimeLeft(GAME_DURATION_MS);

    const tickTimer = window.setInterval(() => {
      setGameTimeLeft((current) => {
        if (current <= 1000) {
          window.clearInterval(tickTimer);
          finishGame(true);
          return 0;
        }
        return current - 1000;
      });
    }, 1000);

    const spawnTimer = window.setInterval(() => {
      setGameItems((current) => {
        const active = current.filter((item) => item.expiresAt > Date.now());
        const next = [...active];
        const spawnCount = 1 + Math.floor(Math.random() * 3);

        for (let index = 0; index < spawnCount; index += 1) {
          next.push({
            id: (gameIdRef.current += 1),
            x: 8 + Math.random() * 84,
            y: 10 + Math.random() * 78,
            type: Math.random() > 0.72 ? "bomb" : "token",
            expiresAt: Date.now() + ITEM_LIFETIME_MS
          });
        }

        return next;
      });
    }, SPAWN_INTERVAL_MS);

    const cleanupTimer = window.setInterval(() => {
      setGameItems((current) => current.filter((item) => item.expiresAt > Date.now()));
    }, 180);

    return () => {
      window.clearInterval(tickTimer);
      window.clearInterval(spawnTimer);
      window.clearInterval(cleanupTimer);
    };
  }, [screen]);

  async function refreshAppData() {
    if (!initData) return;
    const data = await loadAppData(initData);
    setAppData(data);
  }

  async function handleFarmAction() {
    if (!appData || !initData) return;

    try {
      setBusyKey("farm");
      setError(null);
      if (farmCanClaim) {
        const response = await claimFarming(initData);
        setAppData((current) => {
          if (!current) return current;
          return {
            ...current,
            profile: {
              ...current.profile,
              tokenBalance: response.tokenBalance,
              farmingStartedAt: response.farmingStartedAt,
              farmingEndsAt: response.farmingEndsAt
            },
            farming: {
              ...current.farming,
              startedAt: response.farmingStartedAt,
              endsAt: response.farmingEndsAt,
              isActive: false,
              canClaim: false
            }
          };
        });
        notify("success");
      } else {
        const response = await startFarming(initData);
        setAppData((current) => {
          if (!current) return current;
          return {
            ...current,
            profile: {
              ...current.profile,
              farmingStartedAt: response.farmingStartedAt,
              farmingEndsAt: response.farmingEndsAt
            },
            farming: {
              ...current.farming,
              startedAt: response.farmingStartedAt,
              endsAt: response.farmingEndsAt,
              isActive: true,
              canClaim: false
            }
          };
        });
        impact("medium");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errorLoad);
      notify("error");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleLanguageToggle() {
    if (!appData || !initData) return;
    const nextLanguage: AppLanguage = appData.profile.language === "ru" ? "en" : "ru";

    try {
      setBusyKey("language");
      await updateLanguage(initData, nextLanguage);
      await refreshAppData();
      impact("light");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errorLoad);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleTaskAction(task: TaskItem) {
    if (!appData || !initData || task.completed) return;

    try {
      setBusyKey(task.id);
      setError(null);
      if (task.actionUrl) {
        openTelegramLink(task.actionUrl);
      }
      const response = await claimTask(initData, task.id);
      setAppData((current) => {
        if (!current) return current;
        return {
          ...current,
          profile: { ...current.profile, tokenBalance: response.tokenBalance },
          tasks: current.tasks.map((item) =>
            item.id === task.id ? { ...item, completed: true, completedAt: response.completedAt } : item
          )
        };
      });
      notify("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errorLoad);
      notify("error");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCopyReferral() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setGameResultText(t.copied);
      impact("light");
      window.setTimeout(() => setGameResultText(null), 1600);
    } catch {
      setError("Clipboard is unavailable");
    }
  }

  function collectAt(clientX: number, clientY: number) {
    if (!gameRunning || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const xPercent = ((clientX - rect.left) / rect.width) * 100;
    const yPercent = ((clientY - rect.top) / rect.height) * 100;

    setGameItems((current) => {
      const hits = current.filter((item) => Math.abs(item.x - xPercent) < 7 && Math.abs(item.y - yPercent) < 7);
      if (!hits.length) {
        return current;
      }

      let delta = 0;
      for (const hit of hits) {
        delta += hit.type === "token" ? 1 : -10;
      }

      const nextScore = Math.max(0, gameScoreRef.current + delta);
      gameScoreRef.current = nextScore;
      setGameScore(nextScore);
      delta < 0 ? notify("warning") : impact("light");

      const hitIds = new Set(hits.map((item) => item.id));
      return current.filter((item) => !hitIds.has(item.id));
    });
  }

  function finishGame(shouldSubmit: boolean) {
    setGameRunning(false);
    setGameItems([]);

    if (!shouldSubmit || !initData) {
      return;
    }

    const scoreToSubmit = gameScoreRef.current;
    void (async () => {
      try {
        const response = await submitGameScore(initData, scoreToSubmit);
        setAppData((current) => current ? {
          ...current,
          profile: { ...current.profile, tokenBalance: response.tokenBalance }
        } : current);
        setGameResult({ score: scoreToSubmit, addedTokens: response.addedTokens, isError: false });
        setGameResultText(null);
        setScreen("game-result");
        notify("success");
      } catch {
        setGameResult({ score: scoreToSubmit, addedTokens: 0, isError: true });
        setGameResultText(t.gameSubmitError);
        setScreen("game-result");
        notify("error");
      }
    })();
  }

  if (loading) {
    return <div className="loading-screen">{t.loading}</div>;
  }

  if (error && !appData) {
    return <div className="loading-screen">{error}</div>;
  }

  if (!appData) {
    return <div className="loading-screen">{t.errorLoad}</div>;
  }

  const farmStatus = deriveFarmStatus(appData.farming.endsAt, now, t);
  const farmButtonLabel = farmCanClaim
    ? `${t.farmClaim} +${appData.farming.reward}`
    : farmIsActive
      ? `${t.farmActive} ${farmStatus}`
      : `${t.farmStart} +${appData.farming.reward}`;

  if (screen === "game") {
    return (
      <div className="game-shell">
        <div className="game-frame">
          <div className="game-topbar game-topbar--fullwidth">
            <div className="game-stat">
              <span>{t.collectedTokens}</span>
              <strong>{gameScore}</strong>
            </div>
            <div className="game-stat">
              <span>{t.farmingEndsIn}</span>
              <strong>{Math.ceil(gameTimeLeft / 1000)} {t.seconds}</strong>
            </div>
          </div>
          <div
            ref={arenaRef}
            className="game-arena"
            onPointerMove={(event) => collectAt(event.clientX, event.clientY)}
            onPointerDown={(event) => collectAt(event.clientX, event.clientY)}
          >
            {gameItems.map((item) => (
              <div
                key={item.id}
                className={`spawn-item spawn-item--${item.type}`}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
              >
                {item.type === "token" ? "✦" : "✕"}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "game-result") {
    return (
      <div className="game-shell game-shell--result">
        <div className="game-result-screen app-frame">
          <section className="game-result-card">
            <p className="hero-card__eyebrow">{t.gameFinished}</p>
            <h2>{t.resultTitle}</h2>
            <p className="hero-card__text">{gameResult?.isError ? t.gameSubmitError : t.resultSubtitle}</p>
            <div className="game-result-stats">
              <div className="game-result-stat">
                <span>{t.resultScore}</span>
                <strong>{gameResult?.score ?? 0}</strong>
              </div>
              <div className="game-result-stat">
                <span>{t.resultReward}</span>
                <strong>{gameResult?.isError ? "0" : `+${gameResult?.addedTokens ?? 0}`}</strong>
              </div>
            </div>
            <div className="game-result-actions">
              <button type="button" className="primary-button" onClick={() => setScreen("home")}>
                {t.resultDone}
              </button>
              <button type="button" className="secondary-button" onClick={() => setScreen("game")}>
                {t.resultRetry}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <button type="button" className="chip chip--ghost" onClick={handleLanguageToggle} disabled={busyKey === "language"}>
            {language.toUpperCase()}
          </button>
          <div className="balance-pill">
            <span className="balance-pill__icon">⚡</span>
            <span>{formatNumber(appData.profile.tokenBalance)}</span>
          </div>
          <div className="avatar-pill">
            {appData.profile.photoUrl ? <img src={appData.profile.photoUrl} alt="avatar" /> : <span>{getInitials(appData.profile.firstName)}</span>}
            <div>
              <strong>{appData.profile.firstName}</strong>
              <small>@{appData.profile.username ?? "player"}</small>
            </div>
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        {screen === "home" ? (
          <section className="screen-content">
            <div className="hero-card">
              <p className="hero-card__eyebrow">{t.mainTitle}</p>
              <h1>{formatNumber(appData.profile.tokenBalance)}</h1>
              <p className="hero-card__text">{t.mainSubtitle}</p>
              <div className="hero-card__meta">
                <div>
                  <span>{t.farmingEndsIn}</span>
                  <strong>{farmStatus}</strong>
                </div>
                <div>
                  <span>{t.invitedCount}</span>
                  <strong>{appData.referrals.invitedCount}</strong>
                </div>
              </div>
              <button
                type="button"
                className="floating-cta__button floating-cta__button--inline hero-card__action"
                onClick={handleFarmAction}
                disabled={busyKey === "farm" || farmIsActive}
              >
                {farmButtonLabel}
              </button>
            </div>

            <button type="button" className="panel-card panel-card--play panel-card--full" onClick={() => setScreen("game")}>
              <span className="panel-card__label">{t.play}</span>
              <strong>30 {t.seconds}</strong>
            </button>

            <div className="info-strip">
              <div>
                <span>{t.totalTokens}</span>
                <strong>{formatNumber(appData.profile.tokenBalance)}</strong>
              </div>
              <div>
                <span>{t.myPlace}</span>
                <strong>#{appData.myLeaderboardEntry?.rank ?? "-"}</strong>
              </div>
              <div>
                <span>{t.language}</span>
                <strong>{language.toUpperCase()}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {screen === "rating" ? (
          <section className="screen-content">
            <div className="section-head">
              <p>{t.ratingTitle}</p>
              <h2>{t.leaderboardTop}</h2>
            </div>
            <div className="my-rank-card">
              <span>{t.myPlace}</span>
              <strong>#{appData.myLeaderboardEntry?.rank ?? "-"}</strong>
              <small>{formatNumber(appData.myLeaderboardEntry?.tokenBalance ?? appData.profile.tokenBalance)}</small>
            </div>
            <div className="list-stack">
              {appData.leaderboard.map((entry) => (
                <div key={entry.telegramId} className={`leader-card ${entry.isMe ? "is-me" : ""}`}>
                  <div className="leader-card__rank">#{entry.rank}</div>
                  <div className="leader-card__user">
                    <div className="leader-card__avatar">{entry.photoUrl ? <img src={entry.photoUrl} alt="avatar" /> : getInitials(entry.firstName)}</div>
                    <div>
                      <strong>{entry.firstName}</strong>
                      <small>@{entry.username ?? "player"}</small>
                    </div>
                  </div>
                  <div className="leader-card__score">{formatNumber(entry.tokenBalance)}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {screen === "tasks" ? (
          <section className="screen-content">
            <div className="section-head">
              <p>{t.tasksTitle}</p>
              <h2>{t.tasksTitle}</h2>
            </div>
            <div className="list-stack">
              {appData.tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-card__icon">{taskIcon(task.icon)}</div>
                  <div className="task-card__content">
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                    <small>+{task.rewardTokens}</small>
                  </div>
                  <button
                    type="button"
                    className={`task-card__button ${task.completed ? "is-completed" : ""}`}
                    disabled={task.completed || busyKey === task.id}
                    onClick={() => handleTaskAction(task)}
                  >
                    {task.completed ? t.completed : task.actionUrl ? t.open : t.complete}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {screen === "friends" ? (
          <section className="screen-content">
            <div className="section-head">
              <p>{t.friendsTitle}</p>
              <h2>{t.yourFriends}</h2>
            </div>
            <div className="referral-card">
              <span>{referralLink}</span>
              <button type="button" className="primary-button" onClick={handleCopyReferral}>
                {t.copyLink}
              </button>
            </div>
            <div className="info-strip info-strip--friends">
              <div>
                <span>{t.invitedCount}</span>
                <strong>{appData.referrals.invitedCount}</strong>
              </div>
              <div>
                <span>{t.totalTokens}</span>
                <strong>{formatNumber(appData.referrals.totalReferralTokens)}</strong>
              </div>
            </div>
            <div className="list-stack">
              {appData.referrals.invited.length ? (
                appData.referrals.invited.map((friend) => (
                  <div key={friend.telegramId} className="friend-card">
                    <div className="leader-card__avatar">{friend.photoUrl ? <img src={friend.photoUrl} alt="avatar" /> : getInitials(friend.firstName)}</div>
                    <div>
                      <strong>{friend.firstName}</strong>
                      <small>@{friend.username ?? "player"}</small>
                    </div>
                    <div className="friend-card__date">{formatDate(friend.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="empty-card">{t.invitedEmpty}</div>
              )}
            </div>
          </section>
        ) : null}

        {gameResultText ? <div className="toast">{gameResultText}</div> : null}
      </div>

      <nav className="bottom-nav">
        {(["rating", "tasks", "home", "friends"] as Array<Exclude<Screen, "game" | "game-result">>).map((item) => (
          <button key={item} type="button" className={`bottom-nav__item ${screen === item ? "is-active" : ""}`} onClick={() => setScreen(item)}>
            <span className="bottom-nav__icon">{navIcon(item)}</span>
            <span>{t.nav[item]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function deriveFarmStatus(endsAt: string | null, now: number, t: Dictionary) {
  if (!endsAt) return "06:00:00";
  const diff = new Date(endsAt).getTime() - now;
  return diff <= 0 ? t.farmReady : formatDuration(diff);
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function taskIcon(icon: string) {
  if (icon === "news") return "◌";
  if (icon === "friends") return "◎";
  return "➤";
}

function navIcon(screen: Exclude<Screen, "game" | "game-result">) {
  if (screen === "rating") return "◔";
  if (screen === "tasks") return "☑";
  if (screen === "friends") return "◯";
  return "⌘";
}

function buildBotReferralLink(sourceLink: string, botUsername: string) {
  const fallback = `https://t.me/${botUsername}`;
  if (!sourceLink) return fallback;

  try {
    const url = new URL(sourceLink);
    const startApp = url.searchParams.get("startapp") ?? url.searchParams.get("start");

    if (startApp) {
      return `${fallback}?startapp=${encodeURIComponent(startApp)}`;
    }

    const path = url.pathname.replace(/^\/+/, "");
    if (path) {
      return `${fallback}/${path}${url.search}`;
    }

    return fallback;
  } catch {
    if (/^https?:\/\/t\.me\//i.test(sourceLink)) {
      return sourceLink;
    }

    if (/^[a-z0-9_-]+$/i.test(sourceLink)) {
      return `${fallback}?startapp=${encodeURIComponent(sourceLink)}`;
    }

    return fallback;
  }
}
