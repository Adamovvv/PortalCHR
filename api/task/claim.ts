import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureProfile } from "../_lib/app.js";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, taskId } = await readJson<{ initData: string; taskId: string }>(req);
    const profile = await ensureProfile(initData);
    const supabase = getSupabaseAdmin();

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("is_active", true)
      .single();

    if (taskError || !task) {
      throw new Error("Task not found");
    }

    const { data: existingClaim, error: existingError } = await supabase
      .from("task_claims")
      .select("id")
      .eq("task_id", taskId)
      .eq("profile_telegram_id", profile.telegram_id)
      .maybeSingle();

    if (existingError) {
      throw new Error("Failed to verify task status");
    }

    if (existingClaim) {
      throw new Error("Task already completed");
    }

    const completedAt = new Date().toISOString();
    const { error: claimError } = await supabase.from("task_claims").insert({
      task_id: taskId,
      profile_telegram_id: profile.telegram_id,
      reward_tokens: task.reward_tokens,
      created_at: completedAt
    });

    if (claimError) {
      throw new Error("Failed to save task progress");
    }

    const tokenBalance = profile.token_balance + task.reward_tokens;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ token_balance: tokenBalance })
      .eq("telegram_id", profile.telegram_id);

    if (updateError) {
      throw new Error("Failed to apply task reward");
    }

    res.status(200).json({ tokenBalance, taskId, completedAt });
  } catch (error) {
    handleApiError(res, error);
  }
}
