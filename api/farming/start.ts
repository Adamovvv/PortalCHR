import type { VercelRequest, VercelResponse } from "@vercel/node";
import { addHours, ensureProfile, FARMING_DURATION_HOURS } from "../_lib/app.js";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData } = await readJson<{ initData: string }>(req);
    const profile = await ensureProfile(initData);
    const now = new Date();
    const endsAt = profile.farming_ends_at ? new Date(profile.farming_ends_at) : null;

    if (endsAt && endsAt.getTime() > now.getTime()) {
      throw new Error("Farming is already active");
    }

    const farmingStartedAt = now.toISOString();
    const farmingEndsAt = addHours(now, FARMING_DURATION_HOURS).toISOString();
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("profiles")
      .update({ farming_started_at: farmingStartedAt, farming_ends_at: farmingEndsAt })
      .eq("telegram_id", profile.telegram_id);

    if (error) {
      throw new Error("Failed to start farming");
    }

    res.status(200).json({ farmingStartedAt, farmingEndsAt });
  } catch (error) {
    handleApiError(res, error);
  }
}
