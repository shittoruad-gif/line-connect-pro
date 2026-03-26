import { Express, Request, Response } from "express";
import crypto from "crypto";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { broadcastNotification } from "./sse";

// ===== LINE API Helper =====
async function lineApiRequest(accessToken: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`https://api.line.me/v2/bot${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[LINE API] ${method} ${path} failed:`, res.status, err);
    throw new Error(`LINE API error: ${res.status} ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// Send reply message
async function replyMessage(accessToken: string, replyToken: string, messages: LineMessage[]) {
  return lineApiRequest(accessToken, "POST", "/message/reply", { replyToken, messages });
}

// Send push message
async function pushMessage(accessToken: string, to: string, messages: LineMessage[]) {
  return lineApiRequest(accessToken, "POST", "/message/push", { to, messages });
}

// Get user profile
async function getUserProfile(accessToken: string, userId: string) {
  return lineApiRequest(accessToken, "GET", `/profile/${userId}`);
}

type LineMessage = { type: "text"; text: string } | { type: "image"; originalContentUrl: string; previewImageUrl: string };

// ===== Webhook Signature Verification =====
function verifySignature(channelSecret: string, body: string, signature: string): boolean {
  const hash = crypto.createHmac("SHA256", channelSecret).update(body).digest("base64");
  return hash === signature;
}

// ===== Auto-Reply Matching =====
async function findMatchingAutoReply(clientId: number, text: string) {
  const replies = await db.listAutoReplies(clientId);
  const activeReplies = replies.filter((r) => r.isActive);
  // Sort by priority (lower number = higher priority)
  activeReplies.sort((a, b) => a.priority - b.priority);

  for (const rule of activeReplies) {
    if (rule.matchType === "exact" && text === rule.keyword) return rule;
    if (rule.matchType === "partial" && text.includes(rule.keyword)) return rule;
  }
  return null;
}

// ===== Chatbot Matching =====
async function findMatchingChatbot(clientId: number, text: string) {
  const scenarios = await db.listChatbotScenarios(clientId);
  for (const s of scenarios) {
    if (!s.isActive) continue;
    if (s.triggerKeyword && text.includes(s.triggerKeyword)) return s;
  }
  return null;
}

// ===== Process Chatbot AI Response =====
async function processChatbotAI(scenario: { id: number; clientId: number; aiSystemPrompt: string | null }, userMessage: string, friendId?: number, lineUserId?: string): Promise<string> {
  const systemPrompt = scenario.aiSystemPrompt || "あなたは親切な接客アシスタントです。お客様の質問に丁寧に答え、最適な提案を行ってください。日本語で応答してください。";
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    const rawContent = response.choices?.[0]?.message?.content;
    const aiMessage: string = typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.filter((c): c is { type: "text"; text: string } => c.type === "text").map((c) => c.text).join("")
        : "申し訳ございません。応答を生成できませんでした。";
    // Log the conversation
    await db.createChatbotLog({
      scenarioId: scenario.id,
      clientId: scenario.clientId,
      friendId,
      lineUserId,
      userMessage,
      botMessage: aiMessage,
    });
    return aiMessage;
  } catch (error) {
    console.error("[Chatbot AI] Error:", error);
    return "申し訳ございません。現在応答できません。しばらくしてからもう一度お試しください。";
  }
}

// ===== Process Chatbot Flow Nodes =====
async function processChatbotFlow(scenario: { id: number; clientId: number }, userMessage: string, friendId?: number, lineUserId?: string): Promise<string | null> {
  const nodes = await db.listChatbotNodes(scenario.id);
  if (nodes.length === 0) return null;

  // Find the first node (sortOrder 0)
  const startNode = nodes.find((n) => n.sortOrder === 0) || nodes[0];
  if (!startNode) return null;

  if (startNode.nodeType === "message" && startNode.messageContent) {
    await db.createChatbotLog({
      scenarioId: scenario.id,
      clientId: scenario.clientId,
      friendId,
      lineUserId,
      userMessage,
      botMessage: startNode.messageContent,
    });
    return startNode.messageContent;
  }

  return null;
}

// ===== Handle Follow Event =====
async function handleFollowEvent(clientId: number, accessToken: string, lineUserId: string, replyToken: string) {
  try {
    // Get user profile from LINE
    let displayName = "Unknown";
    let pictureUrl: string | undefined;
    try {
      const profile = await getUserProfile(accessToken, lineUserId);
      displayName = profile.displayName || "Unknown";
      pictureUrl = profile.pictureUrl;
    } catch (e) {
      console.warn("[Webhook] Failed to get user profile:", e);
    }

    // Create or update friend record
    const existingFriends = await db.listFriends(clientId, {});
    const existing = existingFriends.find((f) => f.lineUserId === lineUserId);
    if (existing) {
      await db.updateFriend(existing.id, { status: "active", displayName, pictureUrl });
    } else {
      await db.createFriend({ clientId, lineUserId, displayName, pictureUrl });
    }

    broadcastNotification({
      type: "friend_added",
      clientId,
      title: "新しい友だち",
      message: `${displayName} さんが友だち追加しました`,
      timestamp: new Date().toISOString(),
      data: { lineUserId, displayName },
    });

    // Send greeting message
    const greeting = await db.getGreeting(clientId);
    if (greeting && greeting.isActive && greeting.messageContent) {
      await replyMessage(accessToken, replyToken, [{ type: "text", text: greeting.messageContent }]);
      await db.createMessageLog({
        clientId,
        messageType: "auto_reply",
        recipientCount: 1,
        messageContent: greeting.messageContent,
        status: "sent",
      });
    }

    // Trigger step scenarios with "friend_add" trigger
    const scenarios = await db.listStepScenarios(clientId);
    for (const scenario of scenarios) {
      if (scenario.isActive && scenario.triggerType === "friend_add") {
        // Schedule step messages (first step with delay 0 sends immediately)
        const messages = await db.listStepMessages(scenario.id);
        const immediateMsg = messages.find((m) => m.delayDays === 0 && m.delayHours === 0);
        if (immediateMsg && immediateMsg.messageContent) {
          await pushMessage(accessToken, lineUserId, [{ type: "text", text: immediateMsg.messageContent }]);
          await db.createMessageLog({
            clientId,
            messageType: "step",
            recipientCount: 1,
            messageContent: immediateMsg.messageContent,
            status: "sent",
          });
        }
      }
    }
  } catch (error) {
    console.error("[Webhook] Follow event error:", error);
  }
}

// ===== Handle Unfollow Event =====
async function handleUnfollowEvent(clientId: number, lineUserId: string) {
  try {
    const existingFriends = await db.listFriends(clientId, {});
    const existing = existingFriends.find((f) => f.lineUserId === lineUserId);
    if (existing) {
      await db.updateFriend(existing.id, { status: "unfollowed" });
    }
  } catch (error) {
    console.error("[Webhook] Unfollow event error:", error);
  }
}

// ===== Handle Message Event =====
async function handleMessageEvent(clientId: number, accessToken: string, lineUserId: string, replyToken: string, message: { type: string; text?: string }) {
  if (message.type !== "text" || !message.text) return;
  const text = message.text;

  try {
    // Update last interaction
    const existingFriends = await db.listFriends(clientId, {});
    const friend = existingFriends.find((f) => f.lineUserId === lineUserId);
    if (friend) {
      await db.updateFriend(friend.id, { lastInteraction: new Date() } as any);
    }

    // 1. Check auto-reply rules first
    const autoReply = await findMatchingAutoReply(clientId, text);
    if (autoReply) {
      const msgs: LineMessage[] = [];
      if (autoReply.replyType === "text") {
        msgs.push({ type: "text", text: autoReply.replyContent });
      } else if (autoReply.replyType === "image" && autoReply.replyImageUrl) {
        msgs.push({ type: "image", originalContentUrl: autoReply.replyImageUrl, previewImageUrl: autoReply.replyImageUrl });
      } else {
        msgs.push({ type: "text", text: autoReply.replyContent });
      }
      await replyMessage(accessToken, replyToken, msgs);
      await db.createMessageLog({
        clientId,
        messageType: "auto_reply",
        recipientCount: 1,
        messageContent: autoReply.replyContent,
        status: "sent",
      });
      return;
    }

    // 2. Check chatbot scenarios
    const chatbot = await findMatchingChatbot(clientId, text);
    if (chatbot) {
      let botReply: string | null = null;

      if (chatbot.useAi) {
        botReply = await processChatbotAI(chatbot, text, friend?.id, lineUserId);
      } else {
        botReply = await processChatbotFlow(chatbot, text, friend?.id, lineUserId);
      }

      if (botReply) {
        await replyMessage(accessToken, replyToken, [{ type: "text", text: botReply }]);
        await db.createMessageLog({
          clientId,
          messageType: "auto_reply",
          recipientCount: 1,
          messageContent: botReply,
          status: "sent",
        });
        return;
      }
    }

    // 3. Check keyword-triggered step scenarios
    const scenarios = await db.listStepScenarios(clientId);
    for (const scenario of scenarios) {
      if (scenario.isActive && scenario.triggerType === "keyword" && scenario.triggerKeyword && text.includes(scenario.triggerKeyword)) {
        const messages = await db.listStepMessages(scenario.id);
        const immediateMsg = messages.find((m) => m.delayDays === 0 && m.delayHours === 0);
        if (immediateMsg && immediateMsg.messageContent) {
          await replyMessage(accessToken, replyToken, [{ type: "text", text: immediateMsg.messageContent }]);
          await db.createMessageLog({
            clientId,
            messageType: "step",
            recipientCount: 1,
            messageContent: immediateMsg.messageContent,
            status: "sent",
          });
          return;
        }
      }
    }
  } catch (error) {
    console.error("[Webhook] Message event error:", error);
  }
}

// ===== Rich Menu API Operations =====
export async function uploadRichMenuToLine(clientId: number, richMenuId: number) {
  const channel = await db.getLineChannel(clientId);
  if (!channel || !channel.channelAccessToken) throw new Error("LINE channel not configured");

  const richMenus = await db.listRichMenus(clientId);
  const menu = richMenus.find((m) => m.id === richMenuId);
  if (!menu) throw new Error("Rich menu not found");

  const areas = (menu.areas as any[]) || [];
  const lineAreas = areas.map((area) => ({
    bounds: { x: area.x || 0, y: area.y || 0, width: area.width || 2500, height: area.height || 1686 },
    action: area.action || { type: "message", text: area.label || "tap" },
  }));

  const menuData = {
    size: menu.menuSize === "small" ? { width: 2500, height: 843 } : { width: 2500, height: 1686 },
    selected: true,
    name: menu.name,
    chatBarText: menu.name,
    areas: lineAreas.length > 0 ? lineAreas : [{ bounds: { x: 0, y: 0, width: 2500, height: menu.menuSize === "small" ? 843 : 1686 }, action: { type: "message", text: "メニュー" } }],
  };

  // Create rich menu on LINE
  const result = await lineApiRequest(channel.channelAccessToken, "POST", "/../richmenu", menuData);
  const lineRichMenuId = result.richMenuId;

  // Upload image if available
  if (menu.imageUrl) {
    try {
      const imageRes = await fetch(menu.imageUrl);
      const imageBuffer = await imageRes.arrayBuffer();
      const contentType = imageRes.headers.get("content-type") || "image/png";
      await fetch(`https://api-data.line.me/v2/bot/richmenu/${lineRichMenuId}/content`, {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          Authorization: `Bearer ${channel.channelAccessToken}`,
        },
        body: Buffer.from(imageBuffer),
      });
    } catch (e) {
      console.warn("[Rich Menu] Image upload failed:", e);
    }
  }

  // Update DB with LINE rich menu ID
  await db.updateRichMenu(richMenuId, { lineRichMenuId });

  // Set as default if active
  if (menu.isActive) {
    await lineApiRequest(channel.channelAccessToken, "POST", `/user/all/richmenu/${lineRichMenuId}`, {});
  }

  return lineRichMenuId;
}

