import type { TelegramUser, TelegramWebApp, ThemeMode } from "../types";

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function getTelegramUser(): TelegramUser | null {
  return getTelegramWebApp()?.initDataUnsafe.user ?? null;
}

export function getInitData(): string {
  return getTelegramWebApp()?.initData ?? "";
}

export function getInitialTheme(): ThemeMode {
  const tgTheme = getTelegramWebApp()?.colorScheme;
  if (tgTheme === "light" || tgTheme === "dark") {
    return tgTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setupTelegramChrome() {
  const webApp = getTelegramWebApp();

  webApp?.ready?.();
  webApp?.expand?.();
  webApp?.disableVerticalSwipes?.();

  try {
    webApp?.requestFullscreen?.();
  } catch {
    // Fullscreen depends on Telegram client support.
  }
  setupSafeAreaInsets();          // ← добавьте здесь
}

export function bindTelegramBackButton(enabled: boolean, onBack: () => void) {
  const webApp = getTelegramWebApp();
  const backButton = webApp?.BackButton;

  if (!backButton) {
    return () => {};
  }

  if (enabled) {
    backButton.show?.();
    backButton.onClick?.(onBack);
  } else {
    backButton.hide?.();
  }

  return () => {
    backButton.offClick?.(onBack);
    backButton.hide?.();
  };
}

export function openTelegramLink(url: string) {
  const webApp = getTelegramWebApp();
  webApp?.openTelegramLink?.(url);
  webApp?.openLink?.(url);
  if (!webApp?.openTelegramLink && !webApp?.openLink) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function impact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred?.(style);
}

export function notify(type: "error" | "success" | "warning") {
  getTelegramWebApp()?.HapticFeedback?.notificationOccurred?.(type);
}


// Дополнение к telegram.ts

export interface SafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function setupSafeAreaInsets() {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  const applyInsets = () => {
    // Предпочитаем contentSafeAreaInset (учитывает TG UI)
    let insets: SafeAreaInset = { top: 0, bottom: 0, left: 0, right: 0 };

    if (webApp.contentSafeAreaInset) {
      insets = webApp.contentSafeAreaInset;
    } else if (webApp.safeAreaInset) {
      insets = webApp.safeAreaInset;
    }

    // Устанавливаем CSS-переменные на :root
    document.documentElement.style.setProperty('--sa-top',    `${insets.top}px`);
    document.documentElement.style.setProperty('--sa-bottom', `${insets.bottom}px`);
    document.documentElement.style.setProperty('--sa-left',   `${insets.left}px`);
    document.documentElement.style.setProperty('--sa-right',  `${insets.right}px`);

    // Fallback на типичные значения iPhone (если TG ничего не дал)
    document.documentElement.style.setProperty('--sa-top-fallback',    insets.top    ? `${insets.top}px`    : '44px');
    document.documentElement.style.setProperty('--sa-bottom-fallback', insets.bottom ? `${insets.bottom}px` : '34px');
  };

  applyInsets();

  // Подписка на изменения (поворот экрана, fullscreen, etc.)
  if (webApp.onEvent) {
    webApp.onEvent('safe_area_changed', applyInsets);
    webApp.onEvent('content_safe_area_changed', applyInsets);
  }

  // На всякий случай — повторный вызов через 300–500 мс (TG иногда обновляет позже)
  setTimeout(applyInsets, 400);
}