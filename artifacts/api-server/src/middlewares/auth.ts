import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email?: string;
        emailVerified?: boolean;
      };
    }
  }
}

let supabase: SupabaseClient | undefined;

function getSupabaseClient(): SupabaseClient | undefined {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return undefined;
  supabase ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return supabase;
}

export async function supabaseAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    req.log?.error("Supabase authentication is not configured");
    res.status(503).json({ error: "Authentication service is unavailable." });
    return;
  }

  try {
    // getUser validates the access token with Supabase Auth, not just its contents.
    const { data, error } = await client.auth.getUser(header.slice(7));
    if (error) {
      if (error.status === 401 || error.status === 403 || error.status === 400) {
        req.log?.warn({ status: error.status }, "Supabase rejected an access token");
        res.status(401).json({ error: "Invalid or expired access token." });
      } else {
        req.log?.error({ status: error.status }, "Supabase authentication failed");
        res.status(503).json({ error: "Authentication service is unavailable." });
      }
      return;
    }
    if (!data.user) {
      req.log?.error("Supabase authentication returned no user");
      res.status(503).json({ error: "Authentication service is unavailable." });
      return;
    }
    req.auth = {
      userId: data.user.id,
      email: data.user.email,
      emailVerified: Boolean(data.user.email_confirmed_at),
    };
    next();
  } catch {
    req.log?.error("Supabase authentication request failed");
    res.status(503).json({ error: "Authentication service is unavailable." });
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.auth?.userId) {
    res.status(401).json({ error: "Authentication required. Please sign in." });
    return;
  }
  next();
}
