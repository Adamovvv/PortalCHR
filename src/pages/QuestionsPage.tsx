import { ru } from "../content/ru";
import { StateCard } from "../components/StateCard";
import type { PortalCommunityItem } from "../types";

type QuestionsPageProps = {
  items: PortalCommunityItem[];
  onAdd: () => void;
  onOpen: (item: PortalCommunityItem) => void;
};

export function QuestionsPage({ items, onAdd, onOpen }: QuestionsPageProps) {
  return (
    <>
      <section className="panel page-section">
        <div className="panel__header">
          <h3>{ru.questions.title}</h3>
          <button className="primary-action" type="button" onClick={onAdd}>
            {ru.questions.addButton}
          </button>
        </div>
      </section>

      <div className="stack">
        {items.length ? (
          items.map((item) => (
            <button className="content-card question-card-button" key={item.id} type="button" onClick={() => onOpen(item)}>
              <div className="content-card__meta">
                <span>{item.authorName}</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </button>
          ))
        ) : (
          <StateCard title={ru.questions.emptyTitle} text={ru.questions.emptyText} />
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
