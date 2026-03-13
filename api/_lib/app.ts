import { getRequiredEnv } from "./config.js";
import { getSupabaseAdmin } from "./supabase.js";
import { parseAndVerifyInitData, requireTelegramUser } from "./telegram.js";

export const FARMING_DURATION_HOURS = 6;
export const FARMING_REWARD_TOKENS = 120;
export const REFERRAL_REWARD_TOKENS = 75;

export function sanitizeLanguage(language: string | undefined) {
  return language === "en" ? "en" : "ru";
}

export function mapProfile(row: any) {
  return {
    telegramId: row.telegram_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    photoUrl: row.photo_url,
    language: sanitizeLanguage(row.language),
    tokenBalance: row.token_balance,
    farmingStartedAt: row.farming_started_at,
    farmingEndsAt: row.farming_ends_at,
    referredBy: row.referred_by
  };
}

export function getReferralLink(telegramId: number) {
  const appUrl = getRequiredEnv("VITE_APP_URL").replace(/\/+$/, "");
  return `${appUrl}?startapp=ref_${telegramId}`;
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function parseReferralTelegramId(startParam: string | undefined, currentTelegramId: number) {
  if (!startParam?.startsWith("ref_")) {
    return null;
  }

  const telegramId = Number(startParam.slice(4));
  if (!Number.isInteger(telegramId) || telegramId <= 0 || telegramId === currentTelegramId) {
    return null;
  }

  return telegramId;
}

export async function ensureProfile(initData: string) {
  const payload = parseAndVerifyInitData(initData);
  const user = requireTelegramUser(initData);
  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error("Failed to load Telegram profile");
  }

  if (!existing) {
    const referredBy = parseReferralTelegramId(payload.startParam, user.id);
    const tokenBalance = referredBy ? REFERRAL_REWARD_TOKENS : 0;

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        telegram_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name ?? null,
        username: user.username ?? null,
        photo_url: user.photo_url ?? null,
        referred_by: referredBy,
        token_balance: tokenBalance
      })
      .select("*")
      .single();

    if (createError || !created) {
      throw new Error("Failed to create Telegram profile");
    }

    if (referredBy) {
      const { data: referrer, error: referrerError } = await supabase
        .from("profiles")
        .select("token_balance")
        .eq("telegram_id", referredBy)
        .maybeSingle();

      if (!referrerError && referrer) {
        await supabase
          .from("profiles")
          .update({ token_balance: referrer.token_balance + REFERRAL_REWARD_TOKENS })
          .eq("telegram_id", referredBy);
      }
    }

    return created;
  }

  const updates: Record<string, unknown> = {};
  if (existing.first_name !== user.first_name) updates.first_name = user.first_name;
  if ((existing.last_name ?? null) !== (user.last_name ?? null)) updates.last_name = user.last_name ?? null;
  if ((existing.username ?? null) !== (user.username ?? null)) updates.username = user.username ?? null;
  if ((existing.photo_url ?? null) !== (user.photo_url ?? null)) updates.photo_url = user.photo_url ?? null;

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("telegram_id", user.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error("Failed to update Telegram profile");
  }

  return updated;
}
