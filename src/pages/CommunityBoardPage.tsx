import { StateCard } from "../components/StateCard";
import type { PortalCommunityItem } from "../types";

type CommunityBoardPageProps = {
  title: string;
  addLabel: string;
  emptyTitle: string;
  emptyText: string;
  items: PortalCommunityItem[];
  onAdd: () => void;
};

export function CommunityBoardPage({ title, addLabel, emptyTitle, emptyText, items, onAdd }: CommunityBoardPageProps) {
  return (
    <>
      <section className="panel page-section">
        <div className="panel__header">
          <h3>{title}</h3>
          <button className="primary-action" type="button" onClick={onAdd}>
            {addLabel}
          </button>
        </div>
      </section>

      <div className="stack">
        {items.length ? (
          items.map((item) => (
            <article className="content-card" key={item.id}>
              <div className="content-card__meta">
                <span>{item.authorName}</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </article>
          ))
        ) : (
          <StateCard title={emptyTitle} text={emptyText} />
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
