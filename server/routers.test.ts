import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  listClients: vi.fn().mockResolvedValue([
    { id: 1, name: "テストジム", industry: "personal_training", status: "active", createdAt: new Date() },
    { id: 2, name: "美容サロンA", industry: "beauty_salon", status: "trial", createdAt: new Date() },
  ]),
  getClientsForUser: vi.fn().mockResolvedValue([
    { id: 1, name: "テストジム", industry: "personal_training", status: "active", createdAt: new Date() },
  ]),
  getClientById: vi.fn().mockResolvedValue({ id: 1, name: "テストジム", industry: "personal_training", status: "active" }),
  createClient: vi.fn().mockResolvedValue(3),
  updateClient: vi.fn().mockResolvedValue(undefined),
  deleteClient: vi.fn().mockResolvedValue(undefined),
  addClientUser: vi.fn().mockResolvedValue(undefined),
  removeClientUser: vi.fn().mockResolvedValue(undefined),
  getClientUsers: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({ friendCount: 10, autoReplyCount: 5, scenarioCount: 2, messageLogCount: 100 }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getLineChannel: vi.fn().mockResolvedValue({ id: 1, clientId: 1, channelId: "123", channelSecret: "secret", channelAccessToken: "token", isActive: true }),
  upsertLineChannel: vi.fn().mockResolvedValue(1),
  listRichMenus: vi.fn().mockResolvedValue([]),
  createRichMenu: vi.fn().mockResolvedValue(1),
  updateRichMenu: vi.fn().mockResolvedValue(undefined),
  deleteRichMenu: vi.fn().mockResolvedValue(undefined),
  listAutoReplies: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, keyword: "予約", replyContent: "予約はこちら", isActive: true },
  ]),
  createAutoReply: vi.fn().mockResolvedValue(1),
  updateAutoReply: vi.fn().mockResolvedValue(undefined),
  deleteAutoReply: vi.fn().mockResolvedValue(undefined),
  getGreeting: vi.fn().mockResolvedValue({ id: 1, clientId: 1, messageContent: "ようこそ！", isActive: true }),
  upsertGreeting: vi.fn().mockResolvedValue(1),
  listStepScenarios: vi.fn().mockResolvedValue([]),
  getStepScenario: vi.fn().mockResolvedValue({ id: 1, clientId: 1, name: "テストシナリオ", isActive: true }),
  createStepScenario: vi.fn().mockResolvedValue(1),
  updateStepScenario: vi.fn().mockResolvedValue(undefined),
  deleteStepScenario: vi.fn().mockResolvedValue(undefined),
  listStepMessages: vi.fn().mockResolvedValue([]),
  createStepMessage: vi.fn().mockResolvedValue(1),
  updateStepMessage: vi.fn().mockResolvedValue(undefined),
  deleteStepMessage: vi.fn().mockResolvedValue(undefined),
  listFriends: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, lineUserId: "U123", displayName: "テスト太郎", status: "active", tags: ["VIP"], addedAt: new Date() },
  ]),
  getFriendById: vi.fn().mockResolvedValue({ id: 1, clientId: 1, lineUserId: "U123", displayName: "テスト太郎", status: "active" }),
  createFriend: vi.fn().mockResolvedValue(1),
  updateFriend: vi.fn().mockResolvedValue(undefined),
  countFriends: vi.fn().mockResolvedValue(42),
  listMessageLogs: vi.fn().mockResolvedValue([]),
  getMessageStats: vi.fn().mockResolvedValue({ total: 100, sent: 90, failed: 5, pending: 5 }),
  createMessageLog: vi.fn().mockResolvedValue(1),
  listTemplates: vi.fn().mockResolvedValue([]),
  getTemplateById: vi.fn().mockResolvedValue({ id: 1, name: "テンプレ", industry: "personal_training" }),
  createTemplate: vi.fn().mockResolvedValue(1),
  listChatbotScenarios: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, name: "商品おすすめボット", isActive: true, useAi: true, triggerKeyword: "おすすめ", createdAt: new Date() },
  ]),
  getChatbotScenario: vi.fn().mockResolvedValue({ id: 1, clientId: 1, name: "商品おすすめボット", isActive: true, useAi: true, aiSystemPrompt: "接客アシスタント" }),
  createChatbotScenario: vi.fn().mockResolvedValue(1),
  updateChatbotScenario: vi.fn().mockResolvedValue(undefined),
  deleteChatbotScenario: vi.fn().mockResolvedValue(undefined),
  getChatbotStats: vi.fn().mockResolvedValue({ totalScenarios: 3, activeScenarios: 2, totalConversations: 150 }),
  listChatbotNodes: vi.fn().mockResolvedValue([
    { id: 1, scenarioId: 1, nodeType: "message", label: "挨拶", messageContent: "こんにちは！", sortOrder: 0 },
    { id: 2, scenarioId: 1, nodeType: "choices", label: "カテゴリ選択", choices: [{ label: "A", value: "a" }], sortOrder: 1 },
  ]),
  getChatbotNode: vi.fn().mockResolvedValue({ id: 1, scenarioId: 1, nodeType: "message", label: "挨拶" }),
  createChatbotNode: vi.fn().mockResolvedValue(3),
  updateChatbotNode: vi.fn().mockResolvedValue(undefined),
  deleteChatbotNode: vi.fn().mockResolvedValue(undefined),
  bulkUpdateChatbotNodes: vi.fn().mockResolvedValue(undefined),
  listChatbotLogs: vi.fn().mockResolvedValue([]),
  createChatbotLog: vi.fn().mockResolvedValue(1),
  createInvitation: vi.fn().mockResolvedValue("inv_test_abc123"),
  listInvitations: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, email: "client@example.com", role: "editor", inviteCode: "inv_test_abc123", status: "pending", createdAt: new Date() },
  ]),
  acceptInvitation: vi.fn().mockResolvedValue({ success: true, clientId: 1, role: "editor" }),
  revokeInvitation: vi.fn().mockResolvedValue(undefined),
  getClientUserMapping: vi.fn().mockResolvedValue({ clientId: 1, userId: 2, role: "editor" }),
}));

