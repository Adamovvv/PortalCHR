import type { AnnouncementPriceFilter, AnnouncementSortMode } from "../types";

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

export const announcementSortOptions: Array<{ value: AnnouncementSortMode; label: string }> = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "cheap", label: "Сначала дешевле" },
  { value: "expensive", label: "Сначала дороже" }
];

export const announcementPriceFilterOptions: Array<{ value: AnnouncementPriceFilter; label: string }> = [
  { value: "all", label: "Любая цена" },
  { value: "free", label: "Только бесплатно" },
  { value: "paid", label: "Только с ценой" }
];

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
    newsEyebrow: "Лента",
    newsTitle: "Актуальные новости",
    newsCountSuffix: "материалов",
    newsEmptyTitle: "Новостей нет",
    newsEmptyText: "Новая лента появится после первой публикации."
  },
  announcements: {
    title: "Объявления",
    emptyTitle: "Объявлений пока нет",
    emptyText: "Стань первым пользователем, кто разместит объявление.",
    addButton: "Добавить объявление",
    oneFree: "Одно объявление бесплатно",
    freeLabel: "Бесплатно",
    writeButton: "Написать",
    detailsButton: "Подробнее",
    detailsTitle: "Карточка объявления",
    backButton: "Назад к объявлениям",
    galleryTitle: "Фотографии",
    categoryFilterLabel: "Категория",
    priceFilterLabel: "Цена",
    sortLabel: "Сортировка",
    allCategories: "Все категории",
    authorLabel: "Автор",
    publishedLabel: "Опубликовано",
    noImages: "Фотографии не добавлены"
  },
  createAnnouncement: {
    eyebrow: "Объявление",
    title: "Добавить объявление",
    subtitle: "После отправки объявление уходит администратору на модерацию.",
    nameLabel: "Название",
    namePlaceholder: "Например: iPhone 14, услуги электрика, аренда квартиры",
    categoryLabel: "Категория",
    descriptionLabel: "Описание",
    descriptionPlaceholder: "Кратко опиши объявление, состояние, условия и контакты",
    priceLabel: "Цена",
    pricePlaceholder: "Если цена не нужна, оставь пустым",
    imagesLabel: "Фотографии",
    imagesHint: "До 3 фотографий. Лучше вертикальные или квадратные фото.",
    removeImage: "Удалить фото",
    submit: "Отправить на модерацию",
    cancel: "Назад",
    fileLimitError: "Можно загрузить не больше 3 фотографий.",
    fileTypeError: "Поддерживаются только изображения.",
    fileReadError: "Не удалось обработать файл. Попробуй другое изображение."
  },
  profile: {
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
