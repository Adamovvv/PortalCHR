import type { TelegramInset, TelegramUser, TelegramWebApp, ThemeMode } from "../types";

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

function setInsetVar(name: string, value?: number) {
  document.documentElement.style.setProperty(name, `${value ?? 0}px`);
}

function applyInsetGroup(prefix: "safe-area" | "content-safe-area", inset?: TelegramInset) {
  setInsetVar(`--tg-${prefix}-inset-top`, inset?.top);
  setInsetVar(`--tg-${prefix}-inset-bottom`, inset?.bottom);
  setInsetVar(`--tg-${prefix}-inset-left`, inset?.left);
  setInsetVar(`--tg-${prefix}-inset-right`, inset?.right);
}

export function syncTelegramInsets() {
  const webApp = getTelegramWebApp();
  applyInsetGroup("safe-area", webApp?.safeAreaInset);
  applyInsetGroup("content-safe-area", webApp?.contentSafeAreaInset);
}

export function setupTelegramChrome() {
  const webApp = getTelegramWebApp();

  syncTelegramInsets();
  webApp?.ready?.();
  webApp?.expand?.();
  webApp?.disableVerticalSwipes?.();

  try {
    webApp?.requestFullscreen?.();
  } catch {
    // Fullscreen depends on Telegram client support.
  }

  syncTelegramInsets();
  window.setTimeout(syncTelegramInsets, 50);
  window.setTimeout(syncTelegramInsets, 250);

  const handleInsetsChanged = () => syncTelegramInsets();
  webApp?.onEvent?.("safeAreaChanged", handleInsetsChanged);
  webApp?.onEvent?.("contentSafeAreaChanged", handleInsetsChanged);
  webApp?.onEvent?.("viewportChanged", handleInsetsChanged);
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

