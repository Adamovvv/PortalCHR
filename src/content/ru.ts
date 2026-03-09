export const announcementCategoryOptions = [
  { value: "transport", label: "Транспорт" },
  { value: "electronics", label: "Электроника" },
  { value: "home", label: "Дом и сад" },
  { value: "services", label: "Услуги" },
  { value: "realty", label: "Недвижимость" },
  { value: "jobs", label: "Работа" },
  { value: "other", label: "Другое" }
] as const;

export const ru = {
  app: {
    title: "Портал Республики",
    searchPlaceholder: "Поиск по объявлениям и новостям",
    loadingTitle: "Загрузка",
    loadingText: "Подключаю Telegram и Supabase...",
    errorTitle: "Ошибка",
    openInsideTelegram: "Открой мини-апп внутри Telegram, чтобы загрузить данные профиля.",
    loadFailed: "Не удалось загрузить портал."
  },
  nav: {
    home: "Главная",
    announcements: "Объявления",
    profile: "Профиль"
  },
  home: {
    welcomeEyebrow: "Добро пожаловать",
    welcomeText: "Новости и новые публикации портала собраны в одном месте.",
    newsEyebrow: "Лента",
    newsTitle: "Актуальные новости",
    newsCountSuffix: "материалов",
    newsEmptyTitle: "Новостей нет",
    newsEmptyText: "Новая лента появится после первой публикации."
  },
  announcements: {
    eyebrow: "Объявления",
    title: "Лента объявлений",
    countSuffix: "записей",
    emptyTitle: "Объявлений пока нет",
    emptyText: "Стань первым пользователем, кто разместит объявление.",
    addButton: "Добавить объявление",
    oneFree: "Одно объявление бесплатно",
    priceLabel: "Цена",
    freeLabel: "Бесплатно"
  },
  createAnnouncement: {
    title: "Новое объявление",
    subtitle: "Одно бесплатное объявление доступно каждому пользователю.",
    nameLabel: "Название",
    namePlaceholder: "Например: iPhone 14, услуги электрика, аренда квартиры",
    categoryLabel: "Категория",
    descriptionLabel: "Описание",
    descriptionPlaceholder: "Кратко опиши объявление, состояние, условия и контакты",
    priceLabel: "Цена",
    pricePlaceholder: "Если цена не нужна, оставь пустым",
    submit: "Опубликовать",
    cancel: "Назад"
  },
  profile: {
    fallbackName: "Профиль",
    missingUsername: "username отсутствует",
    telegramId: "ID Telegram"
  },
  common: {
    telegramUserFallback: "Пользователь Telegram"
  }
} as const;