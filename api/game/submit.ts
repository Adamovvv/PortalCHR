import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureProfile } from "../_lib/app.js";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, score } = await readJson<{ initData: string; score: number }>(req);
    const profile = await ensureProfile(initData);
    const normalizedScore = Math.max(0, Math.floor(score));
    const addedTokens = normalizedScore;
    const tokenBalance = profile.token_balance + addedTokens;
    const bestScore = Math.max(profile.best_game_score ?? 0, normalizedScore);
    const supabase = getSupabaseAdmin();

    const { error: resultError } = await supabase.from("game_results").insert({
      profile_telegram_id: profile.telegram_id,
      score: normalizedScore,
      reward_tokens: addedTokens
    });

    if (resultError) {
      throw new Error("Failed to save game result");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        token_balance: tokenBalance,
        best_game_score: bestScore,
        total_game_sessions: (profile.total_game_sessions ?? 0) + 1
      })
      .eq("telegram_id", profile.telegram_id);

    if (profileError) {
      throw new Error("Failed to apply game reward");
    }

    res.status(200).json({ tokenBalance, addedTokens, bestScore });
  } catch (error) {
    handleApiError(res, error);
  }
}
