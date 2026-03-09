import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
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
      throw new Error("Title and description are required");
    }

    const { data: existingFree, error: existingError } = await supabase
      .from("announcements")
      .select("id")
      .eq("author_telegram_id", user.id)
      .eq("is_free", true)
      .limit(1);

    if (existingError) {
      throw new Error("Failed to validate announcement limit");
    }

    if ((existingFree ?? []).length > 0) {
      throw new Error("Бесплатное объявление уже опубликовано для этого профиля");
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
        price: normalizedPrice,
        is_free: true,
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
      category: data.category,
      authorName: data.author_name,
      price: data.price,
      publishedAt: data.published_at
    });
  } catch (error) {
    handleApiError(res, error);
  }
}