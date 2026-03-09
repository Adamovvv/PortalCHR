import { ru } from "../content/ru";
import { StateCard } from "../components/StateCard";
import type { PortalAnnouncement } from "../types";

type AnnouncementsPageProps = {
  announcements: PortalAnnouncement[];
};

export function AnnouncementsPage({ announcements }: AnnouncementsPageProps) {
  return (
    <section className="panel page-section">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{ru.announcements.eyebrow}</p>
          <h3>{ru.announcements.title}</h3>
        </div>
        <span className="pill">{announcements.length} {ru.announcements.countSuffix}</span>
      </div>

      <div className="stack">
        {announcements.length ? (
          announcements.map((item) => (
            <article className="content-card" key={item.id}>
              <div className="content-card__meta">
                <span className="pill">{ru.announcements.badge}</span>
                <span>{formatDate(item.publishedAt)}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </article>
          ))
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