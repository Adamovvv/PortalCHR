import type { FormEvent } from "react";
import { ru } from "../content/ru";
import { StateCard } from "../components/StateCard";
import type { PortalProfile } from "../types";

type ProfilePageProps = {
  profile: PortalProfile | null;
  isAdmin: boolean;
  saving: boolean;
  noticeDraft: { title: string; body: string };
  newsDraft: { title: string; summary: string; category: string };
  announcementDraft: { title: string; body: string };
  onNoticeDraftChange: (value: { title: string; body: string }) => void;
  onNewsDraftChange: (value: { title: string; summary: string; category: string }) => void;
  onAnnouncementDraftChange: (value: { title: string; body: string }) => void;
  onNoticeSubmit: (event: FormEvent) => Promise<void>;
  onNewsSubmit: (event: FormEvent) => Promise<void>;
  onAnnouncementSubmit: (event: FormEvent) => Promise<void>;
};

export function ProfilePage(props: ProfilePageProps) {
  const {
    profile,
    isAdmin,
    saving,
    noticeDraft,
    newsDraft,
    announcementDraft,
    onNoticeDraftChange,
    onNewsDraftChange,
    onAnnouncementDraftChange,
    onNoticeSubmit,
    onNewsSubmit,
    onAnnouncementSubmit
  } = props;

  return (
    <div className="page-stack">
      <section className="profile-card page-section">
        <div className="avatar">
          {profile?.photoUrl ? <img src={profile.photoUrl} alt={profile.firstName} /> : <span>PR</span>}
        </div>
        <div>
          <h3>{[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || ru.profile.fallbackName}</h3>
          <p>@{profile?.username || ru.profile.missingUsername}</p>
          <p>{ru.profile.telegramId}: {profile?.telegramId ?? "-"}</p>
        </div>
        {isAdmin ? <span className="pill pill--accent">{ru.profile.adminBadge}</span> : null}
      </section>

      {isAdmin ? (
        <>
          <section className="panel page-section">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{ru.profile.noticeEyebrow}</p>
                <h3>{ru.profile.noticeTitle}</h3>
              </div>
            </div>
            <form className="editor" onSubmit={(event) => void onNoticeSubmit(event)}>
              <input
                value={noticeDraft.title}
                onChange={(event) => onNoticeDraftChange({ ...noticeDraft, title: event.target.value })}
                placeholder={ru.profile.noticeTitlePlaceholder}
              />
              <textarea
                value={noticeDraft.body}
                onChange={(event) => onNoticeDraftChange({ ...noticeDraft, body: event.target.value })}
                placeholder={ru.profile.noticeBodyPlaceholder}
                rows={4}
              />
              <button className="primary-button" disabled={saving} type="submit">
                {ru.profile.noticeSubmit}
              </button>
            </form>
          </section>

          <section className="panel page-section">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{ru.profile.newsEyebrow}</p>
                <h3>{ru.profile.newsTitle}</h3>
              </div>
            </div>
            <form className="editor" onSubmit={(event) => void onNewsSubmit(event)}>
              <input
                value={newsDraft.title}
                onChange={(event) => onNewsDraftChange({ ...newsDraft, title: event.target.value })}
                placeholder={ru.profile.newsTitlePlaceholder}
              />
              <input
                value={newsDraft.category}
                onChange={(event) => onNewsDraftChange({ ...newsDraft, category: event.target.value })}
                placeholder={ru.profile.newsCategoryPlaceholder}
              />
              <textarea
                value={newsDraft.summary}
                onChange={(event) => onNewsDraftChange({ ...newsDraft, summary: event.target.value })}
                placeholder={ru.profile.newsBodyPlaceholder}
                rows={4}
              />
              <button className="primary-button" disabled={saving} type="submit">
                {ru.profile.newsSubmit}
              </button>
            </form>
          </section>

          <section className="panel page-section">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{ru.profile.announcementEyebrow}</p>
                <h3>{ru.profile.announcementTitle}</h3>
              </div>
            </div>
            <form className="editor" onSubmit={(event) => void onAnnouncementSubmit(event)}>
              <input
                value={announcementDraft.title}
                onChange={(event) =>
                  onAnnouncementDraftChange({ ...announcementDraft, title: event.target.value })
                }
                placeholder={ru.profile.announcementTitlePlaceholder}
              />
              <textarea
                value={announcementDraft.body}
                onChange={(event) =>
                  onAnnouncementDraftChange({ ...announcementDraft, body: event.target.value })
                }
                placeholder={ru.profile.announcementBodyPlaceholder}
                rows={4}
              />
              <button className="primary-button" disabled={saving} type="submit">
                {ru.profile.announcementSubmit}
              </button>
            </form>
          </section>
        </>
      ) : (
        <StateCard title={ru.profile.defaultTitle} text={ru.profile.defaultText} />
      )}
    </div>
  );
}