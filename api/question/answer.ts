import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";
import { requireTelegramUser } from "../_lib/telegram.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, questionId, body } = await readJson<{
      initData: string;
      questionId: string;
      body: string;
    }>(req);

    const user = requireTelegramUser(initData);
    const supabase = getSupabaseAdmin();

    if (!questionId || !body.trim()) {
      throw new Error("Вопрос и текст ответа обязательны");
    }

    const authorName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Telegram User";

    const { data, error } = await supabase
      .from("question_answers")
      .insert({
        question_id: questionId,
        body: body.trim(),
        author_name: authorName,
        author_username: user.username ?? null,
        author_telegram_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error("Не удалось сохранить ответ");
    }

    res.status(200).json({
      id: data.id,
      questionId: data.question_id,
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
