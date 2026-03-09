import type { VercelRequest, VercelResponse } from "@vercel/node";

export async function readJson<T>(req: VercelRequest): Promise<T> {
  if (typeof req.body === "object" && req.body !== null) {
    return req.body as T;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body) as T;
  }

  return {} as T;
}

export function allowMethods(req: VercelRequest, res: VercelResponse, methods: string[]) {
  if (!methods.includes(req.method ?? "")) {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }

  return true;
}

export function handleApiError(res: VercelResponse, error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  res.status(400).json({ error: message });
}
