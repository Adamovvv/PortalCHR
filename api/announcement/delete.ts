import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";
import { requireTelegramUser } from "../_lib/telegram.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, announcementId } = await readJson<{ initData: string; announcementId: string }>(req);
    const user = requireTelegramUser(initData);
    const supabase = getSupabaseAdmin();

    const { data: announcement, error: loadError } = await supabase
      .from("announcements")
      .select("id, author_telegram_id")
      .eq("id", announcementId)
      .single();

    if (loadError || !announcement) {
      throw new Error("Объявление не найдено");
    }

    if (announcement.author_telegram_id !== user.id) {
      throw new Error("Удалять можно только свои объявления");
    }

    const { error } = await supabase.from("announcements").delete().eq("id", announcementId);

    if (error) {
      throw new Error("Не удалось удалить объявление");
    }

    res.status(200).json({ id: announcementId });
  } catch (error) {
    handleApiError(res, error);
  }
}