import type { FormEvent } from "react";
import { announcementCategoryOptions, ru } from "../content/ru";
import type { PortalAnnouncementCategory } from "../types";

type CreateAnnouncementPageProps = {
  draft: {
    title: string;
    category: PortalAnnouncementCategory;
    body: string;
    price: string;
  };
  submitting: boolean;
  onDraftChange: (value: {
    title: string;
    category: PortalAnnouncementCategory;
    body: string;
    price: string;
  }) => void;
  onBack: () => void;
  onSubmit: (event: FormEvent) => Promise<void>;
};

export function CreateAnnouncementPage({
  draft,
  submitting,
  onDraftChange,
  onBack,
  onSubmit
}: CreateAnnouncementPageProps) {
  return (
    <section className="panel panel--flat page-section">
      <div className="panel__header panel__header--stack">
        <div>
          <p className="eyebrow">{ru.createAnnouncement.eyebrow}</p>
          <h3>{ru.createAnnouncement.title}</h3>
        </div>
      </div>

      <p className="subtle-copy">{ru.createAnnouncement.subtitle}</p>

      <form className="editor" onSubmit={(event) => void onSubmit(event)}>
        <label className="field-block">
          <span>{ru.createAnnouncement.nameLabel}</span>
          <input
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
            placeholder={ru.createAnnouncement.namePlaceholder}
          />
        </label>

        <label className="field-block">
          <span>{ru.createAnnouncement.categoryLabel}</span>
          <select
            value={draft.category}
            onChange={(event) =>
              onDraftChange({ ...draft, category: event.target.value as PortalAnnouncementCategory })
            }
          >
            {announcementCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-block">
          <span>{ru.createAnnouncement.descriptionLabel}</span>
          <textarea
            value={draft.body}
            onChange={(event) => onDraftChange({ ...draft, body: event.target.value })}
            placeholder={ru.createAnnouncement.descriptionPlaceholder}
            rows={6}
          />
        </label>

        <label className="field-block">
          <span>{ru.createAnnouncement.priceLabel}</span>
          <input
            inputMode="decimal"
            value={draft.price}
            onChange={(event) => onDraftChange({ ...draft, price: event.target.value })}
            placeholder={ru.createAnnouncement.pricePlaceholder}
          />
        </label>

        <div className="form-actions">
          <button className="secondary-action" type="button" onClick={onBack}>
            {ru.createAnnouncement.cancel}
          </button>
          <button className="primary-action" disabled={submitting} type="submit">
            {ru.createAnnouncement.submit}
          </button>
        </div>
      </form>
    </section>
  );
}
