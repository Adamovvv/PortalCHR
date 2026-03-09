import { announcementCategoryOptions, announcementStatusLabels, ru } from "../content/ru";
import type { PortalAnnouncement, PortalProfile } from "../types";

type ProfilePageProps = {
  profile: PortalProfile | null;
  announcements: PortalAnnouncement[];
  onDeleteAnnouncement: (announcementId: string) => Promise<void>;
};

export function ProfilePage({ profile, announcements, onDeleteAnnouncement }: ProfilePageProps) {
  return (
    <>
      <section className="profile-card page-section profile-card--clean">
        <div className="avatar">
          {profile?.photoUrl ? <img src={profile.photoUrl} alt={profile.firstName} /> : <span>PR</span>}
        </div>
        <div className="profile-card__content">
          <h3>{[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || ru.profile.fallbackName}</h3>
          <p>@{profile?.username || ru.profile.missingUsername}</p>
          <p>
            {ru.profile.telegramId}: {profile?.telegramId ?? "-"}
          </p>
        </div>
      </section>

      <section className="panel page-section">
        <div className="panel__header panel__header--stack">
          <div>
            <h3>{ru.profile.myAnnouncements}</h3>
          </div>
        </div>

        <div className="stack">
          {announcements.length ? (
            announcements.map((item) => {
              const categoryLabel =
                announcementCategoryOptions.find((option) => option.value === item.category)?.label ?? item.category;

              return (
                <article className="content-card content-card--announcement" key={item.id}>
                  <div className="content-card__meta">
                    <span className="pill">{categoryLabel}</span>
                    <span>{announcementStatusLabels[item.status]}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                  <div className="announcement-meta">
                    <span>{formatDate(item.publishedAt)}</span>
                    <strong>{item.price !== null ? `${item.price} ?` : ru.announcements.freeLabel}</strong>
                  </div>
                  <button className="secondary-action" type="button" onClick={() => void onDeleteAnnouncement(item.id)}>
                    {ru.profile.deleteButton}
                  </button>
                </article>
              );
            })
          ) : (
            <p className="subtle-copy subtle-copy--empty">{ru.profile.myAnnouncementsEmpty}</p>
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
