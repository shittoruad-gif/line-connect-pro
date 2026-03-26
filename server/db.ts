import { eq, and, like, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  clients, InsertClient, Client,
  clientUsers, ClientUser,
  lineChannels, InsertLineChannel,
  richMenus, InsertRichMenu,
  autoReplies, InsertAutoReply,
  greetingMessages,
  stepScenarios, InsertStepScenario,
  stepMessages, InsertStepMessage,
  friends, InsertFriend,
  messageLogs, InsertMessageLog,
  industryTemplates, InsertIndustryTemplate,
  clientInvitations, InsertClientInvitation,
  ZoomSettings, InsertZoomSettings, zoomSettings,
  AppSettings, InsertAppSettings, appSettings,
  Meeting, InsertMeeting, meetings,
  InvitationTemplate, InsertInvitationTemplate, invitationTemplates,
  RecurringMeeting, InsertRecurringMeeting, recurringMeetings,
  subscriptions, Subscription, InsertSubscription,
  passcodes, Passcode, InsertPasscode,
  emailTokens, EmailToken, InsertEmailToken,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== Users =====
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Clients =====
export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clients).values(data);
  return result[0].insertId;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(clients).where(eq(clients.id, id));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function listClients(opts?: { search?: string; status?: string; industry?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.search) conditions.push(like(clients.name, `%${opts.search}%`));
  if (opts?.status) conditions.push(eq(clients.status, opts.status as any));
  if (opts?.industry) conditions.push(eq(clients.industry, opts.industry as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(clients).where(where).orderBy(desc(clients.createdAt));
}

export async function getClientsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const mappings = await db.select().from(clientUsers).where(eq(clientUsers.userId, userId));
  if (mappings.length === 0) return [];
  const clientIds = mappings.map(m => m.clientId);
  const result = [];
  for (const cid of clientIds) {
    const c = await db.select().from(clients).where(eq(clients.id, cid)).limit(1);
    if (c[0]) result.push(c[0]);
  }
  return result;
}

// ===== Client Users =====
export async function addClientUser(clientId: number, userId: number, role: "owner" | "editor" | "viewer" = "editor") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(clientUsers).values({ clientId, userId, role });
}

export async function removeClientUser(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(clientUsers).where(and(eq(clientUsers.clientId, clientId), eq(clientUsers.userId, userId)));
}

export async function getClientUsers(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientUsers).where(eq(clientUsers.clientId, clientId));
}

// ===== LINE Channels =====
export async function upsertLineChannel(data: InsertLineChannel) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(lineChannels).where(eq(lineChannels.clientId, data.clientId)).limit(1);
  if (existing[0]) {
    await db.update(lineChannels).set(data).where(eq(lineChannels.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(lineChannels).values(data);
  return result[0].insertId;
}

export async function getLineChannel(clientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lineChannels).where(eq(lineChannels.clientId, clientId)).limit(1);
  return result[0];
}

// ===== Rich Menus =====
export async function createRichMenu(data: InsertRichMenu) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(richMenus).values(data);
  return result[0].insertId;
}

export async function updateRichMenu(id: number, data: Partial<InsertRichMenu>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(richMenus).set(data).where(eq(richMenus.id, id));
}

export async function deleteRichMenu(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(richMenus).where(eq(richMenus.id, id));
}

export async function listRichMenus(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(richMenus).where(eq(richMenus.clientId, clientId)).orderBy(desc(richMenus.createdAt));
}

// ===== Auto Replies =====
export async function createAutoReply(data: InsertAutoReply) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(autoReplies).values(data);
  return result[0].insertId;
}

export async function updateAutoReply(id: number, data: Partial<InsertAutoReply>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(autoReplies).set(data).where(eq(autoReplies.id, id));
}

export async function deleteAutoReply(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(autoReplies).where(eq(autoReplies.id, id));
}

export async function listAutoReplies(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autoReplies).where(eq(autoReplies.clientId, clientId)).orderBy(asc(autoReplies.priority));
}

