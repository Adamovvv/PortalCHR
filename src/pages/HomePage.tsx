import type { PortalNews, PortalNotice } from "../types";
import { ru } from "../content/ru";
import { StateCard } from "../components/StateCard";

type HomePageProps = {
  notice: PortalNotice | null;
  news: PortalNews[];
  username: string;
};

export function HomePage({ notice, news, username }: HomePageProps) {
  return (
    <>
      <section className="welcome-card">
        <p className="eyebrow">{ru.home.welcomeEyebrow}</p>
        <h2>{username}</h2>
        <p>{ru.home.welcomeText}</p>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">{ru.home.noticeEyebrow}</p>
            <h3>{ru.home.noticeTitle}</h3>
          </div>
          {notice ? (
            <span className="pill">
              {ru.home.noticeUpdatedPrefix} {formatDate(notice.updatedAt)}
            </span>
          ) : null}
        </div>
        {notice ? (
          <article className="notice-card">
            <h4>{notice.title}</h4>
            <p>{notice.body}</p>
          </article>
        ) : (
          <StateCard title={ru.home.noticeEmptyTitle} text={ru.home.noticeEmptyText} />
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">{ru.home.newsEyebrow}</p>
            <h3>{ru.home.newsTitle}</h3>
          </div>
          <span className="pill">{news.length} {ru.home.newsCountSuffix}</span>
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
            <StateCard title={ru.home.newsEmptyTitle} text={ru.home.newsEmptyText} />
          )}
        </div>
      </section>
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}