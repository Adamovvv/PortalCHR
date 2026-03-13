import type { AppLanguage, MiniAppData, Profile } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function syncProfile(initData: string): Promise<Profile> {
  return request<Profile>("/api/sync-profile", {
    method: "POST",
    body: JSON.stringify({ initData })
  });
}

export async function loadAppData(initData: string): Promise<MiniAppData> {
  return request<MiniAppData>("/api/content", {
    method: "POST",
    body: JSON.stringify({ initData })
  });
}

export async function startFarming(initData: string) {
  return request<{ farmingStartedAt: string; farmingEndsAt: string }>("/api/farming/start", {
    method: "POST",
    body: JSON.stringify({ initData })
  });
}

export async function claimFarming(initData: string) {
  return request<{ tokenBalance: number; farmingStartedAt: string | null; farmingEndsAt: string | null }>("/api/farming/claim", {
    method: "POST",
    body: JSON.stringify({ initData })
  });
}

export async function claimTask(initData: string, taskId: string) {
  return request<{ tokenBalance: number; taskId: string; completedAt: string }>("/api/task/claim", {
    method: "POST",
    body: JSON.stringify({ initData, taskId })
  });
}

export async function updateLanguage(initData: string, language: AppLanguage) {
  return request<{ language: AppLanguage }>("/api/profile/language", {
    method: "POST",
    body: JSON.stringify({ initData, language })
  });
}

export async function submitGameScore(initData: string, score: number) {
  return request<{ tokenBalance: number; addedTokens: number; bestScore: number }>("/api/game/submit", {
    method: "POST",
    body: JSON.stringify({ initData, score })
  });
}