// ===== Greeting Messages =====
export async function upsertGreeting(clientId: number, messageContent: string, isActive: boolean = true) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(greetingMessages).where(eq(greetingMessages.clientId, clientId)).limit(1);
  if (existing[0]) {
    await db.update(greetingMessages).set({ messageContent, isActive }).where(eq(greetingMessages.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(greetingMessages).values({ clientId, messageContent, isActive });
  return result[0].insertId;
}

export async function getGreeting(clientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(greetingMessages).where(eq(greetingMessages.clientId, clientId)).limit(1);
  return result[0];
}

// ===== Step Scenarios =====
export async function createStepScenario(data: InsertStepScenario) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(stepScenarios).values(data);
  return result[0].insertId;
}

export async function updateStepScenario(id: number, data: Partial<InsertStepScenario>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(stepScenarios).set(data).where(eq(stepScenarios.id, id));
}

export async function deleteStepScenario(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(stepMessages).where(eq(stepMessages.scenarioId, id));
  await db.delete(stepScenarios).where(eq(stepScenarios.id, id));
}

export async function listStepScenarios(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stepScenarios).where(eq(stepScenarios.clientId, clientId)).orderBy(desc(stepScenarios.createdAt));
}

export async function getStepScenario(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stepScenarios).where(eq(stepScenarios.id, id)).limit(1);
  return result[0];
}

// ===== Step Messages =====
export async function createStepMessage(data: InsertStepMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(stepMessages).values(data);
  return result[0].insertId;
}

export async function updateStepMessage(id: number, data: Partial<InsertStepMessage>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(stepMessages).set(data).where(eq(stepMessages.id, id));
}

export async function deleteStepMessage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(stepMessages).where(eq(stepMessages.id, id));
}

export async function listStepMessages(scenarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stepMessages).where(eq(stepMessages.scenarioId, scenarioId)).orderBy(asc(stepMessages.stepOrder));
}

// ===== Friends =====
export async function createFriend(data: InsertFriend) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(friends).values(data);
  return result[0].insertId;
}

export async function updateFriend(id: number, data: Partial<InsertFriend>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(friends).set(data).where(eq(friends.id, id));
}

export async function listFriends(clientId: number, opts?: { search?: string; status?: string; tag?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(friends.clientId, clientId)];
  if (opts?.search) conditions.push(like(friends.displayName, `%${opts.search}%`));
  if (opts?.status) conditions.push(eq(friends.status, opts.status as any));
  return db.select().from(friends).where(and(...conditions)).orderBy(desc(friends.addedAt));
}

export async function getFriendById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(friends).where(eq(friends.id, id)).limit(1);
  return result[0];
}

export async function countFriends(clientId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(friends).where(eq(friends.clientId, clientId));
  return result[0]?.count ?? 0;
}

// ===== Message Logs =====
export async function createMessageLog(data: InsertMessageLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messageLogs).values(data);
  return result[0].insertId;
}

export async function listMessageLogs(clientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messageLogs).where(eq(messageLogs.clientId, clientId)).orderBy(desc(messageLogs.createdAt)).limit(limit);
}

export async function getMessageStats(clientId: number) {
  const db = await getDb();
  if (!db) return { total: 0, sent: 0, failed: 0, pending: 0 };
  const result = await db.select({
    total: sql<number>`count(*)`,
    sent: sql<number>`sum(case when status = 'sent' then 1 else 0 end)`,
    failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
    pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
  }).from(messageLogs).where(eq(messageLogs.clientId, clientId));
  return { total: result[0]?.total ?? 0, sent: result[0]?.sent ?? 0, failed: result[0]?.failed ?? 0, pending: result[0]?.pending ?? 0 };
}

