import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[EmailAuth] RESEND_API_KEY not configured");
    return null;
  }
  return new Resend(key);
}

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

async function sendVerificationEmail(req: Request, email: string, token: string) {
  const resend = getResend();
  const baseUrl = getBaseUrl(req);
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  if (!resend) {
    console.log(`[EmailAuth] Verification URL (no Resend): ${verifyUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "【LINE Connect Pro】メールアドレスの確認",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">メールアドレスの確認</h2>
        <p style="color: #444; line-height: 1.6;">LINE Connect Proにご登録いただきありがとうございます。</p>
        <p style="color: #444; line-height: 1.6;">以下のボタンをクリックして、メールアドレスを確認してください。</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background: #06C755; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            メールアドレスを確認する
          </a>
        </div>
        <p style="color: #888; font-size: 12px;">このリンクは24時間有効です。心当たりがない場合は無視してください。</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(req: Request, email: string, token: string) {
  const resend = getResend();
  const baseUrl = getBaseUrl(req);
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  if (!resend) {
    console.log(`[EmailAuth] Reset URL (no Resend): ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "【LINE Connect Pro】パスワードリセット",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">パスワードリセット</h2>
        <p style="color: #444; line-height: 1.6;">パスワードリセットのリクエストを受け付けました。</p>
        <p style="color: #444; line-height: 1.6;">以下のボタンをクリックして、新しいパスワードを設定してください。</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #06C755; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            パスワードをリセットする
          </a>
        </div>
        <p style="color: #888; font-size: 12px;">このリンクは1時間有効です。心当たりがない場合は無視してください。</p>
      </div>
    `,
  });
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
      if (password.length < 6) {
        res.status(400).json({ error: "パスワードは6文字以上で設定してください" });
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

      const user = await db.getUserByOpenId(openId);
      if (user) {
        await db.updatePasswordHash(user.id, passwordHash);

        const resend = getResend();
        if (resend) {
          // Send verification email
          const token = generateToken();
          await db.createEmailToken({
            userId: user.id,
            token,
            type: "verify",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          });
          await sendVerificationEmail(req, email, token);
        } else {
          // No email service — auto-verify
          await db.setEmailVerified(user.id);
        }
      }

      // Create session
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || email.split("@")[0],
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, needsVerification: !!getResend() });
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
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });
        return;
      }

      const passwordHash = hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });
        return;
      }

      if (!user.emailVerified && getResend()) {
        res.status(403).json({ error: "メールアドレスが未確認です。登録時に送信された確認メールをご確認ください。", code: "EMAIL_NOT_VERIFIED" });
        return;
      }

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

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

  // ===== Verify Email =====
  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(400).send(verifyResultHtml("エラー", "無効なリンクです。"));
        return;
      }

      const emailToken = await db.getEmailToken(token);
      if (!emailToken || emailToken.type !== "verify") {
        res.status(400).send(verifyResultHtml("エラー", "無効なリンクです。"));
        return;
      }
      if (emailToken.usedAt) {
        res.send(verifyResultHtml("確認済み", "メールアドレスは既に確認済みです。ログインしてください。"));
        return;
      }
      if (emailToken.expiresAt < new Date()) {
        res.status(400).send(verifyResultHtml("期限切れ", "リンクの有効期限が切れています。再度登録してください。"));
        return;
      }

      await db.setEmailVerified(emailToken.userId);
      await db.markEmailTokenUsed(emailToken.id);

      res.send(verifyResultHtml("確認完了", "メールアドレスが確認されました。ログインしてご利用ください。", true));
    } catch (error) {
      console.error("[EmailAuth] Verify failed:", error);
      res.status(500).send(verifyResultHtml("エラー", "確認処理に失敗しました。"));
    }
  });

  // ===== Resend Verification Email =====
  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "メールアドレスは必須です" });
        return;
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        res.json({ success: true });
        return;
      }

      if (user.emailVerified) {
        res.json({ success: true, message: "既に確認済みです" });
        return;
      }

      const token = generateToken();
      await db.createEmailToken({
        userId: user.id,
        token,
        type: "verify",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await sendVerificationEmail(req, email, token);
      res.json({ success: true });
    } catch (error) {
      console.error("[EmailAuth] Resend verification failed:", error);
      res.status(500).json({ error: "送信に失敗しました" });
    }
  });

  // ===== Forgot Password =====
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "メールアドレスは必須です" });
        return;
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        res.json({ success: true });
        return;
      }

      const token = generateToken();
      await db.createEmailToken({
        userId: user.id,
        token,
        type: "reset",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      });

      await sendPasswordResetEmail(req, email, token);
      res.json({ success: true });
    } catch (error) {
      console.error("[EmailAuth] Forgot password failed:", error);
      res.status(500).json({ error: "送信に失敗しました" });
    }
  });

  // ===== Reset Password =====
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        res.status(400).json({ error: "トークンと新しいパスワードは必須です" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: "パスワードは6文字以上で設定してください" });
        return;
      }

      const emailToken = await db.getEmailToken(token);
      if (!emailToken || emailToken.type !== "reset") {
        res.status(400).json({ error: "無効なリンクです" });
        return;
      }
      if (emailToken.usedAt) {
        res.status(400).json({ error: "このリンクは既に使用済みです" });
        return;
      }
      if (emailToken.expiresAt < new Date()) {
        res.status(400).json({ error: "リンクの有効期限が切れています" });
        return;
      }

      const passwordHash = hashPassword(password);
      await db.updatePasswordHash(emailToken.userId, passwordHash);
      await db.markEmailTokenUsed(emailToken.id);

      res.json({ success: true });
    } catch (error) {
      console.error("[EmailAuth] Reset password failed:", error);
      res.status(500).json({ error: "パスワードのリセットに失敗しました" });
    }
  });
}

function verifyResultHtml(title: string, message: string, showLogin = false): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - LINE Connect Pro</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d0d1a; color: #e0e0e0; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  .card { background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 16px; padding: 48px; max-width: 420px; text-align: center; }
  h1 { color: #06C755; font-size: 24px; margin-bottom: 16px; }
  p { color: #aaa; line-height: 1.6; }
  .btn { display: inline-block; margin-top: 24px; background: #06C755; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; }
  .btn:hover { background: #05b34c; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    ${showLogin ? '<a href="/dashboard" class="btn">ログインする</a>' : ''}
  </div>
</body>
</html>`;
}
