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

type AnnouncementImagePayload = {
  name: string;
  type: string;
  dataUrl: string;
};

const STORAGE_BUCKET = process.env.SUPABASE_ANNOUNCEMENTS_BUCKET || "portal-announcements";
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 1_600_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, title, body, category, price, images = [] } = await readJson<{
      initData: string;
      title: string;
      body: string;
      category: AnnouncementCategory;
      price: number | null;
      images?: AnnouncementImagePayload[];
    }>(req);
    const user = requireTelegramUser(initData);
    const supabase = getSupabaseAdmin();

    if (!title.trim() || !body.trim()) {
      throw new Error("Название и описание обязательны");
    }

    if (images.length > MAX_IMAGES) {
      throw new Error("Можно загрузить не больше 3 фотографий");
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

    const imageUrls = await uploadAnnouncementImages(supabase, user.id, images);
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
        author_telegram_id: user.id,
        image_urls: imageUrls
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
      imageCount: (data.image_urls ?? []).length,
      authorName: data.author_name,
      authorUsername: data.author_username,
      authorTelegramId: data.author_telegram_id
    });

    res.status(200).json(mapAnnouncement(data));
  } catch (error) {
    handleApiError(res, error);
  }
}

async function uploadAnnouncementImages(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  telegramId: number,
  images: AnnouncementImagePayload[]
) {
  const uploadedUrls: string[] = [];

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];

    if (!image.type.startsWith("image/")) {
      throw new Error("Поддерживаются только изображения");
    }

    const buffer = parseDataUrl(image.dataUrl);

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("Фотография слишком большая после обработки");
    }

    const extension = getExtension(image.type);
    const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const path = `${telegramId}/${Date.now()}-${index}-${safeName || `image.${extension}`}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, {
      contentType: image.type,
      upsert: false
    });

    if (error) {
      throw new Error("Не удалось загрузить фотографию объявления");
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    throw new Error("Некорректный формат изображения");
  }

  return Buffer.from(match[2], "base64");
}

function getExtension(contentType: string) {
  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function mapAnnouncement(item: any) {
  return {
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
  };
}

async function notifyAdmins(announcement: {
  id: string;
  title: string;
  body: string;
  category: string;
  price: number | null;
  imageCount: number;
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
    `Фото: ${announcement.imageCount}`,
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
