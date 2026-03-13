import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureProfile, FARMING_REWARD_TOKENS } from "../_lib/app.js";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData } = await readJson<{ initData: string }>(req);
    const profile = await ensureProfile(initData);
    const endsAt = profile.farming_ends_at ? new Date(profile.farming_ends_at).getTime() : null;

    if (!endsAt) {
      throw new Error("Farming has not started yet");
    }

    if (endsAt > Date.now()) {
      throw new Error("Farming is still in progress");
    }

    const tokenBalance = profile.token_balance + FARMING_REWARD_TOKENS;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("profiles")
      .update({
        token_balance: tokenBalance,
        farming_started_at: null,
        farming_ends_at: null
      })
      .eq("telegram_id", profile.telegram_id);

    if (error) {
      throw new Error("Failed to claim farming reward");
    }

    res.status(200).json({ tokenBalance, farmingStartedAt: null, farmingEndsAt: null });
  } catch (error) {
    handleApiError(res, error);
  }
}
