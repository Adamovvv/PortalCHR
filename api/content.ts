import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "./_lib/http.js";
import { getSupabaseAdmin } from "./_lib/supabase.js";
import { isAdminTelegramId, requireTelegramUser } from "./_lib/telegram.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData } = await readJson<{ initData: string }>(req);
    const user = requireTelegramUser(initData);
    const supabase = getSupabaseAdmin();

    const [profileResult, noticeResult, newsResult, announcementsResult, myAnnouncementsResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("telegram_id", user.id).maybeSingle(),
      supabase.from("portal_notice").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("news").select("*").order("published_at", { ascending: false }).limit(20),
      supabase.from("announcements").select("*").eq("status", "approved").order("published_at", { ascending: false }).limit(30),
      supabase.from("announcements").select("*").eq("author_telegram_id", user.id).order("published_at", { ascending: false }).limit(30)
    ]);

    if (
      profileResult.error ||
      noticeResult.error ||
      newsResult.error ||
      announcementsResult.error ||
      myAnnouncementsResult.error
    ) {
      throw new Error("Failed to load portal content from Supabase");
    }

    const mapAnnouncement = (item: any) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      category: item.category,
      authorName: item.author_name,
      authorUsername: item.author_username,
      authorTelegramId: item.author_telegram_id,
      price: item.price,
      status: item.status,
      imageUrls: item.image_urls ?? [],
      publishedAt: item.published_at
    });

    res.status(200).json({
      profile: profileResult.data
        ? {
            telegramId: profileResult.data.telegram_id,
            firstName: profileResult.data.first_name,
            lastName: profileResult.data.last_name,
            username: profileResult.data.username,
            photoUrl: profileResult.data.photo_url,
            isAdmin: isAdminTelegramId(profileResult.data.telegram_id)
          }
        : null,
      notice: noticeResult.data
        ? {
            id: noticeResult.data.id,
            title: noticeResult.data.title,
            body: noticeResult.data.body,
            updatedAt: noticeResult.data.updated_at
          }
        : null,
      news: (newsResult.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        publishedAt: item.published_at
      })),
      announcements: (announcementsResult.data ?? []).map(mapAnnouncement),
      myAnnouncements: (myAnnouncementsResult.data ?? []).map(mapAnnouncement)
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
