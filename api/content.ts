import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FARMING_DURATION_HOURS, FARMING_REWARD_TOKENS, REFERRAL_REWARD_TOKENS, ensureProfile, getReferralLink, mapProfile, sanitizeLanguage } from "./_lib/app.js";
import { allowMethods, handleApiError, readJson } from "./_lib/http.js";
import { getSupabaseAdmin } from "./_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData } = await readJson<{ initData: string }>(req);
    const profileRow = await ensureProfile(initData);
    const supabase = getSupabaseAdmin();
    const now = Date.now();
    const farmingEnds = profileRow.farming_ends_at ? new Date(profileRow.farming_ends_at).getTime() : null;

    const [tasksResult, claimsResult, leaderboardResult, referralsResult] = await Promise.all([
      supabase.from("tasks").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("task_claims").select("task_id, created_at").eq("profile_telegram_id", profileRow.telegram_id),
      supabase.from("profiles").select("telegram_id, first_name, username, photo_url, token_balance").order("token_balance", { ascending: false }).limit(100),
      supabase.from("profiles").select("telegram_id, first_name, username, photo_url, created_at").eq("referred_by", profileRow.telegram_id).order("created_at", { ascending: false }).limit(100)
    ]);

    if (tasksResult.error || claimsResult.error || leaderboardResult.error || referralsResult.error) {
      throw new Error("Failed to load app content");
    }

    const claimsMap = new Map((claimsResult.data ?? []).map((item) => [item.task_id, item.created_at]));
    const language = sanitizeLanguage(profileRow.language);
    const leaderboard = (leaderboardResult.data ?? []).map((item, index) => ({
      rank: index + 1,
      telegramId: item.telegram_id,
      firstName: item.first_name,
      username: item.username,
      photoUrl: item.photo_url,
      tokenBalance: item.token_balance,
      isMe: item.telegram_id === profileRow.telegram_id
    }));

    let myLeaderboardEntry: { rank: number; tokenBalance: number } | null = null;
    const mineFromTop = leaderboard.find((item) => item.telegramId === profileRow.telegram_id);
    if (mineFromTop) {
      myLeaderboardEntry = {
        rank: mineFromTop.rank,
        tokenBalance: mineFromTop.tokenBalance
      };
    } else {
      const higher = await supabase.from("profiles").select("telegram_id", { count: "exact", head: true }).gt("token_balance", profileRow.token_balance);
      if (higher.error) {
        throw new Error("Failed to calculate rank");
      }

      myLeaderboardEntry = {
        rank: (higher.count ?? 0) + 1,
        tokenBalance: profileRow.token_balance
      };
    }

    const invited = (referralsResult.data ?? []).map((item) => ({
      telegramId: item.telegram_id,
      firstName: item.first_name,
      username: item.username,
      photoUrl: item.photo_url,
      createdAt: item.created_at
    }));

    res.status(200).json({
      profile: mapProfile(profileRow),
      farming: {
        reward: FARMING_REWARD_TOKENS,
        durationHours: FARMING_DURATION_HOURS,
        startedAt: profileRow.farming_started_at,
        endsAt: profileRow.farming_ends_at,
        isActive: Boolean(farmingEnds && farmingEnds > now),
        canClaim: Boolean(farmingEnds && farmingEnds <= now)
      },
      tasks: (tasksResult.data ?? []).map((task) => ({
        id: task.id,
        slug: task.slug,
        title: language === "en" ? task.title_en : task.title_ru,
        description: language === "en" ? task.description_en : task.description_ru,
        rewardTokens: task.reward_tokens,
        actionUrl: task.action_url,
        icon: task.icon,
        completed: claimsMap.has(task.id),
        completedAt: claimsMap.get(task.id) ?? null
      })),
      leaderboard,
      myLeaderboardEntry,
      referrals: {
        link: getReferralLink(profileRow.telegram_id),
        invitedCount: invited.length,
        totalReferralTokens: invited.length * REFERRAL_REWARD_TOKENS,
        invited
      }
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
