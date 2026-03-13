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
