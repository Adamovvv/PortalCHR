import { ru } from "../content/ru";
import type { PortalProfile } from "../types";

type ProfilePageProps = {
  profile: PortalProfile | null;
};

export function ProfilePage({ profile }: ProfilePageProps) {
  return (
    <div className="page-stack">
      <section className="profile-card page-section profile-card--clean">
        <div className="avatar">
          {profile?.photoUrl ? <img src={profile.photoUrl} alt={profile.firstName} /> : <span>PR</span>}
        </div>
        <div>
          <h3>{[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || ru.profile.fallbackName}</h3>
          <p>@{profile?.username || ru.profile.missingUsername}</p>
          <p>{ru.profile.telegramId}: {profile?.telegramId ?? "-"}</p>
        </div>
      </section>
    </div>
  );
}