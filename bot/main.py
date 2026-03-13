# -*- coding: utf-8 -*-
import logging
import os
from urllib.parse import quote

from telegram import BotCommand, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("token_farm_bot")


def required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def optional(name: str) -> str | None:
    value = os.getenv(name, "").strip()
    return value or None


def get_mini_app_url(path: str = "/") -> str:
    return f"{required('VITE_APP_URL').rstrip('/')}{path}"


def get_startapp_link(startapp: str | None = None) -> str | None:
    bot_username = optional("TELEGRAM_BOT_USERNAME")
    short_name = optional("TELEGRAM_MINI_APP_SHORT_NAME")
    if not bot_username or not short_name:
        return None

    bot_username = bot_username.removeprefix("@")
    base = f"https://t.me/{bot_username}/{short_name}"
    if not startapp:
        return base
    return f"{base}?startapp={quote(startapp)}"


def get_share_link() -> str | None:
    bot_username = optional("TELEGRAM_BOT_USERNAME")
    if not bot_username:
        return None
    return f"https://t.me/share/url?url=https://t.me/{bot_username.removeprefix('@')}"


def get_keyboard(startapp: str | None = None) -> InlineKeyboardMarkup:
    open_url = get_startapp_link(startapp)
    open_button = (
        InlineKeyboardButton("Открыть мини-приложение", url=open_url)
        if open_url
        else InlineKeyboardButton("Открыть мини-приложение", web_app=WebAppInfo(url=get_mini_app_url("/")))
    )

    share_url = get_share_link()
    rows = [[open_button]]
    if share_url:
        rows.append([InlineKeyboardButton("Поделиться ботом", url=share_url)])
    return InlineKeyboardMarkup(rows)


def parse_start_payload(context: ContextTypes.DEFAULT_TYPE) -> str | None:
    if not context.args:
        return None
    return context.args[0].strip() or None


def build_start_text(start_payload: str | None) -> str:
    lines = [
        "Твой Token Farm готов к запуску.",
        "",
        "Что внутри:",
        "• фарм токенов каждые 6 часов",
        "• свайп-игра с токенами и бомбами",
        "• рейтинг топ-100",
        "• задания и рефералы",
    ]

    if start_payload and start_payload.startswith("ref_"):
        lines.extend([
            "",
            "Ты вошел по реферальной ссылке.",
            "Открой мини-приложение кнопкой ниже, чтобы привязать приглашение.",
        ])
    else:
        lines.extend([
            "",
            "Открой мини-приложение кнопкой ниже и начни первый фарм.",
        ])

    return "\n".join(lines)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return

    start_payload = parse_start_payload(context)
    await update.effective_message.reply_text(
        build_start_text(start_payload),
        reply_markup=get_keyboard(start_payload),
    )


async def app_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return

    await update.effective_message.reply_text(
        "Запуск мини-приложения.",
        reply_markup=get_keyboard(),
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return

    await update.effective_message.reply_text(
        "Команды:\n"
        "/start - стартовое сообщение\n"
        "/app - открыть мини-приложение\n"
        "/help - помощь\n\n"
        "Для корректных deep-link рефералок задай TELEGRAM_MINI_APP_SHORT_NAME в окружении.",
    )


async def post_init(application: Application) -> None:
    await application.bot.delete_webhook(drop_pending_updates=True)
    await application.bot.set_my_commands(
        [
            BotCommand("start", "Запустить бота"),
            BotCommand("app", "Открыть мини-приложение"),
            BotCommand("help", "Помощь"),
        ]
    )

    try:
        await application.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="Open App", web_app=WebAppInfo(url=get_mini_app_url("/")))
        )
    except Exception as error:  # noqa: BLE001
        logger.warning("Failed to set chat menu button: %s", error)

    logger.info("Bot started in polling mode")


def build_application() -> Application:
    application = Application.builder().token(required("TELEGRAM_BOT_TOKEN")).post_init(post_init).build()
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("app", app_command))
    application.add_handler(CommandHandler("help", help_command))
    return application


def main() -> None:
    application = build_application()
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
