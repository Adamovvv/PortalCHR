import { announcementCategoryOptions, ru } from "../content/ru";
import { StateCard } from "../components/StateCard";
import type { PortalAnnouncement } from "../types";

type AnnouncementsPageProps = {
  announcements: PortalAnnouncement[];
  onCreateAnnouncement: () => void;
};

export function AnnouncementsPage({ announcements, onCreateAnnouncement }: AnnouncementsPageProps) {
  return (
    <section className="panel page-section panel--flat">
      <div className="panel__header panel__header--stack">
        <div>
          <p className="eyebrow">{ru.announcements.eyebrow}</p>
          <h3>{ru.announcements.title}</h3>
        </div>
        <button className="primary-action" type="button" onClick={onCreateAnnouncement}>
          {ru.announcements.addButton}
        </button>
      </div>

      <p className="subtle-copy">{ru.announcements.oneFree}</p>

      <div className="stack">
        {announcements.length ? (
          announcements.map((item) => {
            const categoryLabel = announcementCategoryOptions.find((option) => option.value === item.category)?.label ?? item.category;
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