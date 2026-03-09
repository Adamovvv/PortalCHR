# Портал Республики

Готовый каркас для Telegram-бота и Telegram Mini App:

- фронтенд: React + Vite
- backend: Vercel Serverless Functions
- база данных: Supabase
- бот: Telegraf

## Что уже реализовано

- полноэкранный Telegram Mini App с `safe-area` сверху и снизу
- автоматическое создание профиля из данных Telegram
- светлая и темная тема
- главный экран: логотип, поиск, сообщение администрации, актуальные новости
- нижний liquid-glass бар: Главная, Объявления, Профиль
- профиль с фото и именем из Telegram
- админ-функции в мини-аппе
- команда `/admin` в боте
- публикация сообщения, новости и объявления прямо из Telegram-чата администратора

## Структура проекта

```text
src/                React mini app
api/                Vercel serverless API + webhook Telegram
supabase/schema.sql SQL схема для Supabase
.env.example        пример переменных окружения
```

## 1. Что нужно установить

Установи заранее:

1. Node.js LTS
2. аккаунт в Supabase
3. аккаунт в Vercel
4. Telegram и BotFather

Проверка локально:

```bash
node -v
npm -v
```

## 2. Создание бота

1. Открой `@BotFather`
2. Выполни `/newbot`
3. Задай имя и username
4. Сохрани токен бота

Потом у BotFather настрой Mini App:

1. Выполни `/mybots`
2. Выбери бота
3. `Bot Settings`
4. `Menu Button`
5. Укажи URL твоего Vercel-проекта, например `https://your-project.vercel.app`

После деплоя дополнительно установи webhook:

```bash
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://your-project.vercel.app/api/telegram
```

Открой эту ссылку в браузере после деплоя. Telegram должен вернуть `{"ok":true,...}`.

## 3. Настройка Supabase

1. Создай новый проект в Supabase
2. Открой `SQL Editor`
3. Вставь содержимое файла `supabase/schema.sql`
4. Выполни SQL

Потом возьми:

- `Project URL`
- `service_role key`

Они находятся в `Project Settings -> API`.

## 4. Переменные окружения

Создай файл `.env` по примеру `.env.example`.

Пример:

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
- узнать свой ID можно через любого бота типа `@userinfobot`

## 5. Локальный запуск

Установи зависимости:

```bash
npm install
```

Запусти фронтенд:

```bash
npm run dev
```

Важно: полноценная авторизация Telegram Mini App работает только внутри Telegram. В обычном браузере интерфейс откроется, но профиль не подтянется.

## 6. Деплой на Vercel

### Вариант через сайт Vercel

1. Загрузи проект в GitHub
2. Зайди в Vercel
3. Нажми `Add New -> Project`
4. Импортируй репозиторий
5. Framework Vercel определит как `Vite`
6. Build command оставь `npm run build`
7. Output directory: `dist`
8. Открой `Environment Variables`
9. Добавь все переменные из `.env`
10. Нажми Deploy

### После деплоя

1. Скопируй адрес проекта, например `https://portal-respubliki.vercel.app`
2. Пропиши этот адрес в `VITE_APP_URL`
3. Сделай redeploy
4. Выполни установку webhook:

```bash
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://portal-respubliki.vercel.app/api/telegram
```

5. В BotFather укажи этот же URL как Mini App URL

## 7. Как это работает

### Мини-апп

- Telegram открывает сайт внутри WebApp
- фронтенд берет `initData`
- `api/sync-profile` проверяет подпись Telegram
- профиль сохраняется в Supabase
- `api/content` возвращает сообщение, новости и объявления

### Бот

- `/start` отправляет кнопку открытия мини-аппа
- `/admin` открывает админ-панель
- админ может публиковать:
  - информационное сообщение
  - новость
  - объявление

## 8. Основные файлы

- `src/App.tsx` - интерфейс мини-аппа
- `src/styles.css` - дизайн, темы, safe-area, liquid glass navbar
- `api/telegram.ts` - Telegram bot webhook и `/admin`
- `api/sync-profile.ts` - создание профиля из Telegram
- `api/content.ts` - выдача контента в мини-апп
- `supabase/schema.sql` - структура базы

## 9. Что можно улучшить дальше

Следующим этапом я бы добавил:

1. отдельную таблицу ролей администраторов в Supabase вместо `TELEGRAM_ADMIN_IDS`
2. загрузку изображений новостей через Supabase Storage
3. отдельную страницу новости
4. push-рассылки по подписчикам
5. полноценную CMS-админку с редактированием и удалением записей
