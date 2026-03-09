import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";
import { isAdminTelegramId, requireTelegramUser } from "../_lib/telegram";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, title, body } = await readJson<{ initData: string; title: string; body: string }>(req);
    const user = requireTelegramUser(initData);

    if (!isAdminTelegramId(user.id)) {
      throw new Error("Access denied");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title,
        body,
        author_telegram_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create announcement");
    }

    res.status(200).json({
      id: data.id,
      title: data.title,
      body: data.body,
      publishedAt: data.published_at
    });
  } catch (error) {
    handleApiError(res, error);
  }
}

