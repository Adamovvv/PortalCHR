import { announcementCategoryOptions, announcementPriceFilterOptions, announcementSortOptions, ru } from "../content/ru";
import { StateCard } from "../components/StateCard";
import type {
  AnnouncementPriceFilter,
  AnnouncementSortMode,
  PortalAnnouncement,
  PortalAnnouncementCategory
} from "../types";

type AnnouncementsPageProps = {
  announcements: PortalAnnouncement[];
  categoryFilter: PortalAnnouncementCategory | "all";
  priceFilter: AnnouncementPriceFilter;
  sortMode: AnnouncementSortMode;
  onCategoryFilterChange: (value: PortalAnnouncementCategory | "all") => void;
  onPriceFilterChange: (value: AnnouncementPriceFilter) => void;
  onSortModeChange: (value: AnnouncementSortMode) => void;
  onOpenAnnouncement: (announcement: PortalAnnouncement) => void;
};

export function AnnouncementsPage({
  announcements,
  categoryFilter,
  priceFilter,
  sortMode,
  onCategoryFilterChange,
  onPriceFilterChange,
  onSortModeChange,
  onOpenAnnouncement
}: AnnouncementsPageProps) {
  return (
    <>
      <section className="panel page-section">
        <p className="subtle-copy">{ru.announcements.oneFree}</p>

        <div className="filters-grid">
          <label className="field-block field-block--compact">
            <span>{ru.announcements.categoryFilterLabel}</span>
            <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value as PortalAnnouncementCategory | "all")}>
              <option value="all">{ru.announcements.allCategories}</option>
              {announcementCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-block field-block--compact">
            <span>{ru.announcements.priceFilterLabel}</span>
            <select value={priceFilter} onChange={(event) => onPriceFilterChange(event.target.value as AnnouncementPriceFilter)}>
              {announcementPriceFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-block field-block--compact">
            <span>{ru.announcements.sortLabel}</span>
            <select value={sortMode} onChange={(event) => onSortModeChange(event.target.value as AnnouncementSortMode)}>
              {announcementSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className={`announcement-grid ${announcements.length === 1 ? "announcement-grid--single" : ""}`}>
        {announcements.length ? (
          announcements.map((item) => {
            const categoryLabel = announcementCategoryOptions.find((option) => option.value === item.category)?.label ?? item.category;
            const writeUrl = item.authorUsername ? `https://t.me/${item.authorUsername}` : null;
            const coverImage = item.imageUrls[0] ?? null;

            return (
              <article className="content-card content-card--announcement" key={item.id}>
                {coverImage ? (
                  <button className="card-image-button" type="button" onClick={() => onOpenAnnouncement(item)}>
                    <img className="announcement-cover" src={coverImage} alt={item.title} />
                  </button>
                ) : null}

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
                <div className="announcement-actions">
                  <button className="primary-action" type="button" onClick={() => onOpenAnnouncement(item)}>
                    {ru.announcements.detailsButton}
                  </button>
                  {writeUrl ? (
                    <a className="secondary-action link-action" href={writeUrl} target="_blank" rel="noreferrer">
                      {ru.announcements.writeButton}
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <StateCard title={ru.announcements.emptyTitle} text={ru.announcements.emptyText} />
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
