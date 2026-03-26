import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { createHash, randomBytes } from "crypto";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function registerEmailAuthRoutes(app: Express) {
  // ===== Register =====
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "メールアドレスとパスワードは必須です" });
        return;
      }

      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "このメールアドレスは既に登録されています" });
        return;
      }

      const openId = `email_${randomBytes(16).toString("hex")}`;
      const passwordHash = hashPassword(password);

      await db.upsertUser({
        openId,
        name: name || email.split("@")[0],
        email,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Update passwordHash directly
      const user = await db.getUserByOpenId(openId);
      if (user) {
        const dbConn = await db.getDb();
        if (dbConn) {
          const { users } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await dbConn.update(users).set({ passwordHash }).where(eq(users.id, user.id));
        }
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || email.split("@")[0],
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true });
    } catch (error) {
      console.error("[EmailAuth] Register failed:", error);
      res.status(500).json({ error: "登録に失敗しました" });
    }
  });

  // ===== Login =====
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "メールアドレスとパスワードは必須です" });
        return;
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });
        return;
      }

      const passwordHash = hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });
        return;
      }

      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true });
    } catch (error) {
      console.error("[EmailAuth] Login failed:", error);
      res.status(500).json({ error: "ログインに失敗しました" });
    }
  });
}
