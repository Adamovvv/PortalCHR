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

export const hubTabs = [
  { key: "announcements", label: "Объявления" },
  { key: "problems", label: "Проблемы" },
  { key: "lost-found", label: "Потеряшки" },
  { key: "answers", label: "Ответы" },
  { key: "events", label: "Афиша" }
] as const;

export const ru = {
  app: {
    title: "Портал Республики",
    subtitle: "Единое пространство новостей, объявлений и сервиса",
    searchPlaceholder: "Поиск по объявлениям, проблемам и афише",
    loadingTitle: "Загрузка",
    loadingText: "Подключаю Telegram и Supabase...",
    errorTitle: "Ошибка",
    openInsideTelegram: "Открой мини-апп внутри Telegram, чтобы загрузить данные профиля.",
    loadFailed: "Не удалось загрузить портал."
  },
  nav: {
    home: "Главная",
    profile: "Профиль"
  },
  hub: {
    tabsAria: "Разделы портала"
  },
  events: {
    title: "Афиша",
    emptyTitle: "Афиша пока пустая",
    emptyText: "События и анонсы появятся после первой публикации."
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
    galleryTitle: "Фотографии",
    categoryFilterLabel: "Категория",
    priceFilterLabel: "Цена",
    sortLabel: "Сортировка",
    allCategories: "Все категории",
    authorLabel: "Автор",
    publishedLabel: "Опубликовано",
    noImages: "Фотографии не добавлены"
  },
  problems: {
    title: "Проблемы",
    addButton: "Добавить проблему",
    emptyTitle: "Проблем пока нет",
    emptyText: "Здесь будут обращения пользователей."
  },
  lostFound: {
    title: "Потеряшки",
    addButton: "Добавить объявление",
    emptyTitle: "Потеряшек пока нет",
    emptyText: "Здесь будут объявления о найденных и потерянных вещах."
  },
  questions: {
    title: "Ответы",
    addButton: "Добавить вопрос",
    emptyTitle: "Вопросов пока нет",
    emptyText: "Спроси первым, если нужен совет или ответ.",
    detailTitle: "Вопрос",
    answersTitle: "Ответы",
    answerPlaceholder: "Напиши ответ",
    sendAnswer: "Ответить",
    emptyAnswers: "Пока никто не ответил"
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
    fileLimitError: "Можно загрузить не больше 3 фотографий.",
    fileTypeError: "Поддерживаются только изображения.",
    fileReadError: "Не удалось обработать файл. Попробуй другое изображение."
  },
  composer: {
    titleLabel: "Заголовок",
    bodyLabel: "Описание",
    submit: "Опубликовать"
  },
  createProblem: {
    eyebrow: "Проблема",
    title: "Добавить проблему",
    subtitle: "Опиши проблему коротко и по делу.",
    namePlaceholder: "Например: нет света на улице",
    bodyPlaceholder: "Что случилось, где и что важно знать"
  },
  createLostFound: {
    eyebrow: "Потеряшки",
    title: "Добавить объявление",
    subtitle: "Напиши, что потеряно или найдено, и как с тобой связаться.",
    namePlaceholder: "Например: найден паспорт или потеряна собака",
    bodyPlaceholder: "Опиши предмет, место, время и контакты"
  },
  createQuestion: {
    eyebrow: "Вопрос",
    title: "Добавить вопрос",
    subtitle: "Задай вопрос, чтобы пользователи могли ответить.",
    namePlaceholder: "Например: где оформить льготы?",
    bodyPlaceholder: "Опиши вопрос подробнее"
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
