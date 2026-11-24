import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/auth";
import { db } from "@workspace/db";
import { usersTable, userProfilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

/**
 * POST /auth/register
 * Create a new user profile after Supabase signup
 */
router.post("/auth/register", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!req.auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { displayName, currency } = req.body || {};

    // Create user record
    const [user] = await db
      .insert(usersTable)
      .values({
        id: req.auth.userId,
        email: req.auth.email || "",
        displayName: displayName || req.auth.email?.split("@")[0],
      })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: {
          displayName: displayName || undefined,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Create user profile
    await db
      .insert(userProfilesTable)
      .values({
        id: req.auth.userId,
        currency: currency || "USD",
        onboardingComplete: false,
      })
      .onConflictDoNothing();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    req.log?.error({ err }, "Registration failed");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!req.auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.auth.userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const profile = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, req.auth.userId))
      .limit(1)
      .then((rows) => rows[0]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        profile: profile || {
          currency: "USD",
          onboardingComplete: false,
        },
      },
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to fetch user profile");
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put("/auth/profile", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!req.auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { displayName, avatarUrl, currency, onboardingComplete } = req.body || {};

    if (displayName || avatarUrl) {
      await db
        .update(usersTable)
        .set({
          displayName: displayName || undefined,
          avatarUrl: avatarUrl || undefined,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, req.auth.userId));
    }

    if (currency !== undefined || onboardingComplete !== undefined) {
      await db
        .update(userProfilesTable)
        .set({
          currency: currency || undefined,
          onboardingComplete: onboardingComplete !== undefined ? onboardingComplete : undefined,
          updatedAt: new Date(),
        })
        .where(eq(userProfilesTable.id, req.auth.userId));
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.auth.userId))
      .limit(1)
      .then((rows) => rows[0]);

    const profile = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, req.auth.userId))
      .limit(1)
      .then((rows) => rows[0]);

    res.json({
      user: {
        id: user?.id,
        email: user?.email,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
        profile,
      },
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