// ===== Industry Templates =====
export async function listTemplates(opts?: { industry?: string; templateType?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.industry) conditions.push(eq(industryTemplates.industry, opts.industry as any));
  if (opts?.templateType) conditions.push(eq(industryTemplates.templateType, opts.templateType as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(industryTemplates).where(where).orderBy(asc(industryTemplates.name));
}

export async function createTemplate(data: InsertIndustryTemplate) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(industryTemplates).values(data);
  return result[0].insertId;
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(industryTemplates).where(eq(industryTemplates.id, id)).limit(1);
  return result[0];
}

// ===== Dashboard Stats =====
export async function getDashboardStats(clientId: number) {
  const db = await getDb();
  if (!db) return { friendCount: 0, activeAutoReplies: 0, activeScenarios: 0, messagesSent: 0 };
  const [fc, ar, sc, ms] = await Promise.all([
    countFriends(clientId),
    db.select({ count: sql<number>`count(*)` }).from(autoReplies).where(and(eq(autoReplies.clientId, clientId), eq(autoReplies.isActive, true))),
    db.select({ count: sql<number>`count(*)` }).from(stepScenarios).where(and(eq(stepScenarios.clientId, clientId), eq(stepScenarios.isActive, true))),
    db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(and(eq(messageLogs.clientId, clientId), eq(messageLogs.status, "sent"))),
  ]);
  return {
    friendCount: fc,
    activeAutoReplies: ar[0]?.count ?? 0,
    activeScenarios: sc[0]?.count ?? 0,
    messagesSent: ms[0]?.count ?? 0,
  };
}

// ===== Chatbot Scenarios =====
import {
  chatbotScenarios, InsertChatbotScenario,
  chatbotNodes, InsertChatbotNode,
  chatbotLogs,
} from "../drizzle/schema";

export async function listChatbotScenarios(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatbotScenarios).where(eq(chatbotScenarios.clientId, clientId)).orderBy(desc(chatbotScenarios.createdAt));
}

export async function getChatbotScenario(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatbotScenarios).where(eq(chatbotScenarios.id, id)).limit(1);
  return result[0];
}

export async function createChatbotScenario(data: InsertChatbotScenario) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(chatbotScenarios).values(data);
  return result[0].insertId;
}

export async function updateChatbotScenario(id: number, data: Partial<InsertChatbotScenario>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(chatbotScenarios).set(data).where(eq(chatbotScenarios.id, id));
}

export async function deleteChatbotScenario(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(chatbotLogs).where(eq(chatbotLogs.scenarioId, id));
  await db.delete(chatbotNodes).where(eq(chatbotNodes.scenarioId, id));
  await db.delete(chatbotScenarios).where(eq(chatbotScenarios.id, id));
}

// ===== Chatbot Nodes =====
export async function listChatbotNodes(scenarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatbotNodes).where(eq(chatbotNodes.scenarioId, scenarioId)).orderBy(asc(chatbotNodes.sortOrder));
}

export async function getChatbotNode(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatbotNodes).where(eq(chatbotNodes.id, id)).limit(1);
  return result[0];
}

export async function createChatbotNode(data: InsertChatbotNode) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(chatbotNodes).values(data);
  return result[0].insertId;
}

export async function updateChatbotNode(id: number, data: Partial<InsertChatbotNode>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(chatbotNodes).set(data).where(eq(chatbotNodes.id, id));
}

export async function deleteChatbotNode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(chatbotNodes).where(eq(chatbotNodes.id, id));
}

export async function bulkUpdateChatbotNodes(nodes: { id: number; positionX: number; positionY: number; nextNodeId?: number | null }[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  for (const node of nodes) {
    await db.update(chatbotNodes).set({
      positionX: node.positionX,
      positionY: node.positionY,
      ...(node.nextNodeId !== undefined ? { nextNodeId: node.nextNodeId } : {}),
    }).where(eq(chatbotNodes.id, node.id));
  }
}

// ===== Chatbot Logs =====
export async function listChatbotLogs(scenarioId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatbotLogs).where(eq(chatbotLogs.scenarioId, scenarioId)).orderBy(desc(chatbotLogs.createdAt)).limit(limit);
}

