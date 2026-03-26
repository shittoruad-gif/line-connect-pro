import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint, json } from "drizzle-orm/mysql-core";

// ===== Users (認証・権限) =====
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== Clients (クライアント企業) =====
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: mysqlEnum("industry", [
    "personal_training", "beauty_salon", "seitai", "pilates",
    "yoga", "dental", "clinic", "restaurant", "retail", "other"
  ]).default("other").notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  status: mysqlEnum("status", ["active", "inactive", "trial"]).default("trial").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ===== Client-User mapping (クライアントとユーザーの紐付け) =====
export const clientUsers = mysqlTable("client_users", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "editor", "viewer"]).default("editor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientUser = typeof clientUsers.$inferSelect;

// ===== LINE Channels (LINE連携設定) =====
export const lineChannels = mysqlTable("line_channels", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  channelName: varchar("channelName", { length: 255 }),
  channelId: varchar("channelId", { length: 128 }),
  channelSecret: varchar("channelSecret", { length: 255 }),
  channelAccessToken: text("channelAccessToken"),
  webhookUrl: text("webhookUrl"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LineChannel = typeof lineChannels.$inferSelect;
export type InsertLineChannel = typeof lineChannels.$inferInsert;

// ===== Rich Menus (リッチメニュー) =====
export const richMenus = mysqlTable("rich_menus", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: text("imageUrl"),
  menuSize: mysqlEnum("menuSize", ["large", "small"]).default("large").notNull(),
  areas: json("areas"), // JSON array of {x, y, width, height, action}
  isActive: boolean("isActive").default(false).notNull(),
  lineRichMenuId: varchar("lineRichMenuId", { length: 128 }), // LINE API side ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RichMenu = typeof richMenus.$inferSelect;
export type InsertRichMenu = typeof richMenus.$inferInsert;

// ===== Auto Replies (自動応答) =====
export const autoReplies = mysqlTable("auto_replies", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  matchType: mysqlEnum("matchType", ["exact", "partial"]).default("partial").notNull(),
  replyType: mysqlEnum("replyType", ["text", "image", "template"]).default("text").notNull(),
  replyContent: text("replyContent").notNull(),
  replyImageUrl: text("replyImageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutoReply = typeof autoReplies.$inferSelect;
export type InsertAutoReply = typeof autoReplies.$inferInsert;

// ===== Greeting Messages (あいさつメッセージ) =====
export const greetingMessages = mysqlTable("greeting_messages", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  messageContent: text("messageContent").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GreetingMessage = typeof greetingMessages.$inferSelect;

// ===== Step Delivery Scenarios (ステップ配信シナリオ) =====
export const stepScenarios = mysqlTable("step_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerType: mysqlEnum("triggerType", ["friend_add", "keyword", "manual"]).default("friend_add").notNull(),
  triggerKeyword: varchar("triggerKeyword", { length: 255 }),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StepScenario = typeof stepScenarios.$inferSelect;
export type InsertStepScenario = typeof stepScenarios.$inferInsert;

// ===== Step Messages (ステップ配信メッセージ) =====
export const stepMessages = mysqlTable("step_messages", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenarioId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  delayDays: int("delayDays").default(0).notNull(),
  delayHours: int("delayHours").default(0).notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "template"]).default("text").notNull(),
  messageContent: text("messageContent").notNull(),
  messageImageUrl: text("messageImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StepMessage = typeof stepMessages.$inferSelect;
export type InsertStepMessage = typeof stepMessages.$inferInsert;

// ===== Friends (友だち・顧客) =====
export const friends = mysqlTable("friends", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  lineUserId: varchar("lineUserId", { length: 128 }).notNull(),
  displayName: varchar("displayName", { length: 255 }),
  pictureUrl: text("pictureUrl"),
  statusMessage: text("statusMessage"),
  status: mysqlEnum("status", ["active", "blocked", "unfollowed"]).default("active").notNull(),
  tags: json("tags"), // JSON array of tag strings
  notes: text("notes"),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  lastInteraction: timestamp("lastInteraction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Friend = typeof friends.$inferSelect;
export type InsertFriend = typeof friends.$inferInsert;

// ===== Message Logs (配信履歴) =====
export const messageLogs = mysqlTable("message_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  messageType: mysqlEnum("messageType", ["broadcast", "auto_reply", "step", "manual"]).default("manual").notNull(),
  recipientCount: int("recipientCount").default(0).notNull(),
  messageContent: text("messageContent"),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageLog = typeof messageLogs.$inferSelect;
export type InsertMessageLog = typeof messageLogs.$inferInsert;

// ===== Industry Templates (業種別テンプレート) =====
export const industryTemplates = mysqlTable("industry_templates", {
  id: int("id").autoincrement().primaryKey(),
  industry: mysqlEnum("industry", [
    "personal_training", "beauty_salon", "seitai", "pilates",
    "yoga", "dental", "clinic", "restaurant", "retail", "other"
  ]).notNull(),
  templateType: mysqlEnum("templateType", ["auto_reply", "rich_menu", "step_scenario", "greeting"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateData: json("templateData").notNull(), // JSON with template content
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IndustryTemplate = typeof industryTemplates.$inferSelect;
export type InsertIndustryTemplate = typeof industryTemplates.$inferInsert;

// ===== Client Invitations (クライアント招待) =====
export const clientInvitations = mysqlTable("client_invitations", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["owner", "editor", "viewer"]).default("editor").notNull(),
  inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked"]).default("pending").notNull(),
  acceptedBy: int("acceptedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type ClientInvitation = typeof clientInvitations.$inferSelect;
export type InsertClientInvitation = typeof clientInvitations.$inferInsert;

// ===== Chatbot Scenarios (AIチャットボットシナリオ) =====
export const chatbotScenarios = mysqlTable("chatbot_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerKeyword: varchar("triggerKeyword", { length: 255 }),
  isActive: boolean("isActive").default(false).notNull(),
  useAi: boolean("useAi").default(false).notNull(),
  aiSystemPrompt: text("aiSystemPrompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatbotScenario = typeof chatbotScenarios.$inferSelect;
export type InsertChatbotScenario = typeof chatbotScenarios.$inferInsert;

// ===== Chatbot Nodes (チャットボットノード) =====
export const chatbotNodes = mysqlTable("chatbot_nodes", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenarioId").notNull(),
  nodeType: mysqlEnum("nodeType", ["message", "choices", "ai_response", "condition", "action"]).default("message").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  messageContent: text("messageContent"),
  choices: json("choices"), // JSON array: [{label, value, nextNodeId}]
  condition: json("condition"), // JSON: {field, operator, value, trueNodeId, falseNodeId}
  actionType: varchar("actionType", { length: 64 }), // tag, notify, redirect etc.
  actionData: json("actionData"),
  nextNodeId: int("nextNodeId"), // default next node for message/ai_response
  positionX: int("positionX").default(0).notNull(),
  positionY: int("positionY").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatbotNode = typeof chatbotNodes.$inferSelect;
export type InsertChatbotNode = typeof chatbotNodes.$inferInsert;

// ===== Chatbot Conversation Logs (チャットボット会話ログ) =====
export const chatbotLogs = mysqlTable("chatbot_logs", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenarioId").notNull(),
  clientId: int("clientId").notNull(),
  friendId: int("friendId"),
  lineUserId: varchar("lineUserId", { length: 128 }),
  nodeId: int("nodeId"),
  userMessage: text("userMessage"),
  botMessage: text("botMessage"),
  selectedChoice: varchar("selectedChoice", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ===== Zoom API設定（ユーザーごと） =====
export const zoomSettings = mysqlTable("zoom_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: varchar("accountId", { length: 256 }).notNull().default(""),
  clientId: varchar("clientId", { length: 256 }).notNull().default(""),
  clientSecret: varchar("clientSecret", { length: 512 }).notNull().default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ZoomSettings = typeof zoomSettings.$inferSelect;
export type InsertZoomSettings = typeof zoomSettings.$inferInsert;

// ===== デフォルトミーティング設定（ユーザーごと） =====
export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  defaultDuration: int("defaultDuration").notNull().default(60),
  autoPassword: boolean("autoPassword").notNull().default(true),
  defaultPassword: varchar("defaultPassword", { length: 128 }).default(""),
  titleSuffix: varchar("titleSuffix", { length: 64 }).notNull().default("様広告MTG"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = typeof appSettings.$inferInsert;

// ===== ミーティング履歴 =====
export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  clientName: varchar("clientName", { length: 256 }).notNull(),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(), // UTC ms
  duration: int("duration").notNull().default(60),
  zoomMeetingId: varchar("zoomMeetingId", { length: 64 }),
  joinUrl: text("joinUrl"),
  startUrl: text("startUrl"),
  password: varchar("password", { length: 128 }),
  screenshotUrl: text("screenshotUrl"),
  status: mysqlEnum("status", ["created", "mock", "failed"]).notNull().default("created"),
  rawExtracted: text("rawExtracted"),
  recurringId: int("recurringId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// ===== 招待文テンプレート（ユーザーごと） =====
export const invitationTemplates = mysqlTable("invitation_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull().default("デフォルト"),
  template: text("template").notNull(),
  isDefault: boolean("isDefault").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvitationTemplate = typeof invitationTemplates.$inferSelect;
export type InsertInvitationTemplate = typeof invitationTemplates.$inferInsert;

// ===== 定期ミーティンググループ =====
export const recurringMeetings = mysqlTable("recurring_meetings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  clientName: varchar("clientName", { length: 256 }).notNull(),
  recurrenceType: mysqlEnum("recurrenceType", ["weekly", "biweekly", "monthly"]).notNull().default("weekly"),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: varchar("startTime", { length: 5 }).notNull(), // "HH:MM"
  duration: int("duration").notNull().default(60),
  occurrences: int("occurrences").notNull().default(4),
  firstDate: bigint("firstDate", { mode: "number" }).notNull(),
  totalCreated: int("totalCreated").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RecurringMeeting = typeof recurringMeetings.$inferSelect;
export type InsertRecurringMeeting = typeof recurringMeetings.$inferInsert;
