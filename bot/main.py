# -*- coding: utf-8 -*-
import logging
import os
from dataclasses import dataclass

from supabase import Client, create_client
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("portal_bot")


@dataclass
class AdminDraft:
    mode: str
    step: str
    title: str | None = None
    category: str | None = None
    body: str | None = None


def required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def get_admin_ids() -> set[int]:
    result: set[int] = set()
    for item in os.getenv("TELEGRAM_ADMIN_IDS", "").split(","):
        item = item.strip()
        if item.isdigit():
            result.add(int(item))
    return result


def is_admin(user_id: int | None) -> bool:
    return bool(user_id and user_id in get_admin_ids())


def get_mini_app_url(path: str = "/") -> str:
    return f"{required('VITE_APP_URL').rstrip('/')}{path}"


def get_supabase() -> Client:
    return create_client(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"))


def get_keyboard(admin: bool) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton("Открыть портал", web_app=WebAppInfo(url=get_mini_app_url("/")))]
    ]
    if admin:
        rows.append(
            [
                InlineKeyboardButton("Новое сообщение", callback_data="admin:notice"),
                InlineKeyboardButton("Новая новость", callback_data="admin:news"),
            ]
        )
        rows.append([InlineKeyboardButton("Новое объявление", callback_data="admin:announcement")])
    return InlineKeyboardMarkup(rows)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id if update.effective_user else None
    await update.effective_message.reply_text(
        "Портал Республики готов. Открой мини-апп кнопкой ниже.",
        reply_markup=get_keyboard(is_admin(user_id)),
    )


async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id if update.effective_user else None
    if not is_admin(user_id):
        await update.effective_message.reply_text("Команда доступна только администраторам.")
        return

    await update.effective_message.reply_text(
        "Панель администратора. Можно открыть мини-апп или быстро опубликовать контент прямо из чата.",
        reply_markup=get_keyboard(True),
    )


async def admin_action(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return

    user_id = query.from_user.id if query.from_user else None
    if not is_admin(user_id):
        await query.answer("Нет доступа", show_alert=True)
        return

    mode = (query.data or "").split(":", 1)[1]
    context.user_data["admin_draft"] = AdminDraft(mode=mode, step="title")
    prompts = {
        "notice": "Введи заголовок для информационного сообщения.",
        "news": "Введи заголовок новости.",
        "announcement": "Введи заголовок объявления.",
    }
    await query.answer()
    await query.message.reply_text(prompts[mode])


async def admin_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if user is None or not is_admin(user.id):
        return

    draft: AdminDraft | None = context.user_data.get("admin_draft")
    if draft is None:
        return

    text = (update.effective_message.text or "").strip()
    if not text:
        return

    if draft.step == "title":
        draft.title = text
        if draft.mode == "news":
            draft.step = "category"
            await update.effective_message.reply_text("Теперь введи категорию новости.")
            return
        draft.step = "body"
        await update.effective_message.reply_text("Теперь введи основной текст.")
        return

    if draft.step == "category":
        draft.category = text
        draft.step = "body"
        await update.effective_message.reply_text("Теперь введи краткое описание новости.")
        return

    draft.body = text
    supabase = get_supabase()

    if draft.mode == "notice":
        response = supabase.table("portal_notice").insert(
            {
                "title": draft.title,
                "body": draft.body,
                "author_telegram_id": user.id,
            }
        ).execute()
        if not response.data:
            raise RuntimeError("Не удалось сохранить сообщение.")
        await update.effective_message.reply_text("Информационное сообщение обновлено.")
    elif draft.mode == "news":
        response = supabase.table("news").insert(
            {
                "title": draft.title,
                "category": draft.category or "Новости",
                "summary": draft.body,
                "author_telegram_id": user.id,
            }
        ).execute()
        if not response.data:
            raise RuntimeError("Не удалось создать новость.")
        await update.effective_message.reply_text("Новость опубликована.")
    else:
        response = supabase.table("announcements").insert(
            {
                "title": draft.title,
                "body": draft.body,
                "author_telegram_id": user.id,
            }
        ).execute()
        if not response.data:
            raise RuntimeError("Не удалось создать объявление.")
        await update.effective_message.reply_text("Объявление опубликовано.")

    context.user_data.pop("admin_draft", None)


async def post_init(application: Application) -> None:
    await application.bot.delete_webhook(drop_pending_updates=True)
    logger.info("Bot started in polling mode")


def build_application() -> Application:
    application = Application.builder().token(required("TELEGRAM_BOT_TOKEN")).post_init(post_init).build()
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("admin", admin_command))
    application.add_handler(CallbackQueryHandler(admin_action, pattern=r"^admin:"))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, admin_text))
    return application


def main() -> None:
    application = build_application()
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
