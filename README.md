# Портал Республики

Готовый каркас для Telegram Mini App и Telegram-бота:

- фронтенд: React + Vite
- backend для мини-аппа: Vercel Serverless Functions
- база данных: Supabase
- бот: Python (`python-telegram-bot`) для VPS

## Что уже реализовано

- полноэкранный Telegram Mini App с `safe-area` сверху и снизу
- автоматическое создание профиля из данных Telegram
- светлая и темная тема
- главный экран: логотип, поиск, сообщение администрации, актуальные новости
- нижний liquid-glass бар: Главная, Объявления, Профиль
- профиль с фото и именем из Telegram
- админ-функции в мини-аппе
- команда `/admin` в Python-боте
- публикация сообщения, новости и объявления прямо из Telegram-чата администратора

## Структура проекта

```text
src/                React mini app
api/                Vercel API для профиля и контента
bot/main.py         Python-бот для VPS
bot/requirements.txt Python-зависимости
supabase/schema.sql SQL схема для Supabase
.env.example        пример переменных окружения
```

## 1. Что нужно установить

Локально:

1. Node.js LTS
2. Python 3.11 или 3.12
3. аккаунт в Supabase
4. аккаунт в Vercel
5. Telegram и BotFather

Проверка:

```bash
node -v
npm -v
python --version
```

## 2. Создание бота в Telegram

1. Открой `@BotFather`
2. Выполни `/newbot`
3. Задай имя и username
4. Сохрани токен
5. В `Bot Settings -> Menu Button` укажи URL мини-аппа, например `https://your-project.vercel.app`

Важно: бот будет работать на VPS через polling. `setWebhook` для Telegram вызывать не нужно.

## 3. Настройка Supabase

1. Создай проект в Supabase
2. Открой `SQL Editor`
3. Выполни SQL из `supabase/schema.sql`
4. Скопируй `Project URL` и `service_role key`

Они находятся в `Project Settings -> API`.

## 4. Переменные окружения

Создай `.env` по примеру `.env.example`:

```env
VITE_APP_URL=https://your-project.vercel.app
TELEGRAM_BOT_TOKEN=123456:ABC
TELEGRAM_BOT_USERNAME=portal_respubliki_bot
TELEGRAM_ADMIN_IDS=123456789
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`TELEGRAM_ADMIN_IDS`:

- это Telegram ID администраторов через запятую
- именно эти пользователи смогут использовать `/admin`
- свой ID можно узнать через `@userinfobot`

## 5. Локальный запуск фронтенда

```bash
npm install
npm run dev
```

Важно: Telegram Mini App полноценно работает только внутри Telegram.

## 6. Деплой мини-аппа на Vercel

1. Импортируй репозиторий в Vercel
2. Framework: `Vite`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Добавь в `Environment Variables`:
   - `VITE_APP_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME`
   - `TELEGRAM_ADMIN_IDS`
6. Нажми `Deploy`
7. После деплоя возьми домен вида `https://portalchr.vercel.app`
8. Обнови `VITE_APP_URL` на этот реальный домен
9. Нажми `Redeploy`
10. В `BotFather` укажи этот же URL как `Menu Button`

На Vercel бот не запускается. Vercel нужен только для мини-аппа и API.

## 7. Деплой Python-бота на VPS

Ниже пример для Ubuntu 22.04/24.04.

### Подключение

```bash
ssh root@YOUR_SERVER_IP
```

### Установка пакетов

```bash
apt update && apt upgrade -y
apt install -y git python3 python3-pip python3-venv
python3 --version
```

### Клонирование проекта

```bash
git clone https://github.com/Adamovvv/PortalCHR.git
cd PortalCHR
```

### Виртуальное окружение Python

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r bot/requirements.txt
```

### Файл `.env`

```bash
nano .env
```

Вставь:

```env
VITE_APP_URL=https://your-project.vercel.app
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=...
TELEGRAM_ADMIN_IDS=123456789
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Быстрый запуск вручную

```bash
set -a
source .env
set +a
python3 bot/main.py
```

Если бот запустился без ошибок, останови `Ctrl+C` и настрой автозапуск.

### Автозапуск через systemd

Создай сервис:

```bash
nano /etc/systemd/system/portal-bot.service
```

Вставь:

```ini
[Unit]
Description=Portal Republic Telegram Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/PortalCHR
EnvironmentFile=/root/PortalCHR/.env
ExecStart=/root/PortalCHR/.venv/bin/python /root/PortalCHR/bot/main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Запусти сервис:

```bash
systemctl daemon-reload
systemctl enable portal-bot
systemctl start portal-bot
systemctl status portal-bot
```

Логи:

```bash
journalctl -u portal-bot -f
```

## 8. Как обновлять бота на VPS

```bash
ssh root@83.166.246.254
lfGYsqWXU3fsTKwP

cd ~/PortalCHR
nano /root/portal-bot/bot/main.py
git pull
source .venv/bin/activate
pip install -r bot/requirements.txt
systemctl restart portal-bot
systemctl status portal-bot
```

## 9. Как это работает

### Мини-апп

- Telegram открывает сайт внутри WebApp
- фронтенд берет `initData`
- `api/sync-profile` проверяет подпись Telegram
- профиль сохраняется в Supabase
- `api/content` возвращает сообщение, новости и объявления

### Python-бот

- `/start` отправляет кнопку открытия мини-аппа
- `/admin` открывает админ-панель
- админ может публиковать сообщение, новость и объявление прямо в чате
- бот работает на VPS через polling

## 10. Основные файлы

- `src/App.tsx` - интерфейс мини-аппа
- `src/styles.css` - дизайн, темы, safe-area, liquid glass navbar
- `api/sync-profile.ts` - создание профиля из Telegram
- `api/content.ts` - выдача контента в мини-апп
- `bot/main.py` - Python-бот для VPS
- `bot/requirements.txt` - Python-зависимости
- `supabase/schema.sql` - структура базы

