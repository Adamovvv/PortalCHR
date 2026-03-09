import { announcementCategoryOptions, ru } from "../content/ru";
import { StateCard } from "../components/StateCard";
import type { PortalAnnouncement } from "../types";

type AnnouncementsPageProps = {
  announcements: PortalAnnouncement[];
};

export function AnnouncementsPage({ announcements }: AnnouncementsPageProps) {
  return (
    <section className="panel page-section">
      <p className="subtle-copy">{ru.announcements.oneFree}</p>

      <div className="stack">
        {announcements.length ? (
          announcements.map((item) => {
            const categoryLabel = announcementCategoryOptions.find((option) => option.value === item.category)?.label ?? item.category;
            const writeUrl = item.authorUsername ? `https://t.me/${item.authorUsername}` : null;
            return (
              <article className="content-card content-card--announcement" key={item.id}>
                <div className="content-card__meta">
                  <span className="pill">{categoryLabel}</span>
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
                <div className="announcement-meta">
                  <span>{item.authorName}</span>
                  <strong>{item.price !== null ? `${item.price} ₽` : ru.announcements.freeLabel}</strong>
                </div>
                {writeUrl ? (
                  <a className="secondary-action link-action" href={writeUrl} target="_blank" rel="noreferrer">
                    {ru.announcements.writeButton}
                  </a>
                ) : null}
              </article>
            );
          })
        ) : (
          <StateCard title={ru.announcements.emptyTitle} text={ru.announcements.emptyText} />
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}