export async function createChatbotLog(data: { scenarioId: number; clientId: number; friendId?: number; lineUserId?: string; nodeId?: number; userMessage?: string; botMessage?: string; selectedChoice?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(chatbotLogs).values(data);
  return result[0].insertId;
}

export async function getChatbotStats(clientId: number) {
  const db = await getDb();
  if (!db) return { totalScenarios: 0, activeScenarios: 0, totalConversations: 0 };
  const [sc, asc2, conv] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(chatbotScenarios).where(eq(chatbotScenarios.clientId, clientId)),
    db.select({ count: sql<number>`count(*)` }).from(chatbotScenarios).where(and(eq(chatbotScenarios.clientId, clientId), eq(chatbotScenarios.isActive, true))),
    db.select({ count: sql<number>`count(*)` }).from(chatbotLogs).where(eq(chatbotLogs.clientId, clientId)),
  ]);
  return {
    totalScenarios: sc[0]?.count ?? 0,
    activeScenarios: asc2[0]?.count ?? 0,
    totalConversations: conv[0]?.count ?? 0,
  };
}

// ===== Client Invitations =====
export async function createInvitation(clientId: number, email: string, role: "owner" | "editor" | "viewer") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const code = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await db.insert(clientInvitations).values({ clientId, email, role, inviteCode: code, expiresAt });
  return code;
}

export async function listInvitations(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientInvitations).where(eq(clientInvitations.clientId, clientId)).orderBy(desc(clientInvitations.createdAt));
}

export async function acceptInvitation(code: string, userId: number, userEmail: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.select().from(clientInvitations).where(eq(clientInvitations.inviteCode, code)).limit(1);
  const inv = result[0];
  if (!inv) throw new Error("招待コードが見つかりません");
  if (inv.status !== "pending") throw new Error("この招待は既に使用済みまたは取り消されています");
  if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) throw new Error("この招待は期限切れです");
  // Add user to client
  await db.insert(clientUsers).values({ clientId: inv.clientId, userId, role: inv.role });
  // Mark invitation as accepted
  await db.update(clientInvitations).set({ status: "accepted", acceptedBy: userId }).where(eq(clientInvitations.id, inv.id));
  return { success: true, clientId: inv.clientId, role: inv.role };
}

export async function revokeInvitation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clientInvitations).set({ status: "revoked" }).where(eq(clientInvitations.id, id));
}

export async function getClientUserMapping(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clientUsers).where(eq(clientUsers.userId, userId)).limit(1);
  return result[0] ?? null;
}

// ===== Zoom Settings =====
export async function getZoomSettings(userId: number): Promise<ZoomSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(zoomSettings).where(eq(zoomSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertZoomSettings(data: InsertZoomSettings): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getZoomSettings(data.userId);
  if (existing) {
    await db.update(zoomSettings)
      .set({ accountId: data.accountId, clientId: data.clientId, clientSecret: data.clientSecret })
      .where(eq(zoomSettings.userId, data.userId));
  } else {
    await db.insert(zoomSettings).values(data);
  }
}

// ===== App Settings =====
export async function getAppSettings(userId: number): Promise<AppSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appSettings).where(eq(appSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertAppSettings(data: InsertAppSettings): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getAppSettings(data.userId);
  if (existing) {
    await db.update(appSettings)
      .set({
        defaultDuration: data.defaultDuration,
        autoPassword: data.autoPassword,
        defaultPassword: data.defaultPassword,
        titleSuffix: data.titleSuffix,
      })
      .where(eq(appSettings.userId, data.userId));
  } else {
    await db.insert(appSettings).values(data);
  }
}

// ===== Meetings =====
export async function insertMeeting(data: InsertMeeting): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(meetings).values(data);
  return (result[0] as any).insertId as number;
}

export async function getMeetingsByUser(userId: number, limit = 50): Promise<Meeting[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetings)
    .where(eq(meetings.userId, userId))
    .orderBy(meetings.createdAt)
    .limit(limit);
}

