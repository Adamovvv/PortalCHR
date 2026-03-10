import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";
import { requireTelegramUser } from "../_lib/telegram.js";

type CommunityKind = "problem" | "lost_found" | "question";

const tableByKind: Record<CommunityKind, string> = {
  problem: "problems",
  lost_found: "lost_found",
  question: "questions"
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, kind, title, body } = await readJson<{
      initData: string;
      kind: CommunityKind;
      title: string;
      body: string;
    }>(req);

    const user = requireTelegramUser(initData);
    const supabase = getSupabaseAdmin();

    if (!kind || !tableByKind[kind]) {
      throw new Error("Unknown community item type");
    }

    if (!title.trim() || !body.trim()) {
      throw new Error("Заголовок и описание обязательны");
    }

    const authorName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Telegram User";

    const { data, error } = await supabase
      .from(tableByKind[kind])
      .insert({
        title: title.trim(),
        body: body.trim(),
        author_name: authorName,
        author_username: user.username ?? null,
        author_telegram_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error("Не удалось сохранить запись");
    }

    res.status(200).json({
      id: data.id,
      title: data.title,
      body: data.body,
      authorName: data.author_name,
      authorUsername: data.author_username,
      authorTelegramId: data.author_telegram_id,
      createdAt: data.created_at
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
