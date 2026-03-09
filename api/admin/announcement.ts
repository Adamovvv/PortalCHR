import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getAdminIds, getRequiredEnv } from "../_lib/config.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";
import { requireTelegramUser } from "../_lib/telegram.js";

type AnnouncementCategory =
  | "transport"
  | "electronics"
  | "home"
  | "services"
  | "realty"
  | "jobs"
  | "other";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, title, body, category, price } = await readJson<{
      initData: string;
      title: string;
      body: string;
      category: AnnouncementCategory;
      price: number | null;
    }>(req);
    const user = requireTelegramUser(initData);
    const supabase = getSupabaseAdmin();

    if (!title.trim() || !body.trim()) {
      throw new Error("Название и описание обязательны");
    }

    const { data: existingFree, error: existingError } = await supabase
      .from("announcements")
      .select("id")
      .eq("author_telegram_id", user.id)
      .eq("is_free", true)
      .in("status", ["pending", "approved"])
      .limit(1);

    if (existingError) {
      throw new Error("Не удалось проверить лимит объявлений");
    }

    if ((existingFree ?? []).length > 0) {
      throw new Error("Бесплатное объявление уже отправлено или опубликовано");
    }

    const authorName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Telegram User";
    const normalizedPrice = typeof price === "number" && Number.isFinite(price) ? price : null;

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: title.trim(),
        body: body.trim(),
        category,
        author_name: authorName,
        author_username: user.username ?? null,
        price: normalizedPrice,
        is_free: true,
        status: "pending",
        author_telegram_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error("Не удалось создать объявление");
    }

    await notifyAdmins({
      id: data.id,
      title: data.title,
      body: data.body,
      category: data.category,
      price: data.price,
      authorName: data.author_name,
      authorUsername: data.author_username,
      authorTelegramId: data.author_telegram_id
    });

    res.status(200).json({
      id: data.id,
      title: data.title,
      body: data.body,
      category: data.category,
      authorName: data.author_name,
      authorUsername: data.author_username,
      authorTelegramId: data.author_telegram_id,
      price: data.price,
      status: data.status,
      publishedAt: data.published_at
    });
  } catch (error) {
    handleApiError(res, error);
  }
}

async function notifyAdmins(announcement: {
  id: string;
  title: string;
  body: string;
  category: string;
  price: number | null;
  authorName: string;
  authorUsername: string | null;
  authorTelegramId: number;
}) {
  const token = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const admins = getAdminIds();
  const message = [
    "Новое объявление на модерации",
    `Название: ${announcement.title}`,
    `Категория: ${announcement.category}`,
    `Автор: ${announcement.authorName}`,
    announcement.authorUsername ? `Username: @${announcement.authorUsername}` : `Telegram ID: ${announcement.authorTelegramId}`,
    announcement.price !== null ? `Цена: ${announcement.price} ₽` : "Цена: не указана",
    "",
    announcement.body
  ].join("\n");

  await Promise.all(
    admins.map((adminId) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: adminId,
          text: message,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Опубликовать", callback_data: `moderate:approve:${announcement.id}` },
                { text: "Отклонить", callback_data: `moderate:reject:${announcement.id}` }
              ]
            ]
          }
        })
      })
    )
  );
}