export const announcementCategoryOptions = [
  { value: "transport", label: "Транспорт" },
  { value: "electronics", label: "Электроника" },
  { value: "home", label: "Дом и сад" },
  { value: "services", label: "Услуги" },
  { value: "realty", label: "Недвижимость" },
  { value: "jobs", label: "Работа" },
  { value: "other", label: "Другое" }
] as const;

export const announcementStatusLabels = {
  pending: "На модерации",
  approved: "Опубликовано",
  rejected: "Отклонено"
} as const;

export const ru = {
  app: {
    title: "Портал Республики",
    subtitle: "Единое пространство новостей, объявлений и сервиса",
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
    welcomeEyebrow: "Главная",
    welcomeText: "Единое пространство новостей, объявлений и сервиса",
    newsEyebrow: "Лента",
    newsTitle: "Актуальные новости",
    newsCountSuffix: "материалов",
    newsEmptyTitle: "Новостей нет",
    newsEmptyText: "Новая лента появится после первой публикации."
  },
  announcements: {
    eyebrow: "Объявлении",
    title: "Объявлении",
    countSuffix: "записей",
    emptyTitle: "Объявлений пока нет",
    emptyText: "Стань первым пользователем, кто разместит объявление.",
    addButton: "Добавить объявление",
    oneFree: "Одно объявление бесплатно",
    freeLabel: "Бесплатно",
    writeButton: "Написать"
  },
  createAnnouncement: {
    eyebrow: "Объявлении",
    title: "Добавить объявление",
    subtitle: "После отправки объявление уходит администратору на модерацию.",
    nameLabel: "Название",
    namePlaceholder: "Например: iPhone 14, услуги электрика, аренда квартиры",
    categoryLabel: "Категория",
    descriptionLabel: "Описание",
    descriptionPlaceholder: "Кратко опиши объявление, состояние, условия и контакты",
    priceLabel: "Цена",
    pricePlaceholder: "Если цена не нужна, оставь пустым",
    submit: "Отправить на модерацию",
    cancel: "Назад"
  },
  profile: {
    eyebrow: "Мой профиль",
    title: "Мой профиль",
    fallbackName: "Профиль",
    missingUsername: "username отсутствует",
    telegramId: "ID Telegram",
    myAnnouncements: "Мои объявления",
    myAnnouncementsEmpty: "У тебя пока нет объявлений.",
    deleteButton: "Удалить"
  },
  common: {
    telegramUserFallback: "Пользователь Telegram"
  }
} as const;