export async function deleteRichMenuFromLine(clientId: number, lineRichMenuId: string) {
  const channel = await db.getLineChannel(clientId);
  if (!channel || !channel.channelAccessToken) return;
  try {
    await lineApiRequest(channel.channelAccessToken, "DELETE", `/../richmenu/${lineRichMenuId}`, undefined);
  } catch (e) {
    console.warn("[Rich Menu] Delete from LINE failed:", e);
  }
}

// ===== Register Webhook Routes =====
export function registerLineWebhookRoutes(app: Express) {
  // Webhook endpoint - needs raw body for signature verification
  app.post("/api/webhook/line/:clientId", express_raw_json(), async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.clientId, 10);
    if (isNaN(clientId)) {
      res.status(400).json({ error: "Invalid clientId" });
      return;
    }

    try {
      const channel = await db.getLineChannel(clientId);
      if (!channel || !channel.isActive) {
        res.status(404).json({ error: "Channel not found or inactive" });
        return;
      }

      // Verify webhook signature
      if (channel.channelSecret) {
        const signature = req.headers["x-line-signature"] as string;
        const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        if (!signature || !verifySignature(channel.channelSecret, rawBody, signature)) {
          res.status(401).json({ error: "Invalid signature" });
          return;
        }
      }

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const events = body.events || [];
      const accessToken = channel.channelAccessToken;
      if (!accessToken) {
        res.status(500).json({ error: "Access token not configured" });
        return;
      }

      // Process events
      for (const event of events) {
        const lineUserId = event.source?.userId;
        if (!lineUserId) continue;

        switch (event.type) {
          case "follow":
            await handleFollowEvent(clientId, accessToken, lineUserId, event.replyToken);
            break;
          case "unfollow":
            await handleUnfollowEvent(clientId, lineUserId);
            break;
          case "message":
            await handleMessageEvent(clientId, accessToken, lineUserId, event.replyToken, event.message);
            break;
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[Webhook] Error processing webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rich menu upload endpoint
  app.post("/api/line/rich-menu/upload/:clientId/:richMenuId", async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      const richMenuId = parseInt(req.params.richMenuId, 10);
      const lineRichMenuId = await uploadRichMenuToLine(clientId, richMenuId);
      res.json({ success: true, lineRichMenuId });
    } catch (error: any) {
      console.error("[Rich Menu] Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload rich menu" });
    }
  });

  // Webhook URL info endpoint (for display in settings)
  app.get("/api/webhook/line/info/:clientId", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.clientId, 10);
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const webhookUrl = `${protocol}://${host}/api/webhook/line/${clientId}`;
    res.json({ webhookUrl });
  });
}

// Helper to get raw body for signature verification
function express_raw_json() {
  return (req: Request, _res: Response, next: () => void) => {
    // Body already parsed by express.json(), just pass through
    next();
  };
}