// Mock LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "テストAI応答" } }],
  }),
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "normal-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("clients router", () => {
  it("admin can list all clients", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.clients.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("テストジム");
  });

  it("regular user gets only their clients", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.clients.list();
    expect(result).toHaveLength(1);
  });

  it("admin can create a client", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.clients.create({
      name: "新規ジム",
      industry: "personal_training",
    });
    expect(result).toEqual({ id: 3 });
  });

  it("regular user cannot create a client (FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.clients.create({ name: "テスト", industry: "other" })
    ).rejects.toThrow("管理者権限が必要です");
  });

  it("admin can update a client", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.clients.update({ id: 1, name: "更新ジム" });
    expect(result).toEqual({ success: true });
  });

  it("admin can delete a client", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.clients.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("admin can get dashboard stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.clients.dashboard({ clientId: 1 });
    expect(result).toHaveProperty("friendCount");
    expect(result.friendCount).toBe(10);
  });
});

describe("lineChannel router", () => {
  it("returns channel with masked secret", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.lineChannel.get({ clientId: 1 });
    expect(result).not.toBeNull();
    expect(result!.channelSecret).toBe("••••••••");
  });

  it("can upsert a channel", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.lineChannel.upsert({
      clientId: 1,
      channelId: "456",
      channelSecret: "newsecret",
      channelAccessToken: "newtoken",
    });
    expect(result).toEqual({ id: 1 });
  });
});

describe("autoReply router", () => {
  it("lists auto replies for a client", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.autoReply.list({ clientId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].keyword).toBe("予約");
  });

  it("creates an auto reply", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.autoReply.create({
      clientId: 1,
      keyword: "料金",
      replyContent: "料金はこちら",
    });
    expect(result).toEqual({ id: 1 });
  });

  it("deletes an auto reply", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.autoReply.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("greeting router", () => {
  it("gets greeting for a client", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.greeting.get({ clientId: 1 });
    expect(result).not.toBeNull();
    expect(result!.messageContent).toBe("ようこそ！");
  });

  it("upserts a greeting", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.greeting.upsert({
      clientId: 1,
      messageContent: "新しいあいさつ",
    });
    expect(result).toEqual({ id: 1 });
  });
});

describe("stepScenario router", () => {
  it("creates a scenario", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.stepScenario.create({
      clientId: 1,
      name: "テストシナリオ",
      triggerType: "friend_add",
    });
    expect(result).toEqual({ id: 1 });
  });

  it("updates a scenario", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.stepScenario.update({
      id: 1,
      name: "更新シナリオ",
      isActive: false,
    });
    expect(result).toEqual({ success: true });
  });
});

