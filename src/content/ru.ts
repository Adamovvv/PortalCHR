export const ru = {
  app: {
    title: "Портал Республики",
    subtitle: "Единое пространство новостей, объявлений и сервиса",
    brand: "Мини-апп Telegram",
    searchLabel: "Поиск по новостям и объявлениям",
    searchPlaceholder: "Например: дороги, школы, медицина",
    loadingTitle: "Загрузка",
    loadingText: "Подключаю Telegram и Supabase...",
    errorTitle: "Ошибка"
  },
  nav: {
    home: "Главная",
    announcements: "Объявления",
    profile: "Профиль"
  },
  home: {
    welcomeEyebrow: "Добро пожаловать",
    welcomeText: "Здесь собраны важные сообщения администрации, актуальные новости и объявления портала.",
    noticeEyebrow: "Сообщение администрации",
    noticeTitle: "Информационное сообщение",
    noticeEmptyTitle: "Пока пусто",
    noticeEmptyText: "Администратор еще не публиковал сообщение для пользователей.",
    newsEyebrow: "Лента",
    newsTitle: "Актуальные новости",
    newsCountSuffix: "материалов",
    newsEmptyTitle: "Новостей нет",
    newsEmptyText: "Добавь первую новость через /admin или админ-блок профиля.",
    noticeUpdatedPrefix: "Обновлено"
  },
  announcements: {
    eyebrow: "Раздел",
    title: "Объявления",
    countSuffix: "записей",
    badge: "Объявление",
    emptyTitle: "Нет объявлений",
    emptyText: "Список объявлений появится после первой публикации."
  },
  profile: {
    fallbackName: "Профиль",
    missingUsername: "username отсутствует",
    telegramId: "ID Telegram",
    adminBadge: "Админ",
    defaultTitle: "Стандартный профиль",
    defaultText: "Профиль создается автоматически из данных Telegram. Админ-инструменты доступны только ID из TELEGRAM_ADMIN_IDS.",
    noticeEyebrow: "Админка",
    noticeTitle: "Сообщение для пользователей",
    noticeTitlePlaceholder: "Заголовок сообщения",
    noticeBodyPlaceholder: "Текст сообщения для пользователей портала",
    noticeSubmit: "Сохранить сообщение",
    newsEyebrow: "Админка",
    newsTitle: "Добавить новость",
    newsTitlePlaceholder: "Заголовок новости",
    newsCategoryPlaceholder: "Категория",
    newsBodyPlaceholder: "Краткое описание новости",
    newsSubmit: "Опубликовать новость",
    announcementEyebrow: "Админка",
    announcementTitle: "Добавить объявление",
    announcementTitlePlaceholder: "Заголовок объявления",
    announcementBodyPlaceholder: "Текст объявления",
    announcementSubmit: "Опубликовать объявление"
  },
  common: {
    telegramUserFallback: "Пользователь Telegram",
    noticeCategory: "Новости"
  }
} as const;