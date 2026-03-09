import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Markup, Telegraf } from "telegraf";
import { getAdminIds, getRequiredEnv } from "./_lib/config";
import { getSupabaseAdmin } from "./_lib/supabase";

type AdminState = {
  mode: "notice" | "news" | "announcement";
  step: "title" | "body" | "category";
  draft: {
    title?: string;
    body?: string;
    category?: string;
  };
};

const bot = new Telegraf(getRequiredEnv("TELEGRAM_BOT_TOKEN"));
const adminStates = new Map<number, AdminState>();

function getMiniAppUrl(path = "/") {
  const baseUrl = getRequiredEnv("VITE_APP_URL").replace(/\/$/, "");
  return `${baseUrl}${path}`;
}

function isAdmin(userId?: number) {
  return !!userId && getAdminIds().includes(userId);
}

bot.start(async (ctx) => {
  await ctx.reply(
    "Портал Республики готов. Открой мини-апп кнопкой ниже.",
    Markup.inlineKeyboard([Markup.button.webApp("Открыть портал", getMiniAppUrl("/"))])
  );
});

bot.command("admin", async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Команда доступна только администраторам.");
    return;
  }

  await ctx.reply(
    "Панель администратора. Можно открыть мини-апп или быстро опубликовать контент прямо из чата.",
    Markup.inlineKeyboard([
      [Markup.button.webApp("Открыть админ-панель", getMiniAppUrl("/"))],
      [
        Markup.button.callback("Новое сообщение", "admin:notice"),
        Markup.button.callback("Новая новость", "admin:news")
      ],
      [Markup.button.callback("Новое объявление", "admin:announcement")]
    ])
  );
});

bot.action("admin:notice", async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.answerCbQuery("Нет доступа");
    return;
  }

  adminStates.set(ctx.from.id, { mode: "notice", step: "title", draft: {} });
  await ctx.answerCbQuery();
  await ctx.reply("Введи заголовок для информационного сообщения.");
});

bot.action("admin:news", async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.answerCbQuery("Нет доступа");
    return;
  }

  adminStates.set(ctx.from.id, { mode: "news", step: "title", draft: {} });
  await ctx.answerCbQuery();
  await ctx.reply("Введи заголовок новости.");
});

bot.action("admin:announcement", async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.answerCbQuery("Нет доступа");
    return;
  }

  adminStates.set(ctx.from.id, { mode: "announcement", step: "title", draft: {} });
  await ctx.answerCbQuery();
  await ctx.reply("Введи заголовок объявления.");
});

bot.on("text", async (ctx) => {
  if (!ctx.from || !isAdmin(ctx.from.id)) {
    return;
  }

  const state = adminStates.get(ctx.from.id);
  if (!state) {
    return;
  }

  const text = ctx.message.text.trim();
  const supabase = getSupabaseAdmin();

  if (state.step === "title") {
    state.draft.title = text;
    if (state.mode === "news") {
      state.step = "category";
      adminStates.set(ctx.from.id, state);
      await ctx.reply("Теперь введи категорию новости.");
      return;
    }

    state.step = "body";
    adminStates.set(ctx.from.id, state);
    await ctx.reply("Теперь введи основной текст.");
    return;
  }

  if (state.step === "category") {
    state.draft.category = text;
    state.step = "body";
    adminStates.set(ctx.from.id, state);
    await ctx.reply("Теперь введи краткое описание новости.");
    return;
  }

  state.draft.body = text;

  if (state.mode === "notice") {
    const { error } = await supabase.from("portal_notice").insert({
      title: state.draft.title,
      body: state.draft.body,
      author_telegram_id: ctx.from.id
    });
    if (error) {
      throw new Error("Не удалось сохранить сообщение.");
    }
    adminStates.delete(ctx.from.id);
    await ctx.reply("Информационное сообщение обновлено.");
    return;
  }

  if (state.mode === "news") {
    const { error } = await supabase.from("news").insert({
      title: state.draft.title,
      category: state.draft.category ?? "Новости",
      summary: state.draft.body,
      author_telegram_id: ctx.from.id
    });
    if (error) {
      throw new Error("Не удалось создать новость.");
    }
    adminStates.delete(ctx.from.id);
    await ctx.reply("Новость опубликована.");
    return;
  }

  const { error } = await supabase.from("announcements").insert({
    title: state.draft.title,
    body: state.draft.body,
    author_telegram_id: ctx.from.id
  });

  if (error) {
    throw new Error("Не удалось создать объявление.");
  }

  adminStates.delete(ctx.from.id);
  await ctx.reply("Объявление опубликовано.");
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    res.status(200).json({ ok: true, message: "Telegram bot webhook is live" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await bot.handleUpdate(req.body, res);
    if (!res.writableEnded) {
      res.status(200).json({ ok: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
}
