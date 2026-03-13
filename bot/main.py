# -*- coding: utf-8 -*-
import logging
import os

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
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


def get_mini_app_url(path: str = "/") -> str:
    return f"{required('VITE_APP_URL').rstrip('/')}{path}"


def get_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [[InlineKeyboardButton("Open Mini App", web_app=WebAppInfo(url=get_mini_app_url("/")))]]
    )


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return

    await update.effective_message.reply_text(
        "Token Farm Mini App is ready. Open the app and start farming.",
        reply_markup=get_keyboard(),
    )


async def post_init(application: Application) -> None:
    await application.bot.delete_webhook(drop_pending_updates=True)
    logger.info("Bot started in polling mode")


def build_application() -> Application:
    application = Application.builder().token(required("TELEGRAM_BOT_TOKEN")).post_init(post_init).build()
    application.add_handler(CommandHandler("start", start_command))
    return application


def main() -> None:
    application = build_application()
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
