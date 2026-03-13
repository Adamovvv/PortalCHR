import crypto from "node:crypto";
import { getRequiredEnv, getAdminIds } from "./config.js";

type ParsedInitData = {
  authDate: number;
  hash: string;
  queryId?: string;
  startParam?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
};

export function parseAndVerifyInitData(initData: string): ParsedInitData {
  if (!initData) {
    throw new Error("Telegram initData is required");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new Error("Telegram hash is missing");
  }

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key !== "hash") {
      pairs.push(`${key}=${value}`);
    }
  });
  pairs.sort();

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(getRequiredEnv("TELEGRAM_BOT_TOKEN"))
    .digest();

  const digest = crypto.createHmac("sha256", secret).update(pairs.join("\n")).digest("hex");

  if (digest !== hash) {
    throw new Error("Telegram initData verification failed");
  }

  const userRaw = params.get("user");
  return {
    authDate: Number(params.get("auth_date") ?? 0),
    hash,
    queryId: params.get("query_id") ?? undefined,
    startParam: params.get("start_param") ?? undefined,
    user: userRaw ? JSON.parse(userRaw) : undefined
  };
}

export function requireTelegramUser(initData: string) {
  const payload = parseAndVerifyInitData(initData);
  if (!payload.user) {
    throw new Error("Telegram user not found in initData");
  }

  return payload.user;
}

export function isAdminTelegramId(telegramId: number) {
  return getAdminIds().includes(telegramId);
}
