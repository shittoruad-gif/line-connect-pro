import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { uploadRichMenuToLine, deleteRichMenuFromLine } from "./lineWebhook";
import { createZoomMeeting, generatePassword } from "./zoom";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "管理者権限が必要です" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== Clients =====
  clients: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), status: z.string().optional(), industry: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") return db.listClients(input);
        return db.getClientsForUser(ctx.user.id);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getClientById(input.id)),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        industry: z.enum(["personal_training", "beauty_salon", "seitai", "pilates", "yoga", "dental", "clinic", "restaurant", "retail", "other"]),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        status: z.enum(["active", "inactive", "trial"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createClient({ ...input, createdBy: ctx.user.id });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        industry: z.enum(["personal_training", "beauty_salon", "seitai", "pilates", "yoga", "dental", "clinic", "restaurant", "retail", "other"]).optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        status: z.enum(["active", "inactive", "trial"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateClient(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteClient(input.id);
        return { success: true };
      }),
    addUser: adminProcedure
      .input(z.object({ clientId: z.number(), userId: z.number(), role: z.enum(["owner", "editor", "viewer"]).optional() }))
      .mutation(async ({ input }) => {
        await db.addClientUser(input.clientId, input.userId, input.role ?? "editor");
        return { success: true };
      }),
    removeUser: adminProcedure
      .input(z.object({ clientId: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeClientUser(input.clientId, input.userId);
        return { success: true };
      }),
    getUsers: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.getClientUsers(input.clientId)),
    dashboard: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.getDashboardStats(input.clientId)),
  }),

  // ===== Users (admin) =====
  users: router({
    list: adminProcedure.query(async () => db.getAllUsers()),
  }),

  // ===== LINE Channels =====
  lineChannel: router({
    get: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const ch = await db.getLineChannel(input.clientId);
        if (!ch) return null;
        return { ...ch, channelSecret: ch.channelSecret ? "••••••••" : null };
      }),
    upsert: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        channelName: z.string().optional(),
        channelId: z.string().optional(),
        channelSecret: z.string().optional(),
        channelAccessToken: z.string().optional(),
        webhookUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.upsertLineChannel(input);
        return { id };
      }),
  }),

  // ===== Rich Menus =====
  richMenu: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.listRichMenus(input.clientId)),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string().min(1),
        imageUrl: z.string().optional(),
        menuSize: z.enum(["large", "small"]).optional(),
        areas: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRichMenu(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        imageUrl: z.string().optional(),
        menuSize: z.enum(["large", "small"]).optional(),
        areas: z.any().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateRichMenu(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRichMenu(input.id);
        return { success: true };
      }),
    syncToLine: protectedProcedure
      .input(z.object({ clientId: z.number(), richMenuId: z.number() }))
      .mutation(async ({ input }) => {
        const lineRichMenuId = await uploadRichMenuToLine(input.clientId, input.richMenuId);
        return { success: true, lineRichMenuId };
      }),
    deleteFromLine: protectedProcedure
      .input(z.object({ clientId: z.number(), lineRichMenuId: z.string() }))
      .mutation(async ({ input }) => {
        await deleteRichMenuFromLine(input.clientId, input.lineRichMenuId);
        return { success: true };
      }),
  }),

  // ===== Auto Replies =====
  autoReply: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.listAutoReplies(input.clientId)),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        keyword: z.string().min(1),
        matchType: z.enum(["exact", "partial"]).optional(),
        replyType: z.enum(["text", "image", "template"]).optional(),
        replyContent: z.string().min(1),
        replyImageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAutoReply(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        keyword: z.string().optional(),
        matchType: z.enum(["exact", "partial"]).optional(),
        replyType: z.enum(["text", "image", "template"]).optional(),
        replyContent: z.string().optional(),
        replyImageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAutoReply(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAutoReply(input.id);
        return { success: true };
      }),
  }),

  // ===== Greeting =====
  greeting: router({
    get: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.getGreeting(input.clientId)),
    upsert: protectedProcedure
      .input(z.object({ clientId: z.number(), messageContent: z.string().min(1), isActive: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const id = await db.upsertGreeting(input.clientId, input.messageContent, input.isActive ?? true);
        return { id };
      }),
  }),

  // ===== Step Scenarios =====
  stepScenario: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.listStepScenarios(input.clientId)),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getStepScenario(input.id)),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        triggerType: z.enum(["friend_add", "keyword", "manual"]).optional(),
        triggerKeyword: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createStepScenario(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        triggerType: z.enum(["friend_add", "keyword", "manual"]).optional(),
        triggerKeyword: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateStepScenario(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStepScenario(input.id);
        return { success: true };
      }),
  }),

  // ===== Step Messages =====
  stepMessage: router({
    list: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .query(async ({ input }) => db.listStepMessages(input.scenarioId)),
    create: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
        stepOrder: z.number(),
        delayDays: z.number().optional(),
        delayHours: z.number().optional(),
        messageType: z.enum(["text", "image", "template"]).optional(),
        messageContent: z.string().min(1),
        messageImageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createStepMessage(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        stepOrder: z.number().optional(),
        delayDays: z.number().optional(),
        delayHours: z.number().optional(),
        messageType: z.enum(["text", "image", "template"]).optional(),
        messageContent: z.string().optional(),
        messageImageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateStepMessage(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStepMessage(input.id);
        return { success: true };
      }),
  }),

  // ===== Friends =====
  friends: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number(), search: z.string().optional(), status: z.string().optional(), tag: z.string().optional() }))
      .query(async ({ input }) => {
        const { clientId, ...opts } = input;
        return db.listFriends(clientId, opts);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getFriendById(input.id)),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        lineUserId: z.string().min(1),
        displayName: z.string().optional(),
        tags: z.any().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createFriend(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        displayName: z.string().optional(),
        status: z.enum(["active", "blocked", "unfollowed"]).optional(),
        tags: z.any().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFriend(id, data);
        return { success: true };
      }),
    count: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.countFriends(input.clientId)),
  }),

  // ===== Message Logs =====
  messageLogs: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => db.listMessageLogs(input.clientId, input.limit)),
    stats: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.getMessageStats(input.clientId)),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        messageType: z.enum(["broadcast", "auto_reply", "step", "manual"]),
        recipientCount: z.number().optional(),
        messageContent: z.string().optional(),
        status: z.enum(["sent", "failed", "pending"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMessageLog(input);
        return { id };
      }),
  }),

  // ===== Analytics =====
  analytics: router({
    messageChart: protectedProcedure
      .input(z.object({ clientId: z.number(), days: z.number().optional() }))
      .query(async ({ input }) => db.getMessageAnalytics(input.clientId, input.days)),
    friendGrowth: protectedProcedure
      .input(z.object({ clientId: z.number(), days: z.number().optional() }))
      .query(async ({ input }) => db.getFriendGrowth(input.clientId, input.days)),
    messageTypeBreakdown: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.getMessageTypeBreakdown(input.clientId)),
    friendStatusBreakdown: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.getFriendStatusBreakdown(input.clientId)),
  }),

  // ===== Broadcast (一斉配信) =====
  broadcast: router({
    send: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        messageContent: z.string().min(1),
        targetTags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const channel = await db.getLineChannel(input.clientId);
        if (!channel || !channel.channelAccessToken) throw new TRPCError({ code: "BAD_REQUEST", message: "LINEチャネルが設定されていません" });

        // Get target friends
        const allFriends = await db.listFriends(input.clientId, {});
        let targets = allFriends.filter(f => f.status === "active");
        if (input.targetTags && input.targetTags.length > 0) {
          targets = targets.filter(f => {
            const tags = (f.tags as string[]) || [];
            return input.targetTags!.some(t => tags.includes(t));
          });
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const friend of targets) {
          try {
            await fetch("https://api.line.me/v2/bot/message/push", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${channel.channelAccessToken}`,
              },
              body: JSON.stringify({
                to: friend.lineUserId,
                messages: [{ type: "text", text: input.messageContent }],
              }),
            });
            sentCount++;
          } catch {
            failedCount++;
          }
        }

        await db.createMessageLog({
          clientId: input.clientId,
          messageType: "broadcast",
          recipientCount: targets.length,
          messageContent: input.messageContent,
          status: failedCount === 0 ? "sent" : failedCount === targets.length ? "failed" : "sent",
        });

        return { sent: sentCount, failed: failedCount, total: targets.length };
      }),
  }),

  // ===== Templates =====
  templates: router({
    list: protectedProcedure
      .input(z.object({ industry: z.string().optional(), templateType: z.string().optional() }).optional())
      .query(async ({ input }) => db.listTemplates(input)),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getTemplateById(input.id)),
    create: adminProcedure
      .input(z.object({
        industry: z.enum(["personal_training", "beauty_salon", "seitai", "pilates", "yoga", "dental", "clinic", "restaurant", "retail", "other"]),
        templateType: z.enum(["auto_reply", "rich_menu", "step_scenario", "greeting"]),
        name: z.string().min(1),
        description: z.string().optional(),
        templateData: z.any(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTemplate(input);
        return { id };
      }),
  }),

  // ===== Chatbot Scenarios =====
  chatbot: router({
    listScenarios: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.listChatbotScenarios(input.clientId)),
    getScenario: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getChatbotScenario(input.id)),
    createScenario: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        triggerKeyword: z.string().optional(),
        useAi: z.boolean().optional(),
        aiSystemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createChatbotScenario(input);
        return { id };
      }),
    updateScenario: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        triggerKeyword: z.string().optional(),
        isActive: z.boolean().optional(),
        useAi: z.boolean().optional(),
        aiSystemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateChatbotScenario(id, data);
        return { success: true };
      }),
    deleteScenario: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteChatbotScenario(input.id);
        return { success: true };
      }),
    stats: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.getChatbotStats(input.clientId)),

    // Nodes
    listNodes: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .query(async ({ input }) => db.listChatbotNodes(input.scenarioId)),
    getNode: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getChatbotNode(input.id)),
    createNode: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
        nodeType: z.enum(["message", "choices", "ai_response", "condition", "action"]),
        label: z.string().min(1),
        messageContent: z.string().optional(),
        choices: z.any().optional(),
        condition: z.any().optional(),
        actionType: z.string().optional(),
        actionData: z.any().optional(),
        nextNodeId: z.number().optional(),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createChatbotNode(input);
        return { id };
      }),
    updateNode: protectedProcedure
      .input(z.object({
        id: z.number(),
        nodeType: z.enum(["message", "choices", "ai_response", "condition", "action"]).optional(),
        label: z.string().optional(),
        messageContent: z.string().optional(),
        choices: z.any().optional(),
        condition: z.any().optional(),
        actionType: z.string().optional(),
        actionData: z.any().optional(),
        nextNodeId: z.number().nullable().optional(),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateChatbotNode(id, data as any);
        return { success: true };
      }),
    deleteNode: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteChatbotNode(input.id);
        return { success: true };
      }),
    bulkUpdateNodes: protectedProcedure
      .input(z.object({
        nodes: z.array(z.object({
          id: z.number(),
          positionX: z.number(),
          positionY: z.number(),
          nextNodeId: z.number().nullable().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.bulkUpdateChatbotNodes(input.nodes);
        return { success: true };
      }),

    // Logs
    listLogs: protectedProcedure
      .input(z.object({ scenarioId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => db.listChatbotLogs(input.scenarioId, input.limit)),

    // AI Chat simulation
    aiChat: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
        userMessage: z.string().min(1),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const scenario = await db.getChatbotScenario(input.scenarioId);
        const systemPrompt = input.systemPrompt || scenario?.aiSystemPrompt || "あなたは親切な接客アシスタントです。お客様の質問に丁寧に答え、最適な提案を行ってください。日本語で応答してください。";
        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
          ...(input.conversationHistory || []),
          { role: "user", content: input.userMessage },
        ];
        try {
          const response = await invokeLLM({ messages });
          const aiMessage = response.choices?.[0]?.message?.content || "申し訳ございません。応答を生成できませんでした。";
          return { message: aiMessage };
        } catch (error) {
          console.error("[AI Chat] Error:", error);
          return { message: "申し訳ございません。AI応答の生成中にエラーが発生しました。" };
        }
      }),
  }),

  // ===== Client Portal =====
  portal: router({
    myClient: protectedProcedure
      .query(async ({ ctx }) => {
        // Get the client associated with this user
        const clientList = await db.getClientsForUser(ctx.user.id);
        if (clientList.length === 0) return null;
        return clientList[0];
      }),
    myDashboard: protectedProcedure
      .query(async ({ ctx }) => {
        const clientList = await db.getClientsForUser(ctx.user.id);
        if (clientList.length === 0) return null;
        const clientId = clientList[0].id;
        return db.getDashboardStats(clientId);
      }),
    myRole: protectedProcedure
      .query(async ({ ctx }) => {
        const mapping = await db.getClientUserMapping(ctx.user.id);
        return mapping;
      }),
  }),

  // ===== Client Invitations =====
  invitations: router({
    create: adminProcedure
      .input(z.object({
        clientId: z.number(),
        email: z.string().email(),
        role: z.enum(["owner", "editor", "viewer"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const code = await db.createInvitation(input.clientId, input.email, input.role ?? "editor");
        return { code };
      }),
    list: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.listInvitations(input.clientId)),
    accept: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.acceptInvitation(input.code, ctx.user.id, ctx.user.email ?? "");
        return result;
      }),
    revoke: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.revokeInvitation(input.id);
        return { success: true };
      }),
  }),

  // ===== File Upload =====
  upload: router({
    getPresignedUrl: protectedProcedure
      .input(z.object({ fileName: z.string(), contentType: z.string() }))
      .mutation(async ({ input }) => {
        const key = `uploads/${nanoid()}/${input.fileName}`;
        return { key, uploadUrl: `/api/upload/${key}`, contentType: input.contentType };
      }),
    uploadImage: protectedProcedure
      .input(z.object({
        base64: z.string(),
        contentType: z.string().default("image/png"),
        filename: z.string().default("screenshot.png"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `screenshots/${ctx.user.id}/${nanoid(8)}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),
  }),

  // ===== Zoom Settings =====
  zoomSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getZoomSettings(ctx.user.id);
      if (!settings) return { accountId: "", clientId: "", clientSecret: "", configured: false };
      return {
        accountId: settings.accountId,
        clientId: settings.clientId,
        clientSecret: settings.clientSecret ? "••••••••" : "",
        configured: !!(settings.accountId && settings.clientId && settings.clientSecret),
      };
    }),
    save: protectedProcedure
      .input(z.object({
        accountId: z.string().min(1),
        clientId: z.string().min(1),
        clientSecret: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertZoomSettings({
          userId: ctx.user.id,
          accountId: input.accountId,
          clientId: input.clientId,
          clientSecret: input.clientSecret,
        });
        return { success: true };
      }),
  }),

  // ===== App Settings =====
  appSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getAppSettings(ctx.user.id);
      if (!settings) return {
        defaultDuration: 60,
        autoPassword: true,
        defaultPassword: "",
        titleSuffix: "様広告MTG",
      };
      return {
        defaultDuration: settings.defaultDuration,
        autoPassword: settings.autoPassword,
        defaultPassword: settings.defaultPassword ?? "",
        titleSuffix: settings.titleSuffix,
      };
    }),
    save: protectedProcedure
      .input(z.object({
        defaultDuration: z.number().int().min(15).max(480),
        autoPassword: z.boolean(),
        defaultPassword: z.string().max(128),
        titleSuffix: z.string().min(1).max(64),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertAppSettings({
          userId: ctx.user.id,
          defaultDuration: input.defaultDuration,
          autoPassword: input.autoPassword,
          defaultPassword: input.defaultPassword,
          titleSuffix: input.titleSuffix,
        });
        return { success: true };
      }),
  }),

  // ===== OCR: スクリーンショット解析 =====
  ocr: router({
    analyze: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        const settings = await db.getAppSettings(ctx.user.id);
        const titleSuffix = settings?.titleSuffix ?? "様広告MTG";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert at reading LINE group chat screenshots in Japanese.
Extract the following information from the screenshot:
1. Group name (グループ名): The name shown at the top of the LINE chat screen
2. Meeting date and time (日時): Any date/time mentioned in the messages (e.g., "3月15日 14:00", "来週月曜 15時")

Return ONLY valid JSON in this exact format:
{
  "groupName": "extracted group name or empty string",
  "dateTimeText": "extracted date/time text or empty string",
  "parsedDateTime": "ISO 8601 datetime string in Asia/Tokyo timezone, or empty string if cannot determine",
  "confidence": "high|medium|low",
  "notes": "any additional notes about the extraction"
}

For parsedDateTime, assume the current year is 2026. Convert relative dates like "来週月曜" to actual dates.
If no clear date/time is found, return empty string for parsedDateTime.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: input.imageUrl, detail: "high" },
                },
                {
                  type: "text",
                  text: "このLINEのスクリーンショットからグループ名と日時を抽出してください。",
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "line_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  groupName: { type: "string" },
                  dateTimeText: { type: "string" },
                  parsedDateTime: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  notes: { type: "string" },
                },
                required: ["groupName", "dateTimeText", "parsedDateTime", "confidence", "notes"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const parsed = typeof content === "string" ? JSON.parse(content) : content;

        const groupName = parsed.groupName ?? "";
        const title = groupName ? `${groupName}${titleSuffix}` : "";

        return {
          groupName,
          dateTimeText: parsed.dateTimeText ?? "",
          parsedDateTime: parsed.parsedDateTime ?? "",
          title,
          confidence: parsed.confidence ?? "low",
          notes: parsed.notes ?? "",
        };
      }),
  }),

  // ===== Meetings =====
  meetings: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        clientName: z.string().min(1),
        scheduledAt: z.number(),
        duration: z.number().int().min(15).max(480),
        password: z.string().optional(),
        screenshotUrl: z.string().optional(),
        rawExtracted: z.string().optional(),
        useMock: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const zoomCreds = await db.getZoomSettings(ctx.user.id);
        const appCfg = await db.getAppSettings(ctx.user.id);

        const password = input.password ?? (appCfg?.autoPassword !== false ? generatePassword() : "");

        let meetingResult: {
          id: string; joinUrl: string; startUrl: string; password: string;
        } | null = null;
        let status: "created" | "mock" | "failed" = "mock";

        const hasZoomCreds = zoomCreds?.accountId && zoomCreds?.clientId && zoomCreds?.clientSecret;

        if (!input.useMock && hasZoomCreds) {
          try {
            const startTimeISO = new Date(input.scheduledAt).toISOString();
            const result = await createZoomMeeting(
              zoomCreds.accountId,
              zoomCreds.clientId,
              zoomCreds.clientSecret,
              {
                topic: input.title,
                startTime: startTimeISO,
                duration: input.duration,
                password,
                timezone: "Asia/Tokyo",
              }
            );
            meetingResult = result;
            status = "created";
          } catch (err: any) {
            console.error("[Zoom] Failed to create meeting:", err?.response?.data ?? err.message);
            status = "failed";
          }
        }

        if (!meetingResult) {
          const mockId = `MOCK-${nanoid(8)}`;
          meetingResult = {
            id: mockId,
            joinUrl: `https://zoom.us/j/${mockId}?pwd=${password}`,
            startUrl: `https://zoom.us/s/${mockId}?zak=mock`,
            password,
          };
          if (status !== "failed") status = "mock";
        }

        const id = await db.insertMeeting({
          userId: ctx.user.id,
          title: input.title,
          clientName: input.clientName,
          scheduledAt: input.scheduledAt,
          duration: input.duration,
          zoomMeetingId: meetingResult.id,
          joinUrl: meetingResult.joinUrl,
          startUrl: meetingResult.startUrl,
          password: meetingResult.password,
          screenshotUrl: input.screenshotUrl,
          status,
          rawExtracted: input.rawExtracted,
        });

        return {
          id,
          title: input.title,
          joinUrl: meetingResult.joinUrl,
          startUrl: meetingResult.startUrl,
          password: meetingResult.password,
          scheduledAt: input.scheduledAt,
          duration: input.duration,
          status,
          zoomMeetingId: meetingResult.id,
        };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const list = await db.getMeetingsByUser(ctx.user.id, 100);
      return list.map(m => ({
        id: m.id,
        title: m.title,
        clientName: m.clientName,
        scheduledAt: m.scheduledAt,
        duration: m.duration,
        joinUrl: m.joinUrl,
        startUrl: m.startUrl,
        password: m.password,
        status: m.status,
        zoomMeetingId: m.zoomMeetingId,
        screenshotUrl: m.screenshotUrl,
        createdAt: m.createdAt,
      }));
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMeeting(input.id, ctx.user.id);
        return { success: true };
      }),

    retry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const meeting = await db.getMeetingById(input.id, ctx.user.id);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
        if (meeting.status === "created") throw new TRPCError({ code: "BAD_REQUEST", message: "既に作成済みです" });

        const zoomCreds = await db.getZoomSettings(ctx.user.id);
        if (!zoomCreds?.accountId || !zoomCreds?.clientId || !zoomCreds?.clientSecret) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Zoom APIが未設定です" });
        }

        const password = meeting.password || generatePassword();
        try {
          const result = await createZoomMeeting(
            zoomCreds.accountId, zoomCreds.clientId, zoomCreds.clientSecret,
            {
              topic: meeting.title,
              startTime: new Date(meeting.scheduledAt).toISOString(),
              duration: meeting.duration,
              password,
              timezone: "Asia/Tokyo",
            }
          );
          await db.updateMeeting(input.id, {
            status: "created",
            joinUrl: result.joinUrl,
            startUrl: result.startUrl,
            password: result.password,
            zoomMeetingId: result.id,
          });
          return {
            success: true,
            joinUrl: result.joinUrl,
            password: result.password,
            zoomMeetingId: result.id,
          };
        } catch (err: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Zoom APIエラー: " + (err?.response?.data?.message ?? err.message),
          });
        }
      }),
  }),

  // ===== Invitation Templates =====
  invitationTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const list = await db.getInvitationTemplates(ctx.user.id);
      if (list.length === 0) {
        return [{ id: 0, name: "デフォルト", template: db.DEFAULT_TEMPLATE, isDefault: true }];
      }
      return list.map(t => ({ id: t.id, name: t.name, template: t.template, isDefault: t.isDefault }));
    }),

    save: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1).max(128),
        template: z.string().min(1),
        isDefault: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.upsertInvitationTemplate({
          userId: ctx.user.id,
          id: input.id && input.id > 0 ? input.id : undefined,
          name: input.name,
          template: input.template,
          isDefault: input.isDefault,
        });
        return { success: true, id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteInvitationTemplate(input.id);
        return { success: true };
      }),

    render: protectedProcedure
      .input(z.object({
        templateId: z.number().optional(),
        title: z.string(),
        clientName: z.string(),
        scheduledAt: z.number(),
        duration: z.number(),
        joinUrl: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        let templateText = db.DEFAULT_TEMPLATE;
        if (input.templateId && input.templateId > 0) {
          const templates = await db.getInvitationTemplates(ctx.user.id);
          const found = templates.find(t => t.id === input.templateId);
          if (found) templateText = found.template;
        } else {
          const def = await db.getDefaultInvitationTemplate(ctx.user.id);
          if (def) templateText = def.template;
        }

        const scheduledStr = new Date(input.scheduledAt).toLocaleString("ja-JP", {
          timeZone: "Asia/Tokyo",
          year: "numeric", month: "long", day: "numeric",
          weekday: "short", hour: "2-digit", minute: "2-digit",
        });

        const rendered = templateText
          .replace(/{{title}}/g, input.title)
          .replace(/{{clientName}}/g, input.clientName)
          .replace(/{{scheduledAt}}/g, scheduledStr)
          .replace(/{{duration}}/g, String(input.duration))
          .replace(/{{joinUrl}}/g, input.joinUrl)
          .replace(/{{password}}/g, input.password);

        return { rendered };
      }),
  }),

  // ===== Recurring Meetings =====
  recurringMeetings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const groups = await db.getRecurringMeetingsByUser(ctx.user.id);
      return groups.map(g => ({
        id: g.id,
        title: g.title,
        clientName: g.clientName,
        recurrenceType: g.recurrenceType,
        dayOfWeek: g.dayOfWeek,
        startTime: g.startTime,
        duration: g.duration,
        occurrences: g.occurrences,
        firstDate: g.firstDate,
        totalCreated: g.totalCreated,
        createdAt: g.createdAt,
      }));
    }),

    getMeetings: protectedProcedure
      .input(z.object({ recurringId: z.number() }))
      .query(async ({ ctx, input }) => {
        const list = await db.getMeetingsByRecurringId(input.recurringId);
        return list.map(m => ({
          id: m.id,
          title: m.title,
          scheduledAt: m.scheduledAt,
          duration: m.duration,
          joinUrl: m.joinUrl,
          password: m.password,
          status: m.status,
          zoomMeetingId: m.zoomMeetingId,
        }));
      }),

    create: protectedProcedure
      .input(z.object({
        clientName: z.string().min(1),
        recurrenceType: z.enum(["weekly", "biweekly", "monthly"]),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        duration: z.number().min(15).max(480),
        occurrences: z.number().min(1).max(52),
        firstDate: z.number(),
        useMock: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const settings = await db.getAppSettings(ctx.user.id);
        const titleSuffix = settings?.titleSuffix ?? "様広告MTG";
        const title = `${input.clientName}${titleSuffix}`;

        const scheduledDates: number[] = [];
        let current = input.firstDate;
        for (let i = 0; i < input.occurrences; i++) {
          scheduledDates.push(current);
          if (input.recurrenceType === "weekly") {
            current += 7 * 24 * 60 * 60 * 1000;
          } else if (input.recurrenceType === "biweekly") {
            current += 14 * 24 * 60 * 60 * 1000;
          } else {
            const d = new Date(current);
            d.setMonth(d.getMonth() + 1);
            current = d.getTime();
          }
        }

        const recurringId = await db.insertRecurringMeeting({
          userId: ctx.user.id,
          title,
          clientName: input.clientName,
          recurrenceType: input.recurrenceType,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          duration: input.duration,
          occurrences: input.occurrences,
          firstDate: input.firstDate,
          totalCreated: 0,
        });

        const zoomCreds = await db.getZoomSettings(ctx.user.id);
        const useMock = input.useMock || !zoomCreds?.accountId;

        const createdMeetings = [];
        for (const scheduledAt of scheduledDates) {
          let password: string;
          if (settings?.autoPassword !== false) {
            password = generatePassword();
          } else {
            password = settings?.defaultPassword ?? generatePassword();
          }

          let joinUrl = "";
          let startUrl = "";
          let zoomMeetingId = "";
          let meetingStatus: "created" | "mock" | "failed" = "created";

          if (useMock) {
            const mockId = Math.floor(Math.random() * 9000000000) + 1000000000;
            joinUrl = `https://zoom.us/j/${mockId}?pwd=${nanoid(22)}`;
            startUrl = `https://zoom.us/s/${mockId}?zak=mock`;
            zoomMeetingId = String(mockId);
            meetingStatus = "mock";
          } else {
            try {
              const result = await createZoomMeeting(
                zoomCreds!.accountId,
                zoomCreds!.clientId,
                zoomCreds!.clientSecret,
                {
                  topic: title,
                  startTime: new Date(scheduledAt).toISOString(),
                  duration: input.duration,
                  password,
                }
              );
              joinUrl = result.joinUrl;
              startUrl = result.startUrl;
              zoomMeetingId = result.id;
              meetingStatus = "created";
            } catch (err) {
              meetingStatus = "failed";
            }
          }

          const meetingId = await db.insertMeeting({
            userId: ctx.user.id,
            title,
            clientName: input.clientName,
            scheduledAt,
            duration: input.duration,
            zoomMeetingId,
            joinUrl,
            startUrl,
            password,
            status: meetingStatus,
            recurringId,
          });

          createdMeetings.push({
            id: meetingId,
            title,
            scheduledAt,
            duration: input.duration,
            joinUrl,
            password,
            status: meetingStatus,
            zoomMeetingId,
          });
        }

        return {
          recurringId,
          title,
          totalCreated: createdMeetings.length,
          meetings: createdMeetings,
        };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteRecurringMeeting(input.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        recurrenceType: z.enum(["weekly", "biweekly", "monthly"]),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        duration: z.number().min(15).max(480),
        occurrences: z.number().min(1).max(52),
      }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.getRecurringMeetingById(input.id);
        if (!group || group.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.updateRecurringMeeting(input.id, {
          recurrenceType: input.recurrenceType,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          duration: input.duration,
          occurrences: input.occurrences,
        });
        return { success: true };
      }),

    addOccurrences: protectedProcedure
      .input(z.object({
        id: z.number(),
        additionalOccurrences: z.number().min(1).max(52),
        useMock: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.getRecurringMeetingById(input.id);
        if (!group || group.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const existingMeetings = await db.getMeetingsByRecurringId(input.id);
        const sorted = existingMeetings.sort((a, b) => b.scheduledAt - a.scheduledAt);
        let lastDate = sorted.length > 0 ? sorted[0].scheduledAt : group.firstDate;

        const settings = await db.getAppSettings(ctx.user.id);
        const zoomCreds = await db.getZoomSettings(ctx.user.id);
        const useMock = input.useMock || !zoomCreds?.accountId;

        const newMeetings = [];
        for (let i = 0; i < input.additionalOccurrences; i++) {
          if (group.recurrenceType === "weekly") {
            lastDate += 7 * 24 * 60 * 60 * 1000;
          } else if (group.recurrenceType === "biweekly") {
            lastDate += 14 * 24 * 60 * 60 * 1000;
          } else {
            const d = new Date(lastDate);
            d.setMonth(d.getMonth() + 1);
            lastDate = d.getTime();
          }

          const password = settings?.autoPassword !== false
            ? generatePassword()
            : (settings?.defaultPassword ?? generatePassword());

          let joinUrl = "";
          let startUrl = "";
          let zoomMeetingId = "";
          let meetingStatus: "created" | "mock" | "failed" = "created";

          if (useMock) {
            const mockId = Math.floor(Math.random() * 9000000000) + 1000000000;
            joinUrl = `https://zoom.us/j/${mockId}?pwd=${nanoid(22)}`;
            startUrl = `https://zoom.us/s/${mockId}?zak=mock`;
            zoomMeetingId = String(mockId);
            meetingStatus = "mock";
          } else {
            try {
              const result = await createZoomMeeting(
                zoomCreds!.accountId,
                zoomCreds!.clientId,
                zoomCreds!.clientSecret,
                {
                  topic: group.title,
                  startTime: new Date(lastDate).toISOString(),
                  duration: group.duration,
                  password,
                }
              );
              joinUrl = result.joinUrl;
              startUrl = result.startUrl;
              zoomMeetingId = result.id;
              meetingStatus = "created";
            } catch {
              meetingStatus = "failed";
            }
          }

          const meetingId = await db.insertMeeting({
            userId: ctx.user.id,
            title: group.title,
            clientName: group.clientName,
            scheduledAt: lastDate,
            duration: group.duration,
            zoomMeetingId,
            joinUrl,
            startUrl,
            password,
            status: meetingStatus,
            recurringId: input.id,
          });

          newMeetings.push({
            id: meetingId,
            title: group.title,
            scheduledAt: lastDate,
            duration: group.duration,
            joinUrl,
            password,
            status: meetingStatus,
            zoomMeetingId,
          });
        }

        await db.updateRecurringMeeting(input.id, {
          totalCreated: (existingMeetings.length + newMeetings.length),
          occurrences: group.occurrences + input.additionalOccurrences,
        });

        return {
          added: newMeetings.length,
          meetings: newMeetings,
        };
      }),
  }),

  // ===== Subscription & Billing =====
  subscription: router({
    /** 自分のプランを取得 */
    me: protectedProcedure.query(async ({ ctx }) => {
      const sub = await db.getSubscription(ctx.user.id);
      if (!sub) return { plan: "free" as const, active: false };
      const now = new Date();
      const active = sub.plan === "lifetime"
        || (sub.plan === "paid" && sub.expiresAt != null && sub.expiresAt > now);
      return {
        plan: sub.plan,
        active,
        expiresAt: sub.expiresAt?.toISOString() ?? null,
        passcodeUsed: sub.passcodeUsed,
      };
    }),

    /** パスコードでアクティベーション */
    activatePasscode: protectedProcedure
      .input(z.object({ code: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const pc = await db.getPasscodeByCode(input.code.trim());
        if (!pc || !pc.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "無効なパスコードです" });
        }
        if (pc.currentUses >= pc.maxUses) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "このパスコードは使用上限に達しています" });
        }
        await db.upsertSubscription({
          userId: ctx.user.id,
          plan: pc.plan as "lifetime" | "paid",
          passcodeUsed: pc.code,
        });
        await db.incrementPasscodeUsage(pc.id);
        return { plan: pc.plan, success: true };
      }),

    /** 管理者: 全サブスクリプション一覧 */
    listAll: adminProcedure.query(async () => db.getAllSubscriptions()),

    /** 管理者: ユーザーのプランを変更 */
    setUserPlan: adminProcedure
      .input(z.object({
        userId: z.number(),
        plan: z.enum(["free", "paid", "lifetime"]),
      }))
      .mutation(async ({ input }) => {
        await db.upsertSubscription({ userId: input.userId, plan: input.plan });
        return { success: true };
      }),
  }),

  // ===== Passcode Management (Admin) =====
  passcodes: router({
    list: adminProcedure.query(async () => db.getAllPasscodes()),
    create: adminProcedure
      .input(z.object({
        code: z.string().min(4).max(128),
        plan: z.enum(["lifetime", "paid"]).default("lifetime"),
        maxUses: z.number().int().min(1).max(9999).default(1),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getPasscodeByCode(input.code);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "このコードは既に存在します" });
        const id = await db.createPasscode(input);
        return { id, code: input.code };
      }),
    toggle: adminProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.togglePasscode(input.id, input.isActive);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePasscode(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
