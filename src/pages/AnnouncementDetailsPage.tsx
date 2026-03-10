import { announcementCategoryOptions, ru } from "../content/ru";
import type { PortalAnnouncement } from "../types";

type AnnouncementDetailsPageProps = {
  announcement: PortalAnnouncement;
};

export function AnnouncementDetailsPage({ announcement }: AnnouncementDetailsPageProps) {
  const categoryLabel = announcementCategoryOptions.find((option) => option.value === announcement.category)?.label ?? announcement.category;
  const writeUrl = announcement.authorUsername ? `https://t.me/${announcement.authorUsername}` : null;
  const coverImage = announcement.imageUrls[0] ?? null;

  return (
    <section className="panel page-section panel--detail">
      {coverImage ? (
        <div className="detail-cover-wrap">
          <img className="detail-cover" src={coverImage} alt={announcement.title} />
        </div>
      ) : (
        <div className="detail-cover detail-cover--empty">{ru.announcements.noImages}</div>
      )}

      {announcement.imageUrls.length > 1 ? (
        <div className="detail-thumbs">
          {announcement.imageUrls.map((imageUrl, index) => (
            <img key={`${imageUrl}-${index}`} className="detail-thumb" src={imageUrl} alt={`${announcement.title} ${index + 1}`} />
          ))}
        </div>
      ) : null}

      <div className="detail-meta-row">
        <span className="pill">{categoryLabel}</span>
        <strong>{announcement.price !== null ? `${announcement.price} ₽` : ru.announcements.freeLabel}</strong>
      </div>

      <div className="detail-copy">
        <h3>{announcement.title}</h3>
        <p>{announcement.body}</p>
      </div>

      <div className="detail-info-card">
        <div className="detail-info-line">
          <span>{ru.announcements.authorLabel}</span>
          <strong>{announcement.authorName}</strong>
        </div>
        <div className="detail-info-line">
          <span>{ru.announcements.publishedLabel}</span>
          <strong>{formatDate(announcement.publishedAt)}</strong>
        </div>
      </div>

      {writeUrl ? (
        <a className="primary-action link-action" href={writeUrl} target="_blank" rel="noreferrer">
          {ru.announcements.writeButton}
        </a>
      ) : null}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