export async function deleteMeeting(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(meetings).where(eq(meetings.id, id));
}

export async function getMeetingById(id: number, userId: number): Promise<Meeting | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(meetings)
    .where(and(eq(meetings.id, id), eq(meetings.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateMeeting(
  id: number,
  data: Partial<Pick<InsertMeeting, 'status' | 'joinUrl' | 'startUrl' | 'password' | 'zoomMeetingId'>>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(meetings).set(data).where(eq(meetings.id, id));
}

// ===== Invitation Templates =====
const DEFAULT_TEMPLATE = `「{{title}}」のご案内

{{clientName}}様

お世話になっております。
以下の日時にZoomミーティングを設定いたしました。

■ 日時：{{scheduledAt}}
■ 所要時間：{{duration}}分
■ 参加URL：{{joinUrl}}
■ パスワード：{{password}}

どうぞよろしくお願いいたします。`;

export async function getInvitationTemplates(userId: number): Promise<InvitationTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitationTemplates).where(eq(invitationTemplates.userId, userId));
}

export async function getDefaultInvitationTemplate(userId: number): Promise<InvitationTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitationTemplates)
    .where(eq(invitationTemplates.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertInvitationTemplate(data: InsertInvitationTemplate & { id?: number }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.id) {
    await db.update(invitationTemplates)
      .set({ name: data.name, template: data.template, isDefault: data.isDefault })
      .where(eq(invitationTemplates.id, data.id));
    return data.id;
  } else {
    const result = await db.insert(invitationTemplates).values({
      userId: data.userId,
      name: data.name ?? "デフォルト",
      template: data.template ?? DEFAULT_TEMPLATE,
      isDefault: data.isDefault ?? true,
    });
    return (result[0] as any).insertId as number;
  }
}

export async function deleteInvitationTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(invitationTemplates).where(eq(invitationTemplates.id, id));
}

export { DEFAULT_TEMPLATE };

// ===== Recurring Meetings =====
export async function insertRecurringMeeting(data: InsertRecurringMeeting): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recurringMeetings).values(data);
  return (result[0] as any).insertId as number;
}

export async function getRecurringMeetingsByUser(userId: number): Promise<RecurringMeeting[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recurringMeetings).where(eq(recurringMeetings.userId, userId));
}

export async function deleteRecurringMeeting(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(recurringMeetings).where(eq(recurringMeetings.id, id));
}

export async function getMeetingsByRecurringId(recurringId: number): Promise<Meeting[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetings).where(eq(meetings.recurringId, recurringId));
}

export async function getRecurringMeetingById(id: number): Promise<RecurringMeeting | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(recurringMeetings).where(eq(recurringMeetings.id, id)).limit(1);
  return result[0];
}

export async function updateRecurringMeeting(
  id: number,
  data: Partial<Pick<InsertRecurringMeeting, 'recurrenceType' | 'dayOfWeek' | 'startTime' | 'duration' | 'occurrences' | 'totalCreated'>>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(recurringMeetings).set(data).where(eq(recurringMeetings.id, id));
}

// ===== Subscriptions =====
export async function getSubscription(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return rows[0];
}

export async function upsertSubscription(data: { userId: number; plan: "free" | "paid" | "lifetime"; passcodeUsed?: string }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getSubscription(data.userId);
  if (existing) {
    await db.update(subscriptions).set({
      plan: data.plan,
      activatedAt: new Date(),
      expiresAt: data.plan === "paid" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      passcodeUsed: data.passcodeUsed ?? existing.passcodeUsed,
    }).where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      userId: data.userId,
      plan: data.plan,
      activatedAt: new Date(),
      expiresAt: data.plan === "paid" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      passcodeUsed: data.passcodeUsed ?? null,
    });
  }
}

