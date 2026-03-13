import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureProfile, mapProfile } from "./_lib/app.js";
import { allowMethods, handleApiError, readJson } from "./_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const { initData } = await readJson<{ initData: string }>(req);
    const profile = await ensureProfile(initData);
    res.status(200).json(mapProfile(profile));
  } catch (error) {
    handleApiError(res, error);
  }
}
