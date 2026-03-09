import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";
import { isAdminTelegramId, requireTelegramUser } from "../_lib/telegram";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, title, summary, category } = await readJson<{
      initData: string;
      title: string;
      summary: string;
      category: string;
    }>(req);
    const user = requireTelegramUser(initData);

    if (!isAdminTelegramId(user.id)) {
      throw new Error("Access denied");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("news")
      .insert({
        title,
        summary,
        category,
        author_telegram_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create news");
    }

    res.status(200).json({
      id: data.id,
      title: data.title,
      summary: data.summary,
      category: data.category,
      publishedAt: data.published_at
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
