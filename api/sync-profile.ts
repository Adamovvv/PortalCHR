import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "./_lib/http";
import { getSupabaseAdmin } from "./_lib/supabase";
import { isAdminTelegramId, requireTelegramUser } from "./_lib/telegram";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData } = await readJson<{ initData: string }>(req);
    const user = requireTelegramUser(initData);
    const supabase = getSupabaseAdmin();

    const payload = {
      telegram_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name ?? null,
      username: user.username ?? null,
      photo_url: user.photo_url ?? null
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "telegram_id" })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to sync Telegram profile");
    }

    res.status(200).json({
      telegramId: data.telegram_id,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
      photoUrl: data.photo_url,
      isAdmin: isAdminTelegramId(data.telegram_id)
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
