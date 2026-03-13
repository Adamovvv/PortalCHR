import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureProfile, sanitizeLanguage } from "../_lib/app.js";
import { allowMethods, handleApiError, readJson } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData, language } = await readJson<{ initData: string; language: string }>(req);
    const profile = await ensureProfile(initData);
    const nextLanguage = sanitizeLanguage(language);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("profiles")
      .update({ language: nextLanguage })
      .eq("telegram_id", profile.telegram_id);

    if (error) {
      throw new Error("Failed to update language");
    }

    res.status(200).json({ language: nextLanguage });
  } catch (error) {
    handleApiError(res, error);
  }
}