describe("stepMessage router", () => {
  it("creates a step message", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.stepMessage.create({
      scenarioId: 1,
      stepOrder: 1,
      messageContent: "1日後のメッセージ",
      delayDays: 1,
    });
    expect(result).toEqual({ id: 1 });
  });
});

describe("friends router", () => {
  it("lists friends for a client", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.friends.list({ clientId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe("テスト太郎");
  });

  it("counts friends", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.friends.count({ clientId: 1 });
    expect(result).toBe(42);
  });

  it("updates friend tags", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.friends.update({
      id: 1,
      tags: ["VIP", "体験済み"],
    });
    expect(result).toEqual({ success: true });
  });
});

describe("messageLogs router", () => {
  it("gets message stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.messageLogs.stats({ clientId: 1 });
    expect(result).toHaveProperty("total");
    expect(result.total).toBe(100);
  });

  it("creates a message log", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.messageLogs.create({
      clientId: 1,
      messageType: "broadcast",
      recipientCount: 50,
      messageContent: "テスト配信",
    });
    expect(result).toEqual({ id: 1 });
  });
});

describe("chatbot router", () => {
  it("lists chatbot scenarios for a client", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.listScenarios({ clientId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("商品おすすめボット");
  });

  it("creates a chatbot scenario", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.createScenario({
      clientId: 1,
      name: "新規ボット",
      useAi: true,
      aiSystemPrompt: "テストプロンプト",
    });
    expect(result).toEqual({ id: 1 });
  });

  it("updates a chatbot scenario", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.updateScenario({
      id: 1,
      name: "更新ボット",
      isActive: false,
    });
    expect(result).toEqual({ success: true });
  });

  it("deletes a chatbot scenario", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.deleteScenario({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("gets chatbot stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.stats({ clientId: 1 });
    expect(result.totalScenarios).toBe(3);
    expect(result.activeScenarios).toBe(2);
    expect(result.totalConversations).toBe(150);
  });

  it("lists chatbot nodes", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.listNodes({ scenarioId: 1 });
    expect(result).toHaveLength(2);
    expect(result[0].nodeType).toBe("message");
    expect(result[1].nodeType).toBe("choices");
  });

  it("creates a chatbot node", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.createNode({
      scenarioId: 1,
      nodeType: "choices",
      label: "質問ノード",
      messageContent: "どちらがお好みですか？",
      choices: [{ label: "A", value: "a" }, { label: "B", value: "b" }],
    });
    expect(result).toEqual({ id: 3 });
  });

  it("updates a chatbot node", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.updateNode({
      id: 1,
      label: "更新ノード",
      messageContent: "更新メッセージ",
    });
    expect(result).toEqual({ success: true });
  });

  it("deletes a chatbot node", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.deleteNode({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("bulk updates chatbot nodes", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.bulkUpdateNodes({
      nodes: [
        { id: 1, positionX: 100, positionY: 200 },
        { id: 2, positionX: 300, positionY: 400, nextNodeId: 1 },
      ],
    });
    expect(result).toEqual({ success: true });
  });

  it("lists chatbot logs", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chatbot.listLogs({ scenarioId: 1 });
    expect(result).toHaveLength(0);
  });
});

describe("auth protection", () => {
  it("unauthenticated user cannot access protected routes", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.clients.list()).rejects.toThrow();
  });

  it("auth.me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Admin");
    expect(result!.role).toBe("admin");
  });
});

describe("invitations router", () => {
  it("admin can create invitation", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.invitations.create({ clientId: 1, email: "client@test.com", role: "editor" });
    expect(result).toHaveProperty("code");
    expect(result.code).toBe("inv_test_abc123");
  });

  it("admin can list invitations", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.invitations.list({ clientId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("client@example.com");
  });

  it("user can accept invitation", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.invitations.accept({ code: "inv_test_abc123" });
    expect(result.success).toBe(true);
    expect(result.clientId).toBe(1);
  });

  it("admin can revoke invitation", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.invitations.revoke({ id: 1 })).resolves.not.toThrow();
  });
});

describe("portal router", () => {
  it("authenticated user can access portal myClient", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.portal.myClient();
    expect(result).not.toBeNull();
  });

  it("authenticated user can access portal myDashboard", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.portal.myDashboard();
    expect(result).not.toBeNull();
  });

  it("unauthenticated user cannot access portal", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.portal.myClient()).rejects.toThrow();
  });
});
