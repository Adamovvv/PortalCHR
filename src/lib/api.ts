import type {
  PortalAnnouncement,
  PortalContent,
  PortalNews,
  PortalNotice,
  PortalProfile
} from "../types";

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

export async function syncProfile(initData: string): Promise<PortalProfile> {
  return request<PortalProfile>("/api/sync-profile", {
    method: "POST",
    body: JSON.stringify({ initData })
  });
}

export async function loadContent(initData: string): Promise<PortalContent> {
  return request<PortalContent>("/api/content", {
    method: "POST",
    body: JSON.stringify({ initData })
  });
}

export async function updateNotice(initData: string, title: string, body: string): Promise<PortalNotice> {
  return request<PortalNotice>("/api/admin/notice", {
    method: "POST",
    body: JSON.stringify({ initData, title, body })
  });
}

export async function createNews(
  initData: string,
  title: string,
  summary: string,
  category: string
): Promise<PortalNews> {
  return request<PortalNews>("/api/admin/news", {
    method: "POST",
    body: JSON.stringify({ initData, title, summary, category })
  });
}

export async function createAnnouncement(
  initData: string,
  title: string,
  body: string
): Promise<PortalAnnouncement> {
  return request<PortalAnnouncement>("/api/admin/announcement", {
    method: "POST",
    body: JSON.stringify({ initData, title, body })
  });
}

