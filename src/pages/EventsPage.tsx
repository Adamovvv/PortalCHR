import { ru } from "../content/ru";
import { StateCard } from "../components/StateCard";
import type { PortalNews } from "../types";

type EventsPageProps = {
  events: PortalNews[];
};

export function EventsPage({ events }: EventsPageProps) {
  return (
    <>
      <section className="panel page-section">
        <div className="panel__header panel__header--stack">
          <div>
            <h3>{ru.events.title}</h3>
          </div>
          <span className="pill">{events.length}</span>
        </div>
      </section>

      <div className="stack">
        {events.length ? (
          events.map((item) => (
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
          <StateCard title={ru.events.emptyTitle} text={ru.events.emptyText} />
        )}
      </div>
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