export async function getAllSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: subscriptions.id,
    userId: subscriptions.userId,
    plan: subscriptions.plan,
    activatedAt: subscriptions.activatedAt,
    expiresAt: subscriptions.expiresAt,
    passcodeUsed: subscriptions.passcodeUsed,
    userName: users.name,
    userEmail: users.email,
  }).from(subscriptions).leftJoin(users, eq(subscriptions.userId, users.id)).orderBy(desc(subscriptions.updatedAt));
}

// ===== Passcodes =====
export async function getPasscodeByCode(code: string): Promise<Passcode | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(passcodes).where(eq(passcodes.code, code)).limit(1);
  return rows[0];
}

export async function createPasscode(data: { code: string; plan?: "lifetime" | "paid"; maxUses?: number }): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(passcodes).values({
    code: data.code,
    plan: data.plan ?? "lifetime",
    maxUses: data.maxUses ?? 1,
    currentUses: 0,
    isActive: true,
  });
  return Number(result[0].insertId);
}

export async function incrementPasscodeUsage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(passcodes).set({
    currentUses: sql`${passcodes.currentUses} + 1`,
  }).where(eq(passcodes.id, id));
}

export async function getAllPasscodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passcodes).orderBy(desc(passcodes.createdAt));
}

export async function deletePasscode(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(passcodes).where(eq(passcodes.id, id));
}

export async function togglePasscode(id: number, isActive: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(passcodes).set({ isActive }).where(eq(passcodes.id, id));
}

// ===== Analytics =====
export async function getMessageAnalytics(clientId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await db.select({
    date: sql<string>`DATE(createdAt)`,
    total: sql<number>`count(*)`,
    sent: sql<number>`sum(case when status = 'sent' then 1 else 0 end)`,
    failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
    auto_reply: sql<number>`sum(case when messageType = 'auto_reply' then 1 else 0 end)`,
    broadcast: sql<number>`sum(case when messageType = 'broadcast' then 1 else 0 end)`,
    step: sql<number>`sum(case when messageType = 'step' then 1 else 0 end)`,
    manual: sql<number>`sum(case when messageType = 'manual' then 1 else 0 end)`,
  })
    .from(messageLogs)
    .where(and(eq(messageLogs.clientId, clientId), sql`createdAt >= ${since}`))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);
  return result;
}

export async function getFriendGrowth(clientId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await db.select({
    date: sql<string>`DATE(addedAt)`,
    count: sql<number>`count(*)`,
  })
    .from(friends)
    .where(and(eq(friends.clientId, clientId), sql`addedAt >= ${since}`))
    .groupBy(sql`DATE(addedAt)`)
    .orderBy(sql`DATE(addedAt)`);
  return result;
}

export async function getMessageTypeBreakdown(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    type: messageLogs.messageType,
    count: sql<number>`count(*)`,
  })
    .from(messageLogs)
    .where(eq(messageLogs.clientId, clientId))
    .groupBy(messageLogs.messageType);
  return result;
}

export async function getFriendStatusBreakdown(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    status: friends.status,
    count: sql<number>`count(*)`,
  })
    .from(friends)
    .where(eq(friends.clientId, clientId))
    .groupBy(friends.status);
  return result;
}

// ===== Email Tokens =====
export async function createEmailToken(data: { userId: number; token: string; type: "verify" | "reset"; expiresAt: Date }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Invalidate previous tokens of same type for same user
  await db.delete(emailTokens).where(and(eq(emailTokens.userId, data.userId), eq(emailTokens.type, data.type)));
  await db.insert(emailTokens).values(data);
}

export async function getEmailToken(token: string): Promise<EmailToken | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(emailTokens).where(eq(emailTokens.token, token)).limit(1);
  return rows[0];
}

export async function markEmailTokenUsed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(emailTokens).set({ usedAt: new Date() }).where(eq(emailTokens.id, id));
}

export async function setEmailVerified(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ emailVerified: true } as any).where(eq(users.id, userId));
}

export async function updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash } as any).where(eq(users.id, userId));
}
