import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint, json } from "drizzle-orm/mysql-core";

// ===== Users (認証・権限) =====
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 256 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== メール認証 & パスワードリセットトークン =====
export const emailTokens = mysqlTable("email_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  type: mysqlEnum("type", ["verify", "reset"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailToken = typeof emailTokens.$inferSelect;
export type InsertEmailToken = typeof emailTokens.$inferInsert;

// ===== サブスクリプション/プランステータス =====
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["free", "paid", "lifetime"]).default("free").notNull(),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"), // paid: 課金期限, lifetime: null
  passcodeUsed: varchar("passcodeUsed", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ===== パスコード（永年無料／割引コード） =====
export const passcodes = mysqlTable("passcodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 128 }).notNull().unique(),
  plan: mysqlEnum("plan", ["lifetime", "paid"]).default("lifetime").notNull(),
  maxUses: int("maxUses").default(1).notNull(),
  currentUses: int("currentUses").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Passcode = typeof passcodes.$inferSelect;
export type InsertPasscode = typeof passcodes.$inferInsert;

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
  score: int("score").default(0).notNull(), // 行動スコア
  sourceCode: varchar("sourceCode", { length: 64 }), // 流入元コード
  affiliateCode: varchar("affiliateCode", { length: 64 }), // アフィリエイトコード
  metadata: json("metadata"), // カスタムメタデータ
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

// ===== スコアリング設定 =====
export const scoreRules = mysqlTable("score_rules", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  eventType: mysqlEnum("eventType", [
    "message_received", "link_clicked", "form_submitted",
    "purchase_completed", "friend_added", "rich_menu_tapped",
    "step_completed", "keyword_matched", "manual"
  ]).notNull(),
  points: int("points").notNull().default(1),
  description: varchar("description", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScoreRule = typeof scoreRules.$inferSelect;
export type InsertScoreRule = typeof scoreRules.$inferInsert;

// ===== 友だちスコア履歴 =====
export const friendScores = mysqlTable("friend_scores", {
  id: int("id").autoincrement().primaryKey(),
  friendId: int("friendId").notNull(),
  clientId: int("clientId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  points: int("points").notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FriendScore = typeof friendScores.$inferSelect;
export type InsertFriendScore = typeof friendScores.$inferInsert;

// ===== リマインダー配信 =====
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  eventDate: timestamp("eventDate").notNull(),
  messageContent: text("messageContent").notNull(),
  reminderDays: json("reminderDays").notNull(), // e.g. [7, 3, 1, 0] = 7日前, 3日前, 1日前, 当日
  targetTags: json("targetTags"), // 対象タグ
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

// ===== リマインダー配信ログ =====
export const reminderLogs = mysqlTable("reminder_logs", {
  id: int("id").autoincrement().primaryKey(),
  reminderId: int("reminderId").notNull(),
  friendId: int("friendId").notNull(),
  daysBefore: int("daysBefore").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(),
});

export type ReminderLog = typeof reminderLogs.$inferSelect;

// ===== 予約 =====
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  friendId: int("friendId"),
  lineUserId: varchar("lineUserId", { length: 128 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduledAt").notNull(),
  duration: int("duration").notNull().default(60), // 分
  status: mysqlEnum("status", ["confirmed", "pending", "cancelled", "completed"]).default("pending").notNull(),
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ===== 予約設定 =====
export const bookingSettings = mysqlTable("booking_settings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  googleCalendarId: varchar("googleCalendarId", { length: 255 }),
  googleRefreshToken: text("googleRefreshToken"),
  googleAccessToken: text("googleAccessToken"),
  availableDays: json("availableDays"), // [1,2,3,4,5] = 月〜金
  availableStartTime: varchar("availableStartTime", { length: 5 }).default("09:00"),
  availableEndTime: varchar("availableEndTime", { length: 5 }).default("18:00"),
  slotDuration: int("slotDuration").default(60), // 分
  bufferTime: int("bufferTime").default(0), // 予約間のバッファ
  maxAdvanceDays: int("maxAdvanceDays").default(30),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingSettings = typeof bookingSettings.$inferSelect;
export type InsertBookingSettings = typeof bookingSettings.$inferInsert;

// ===== Stripe決済 =====
export const paymentPlans = mysqlTable("payment_plans", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  amount: int("amount").notNull(), // 円
  currency: varchar("currency", { length: 3 }).default("jpy").notNull(),
  interval: mysqlEnum("interval", ["one_time", "monthly", "yearly"]).default("one_time").notNull(),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentPlan = typeof paymentPlans.$inferSelect;
export type InsertPaymentPlan = typeof paymentPlans.$inferInsert;

// ===== 決済設定 =====
export const stripeSettings = mysqlTable("stripe_settings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  stripeSecretKey: text("stripeSecretKey"),
  stripePublishableKey: varchar("stripePublishableKey", { length: 255 }),
  stripeWebhookSecret: varchar("stripeWebhookSecret", { length: 255 }),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StripeSettings = typeof stripeSettings.$inferSelect;
export type InsertStripeSettings = typeof stripeSettings.$inferInsert;

// ===== 決済履歴 =====
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  friendId: int("friendId"),
  lineUserId: varchar("lineUserId", { length: 128 }),
  planId: int("planId"),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("jpy").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ===== クリック計測 =====
export const trackingLinks = mysqlTable("tracking_links", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  originalUrl: text("originalUrl").notNull(),
  shortCode: varchar("shortCode", { length: 32 }).notNull().unique(),
  autoTag: varchar("autoTag", { length: 128 }), // クリック時に自動付与するタグ
  triggerScenarioId: int("triggerScenarioId"), // クリック時にシナリオ発動
  totalClicks: int("totalClicks").default(0).notNull(),
  uniqueClicks: int("uniqueClicks").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrackingLink = typeof trackingLinks.$inferSelect;
export type InsertTrackingLink = typeof trackingLinks.$inferInsert;

// ===== クリックログ =====
export const clickLogs = mysqlTable("click_logs", {
  id: int("id").autoincrement().primaryKey(),
  trackingLinkId: int("trackingLinkId").notNull(),
  friendId: int("friendId"),
  lineUserId: varchar("lineUserId", { length: 128 }),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
});

export type ClickLog = typeof clickLogs.$inferSelect;

// ===== IF-THEN 自動化ルール =====
export const automationRules = mysqlTable("automation_rules", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerType: mysqlEnum("triggerType", [
    "friend_added", "keyword_received", "tag_added", "tag_removed",
    "score_reached", "link_clicked", "form_submitted"
  ]).notNull(),
  triggerConfig: json("triggerConfig").notNull(), // トリガー条件詳細
  actionType: mysqlEnum("actionType", [
    "send_message", "add_tag", "remove_tag", "add_score",
    "start_scenario", "send_rich_menu"
  ]).notNull(),
  actionConfig: json("actionConfig").notNull(), // アクション設定詳細
  isActive: boolean("isActive").default(true).notNull(),
  executionCount: int("executionCount").default(0).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

// ===== 自動化実行ログ =====
export const automationLogs = mysqlTable("automation_logs", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull(),
  friendId: int("friendId"),
  triggerData: json("triggerData"),
  actionResult: json("actionResult"),
  status: mysqlEnum("status", ["success", "failed", "skipped"]).default("success").notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type AutomationLog = typeof automationLogs.$inferSelect;

// ===== LIFFフォーム =====
export const liffForms = mysqlTable("liff_forms", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fields: json("fields").notNull(), // [{name, type, label, required, options}]
  thankYouMessage: text("thankYouMessage"),
  autoTag: varchar("autoTag", { length: 128 }),
  autoScenarioId: int("autoScenarioId"),
  liffId: varchar("liffId", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  submissionCount: int("submissionCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiffForm = typeof liffForms.$inferSelect;
export type InsertLiffForm = typeof liffForms.$inferInsert;

// ===== フォーム送信データ =====
export const formSubmissions = mysqlTable("form_submissions", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  friendId: int("friendId"),
  lineUserId: varchar("lineUserId", { length: 128 }),
  data: json("data").notNull(), // {fieldName: value}
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

// ===== オペレーターチャット =====
export const operatorChats = mysqlTable("operator_chats", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  friendId: int("friendId").notNull(),
  lineUserId: varchar("lineUserId", { length: 128 }).notNull(),
  direction: mysqlEnum("direction", ["incoming", "outgoing"]).notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "sticker", "video", "audio"]).default("text").notNull(),
  messageContent: text("messageContent"),
  messageImageUrl: text("messageImageUrl"),
  operatorUserId: int("operatorUserId"), // 送信したオペレーターのユーザーID
  isRead: boolean("isRead").default(false).notNull(),
  lineMessageId: varchar("lineMessageId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperatorChat = typeof operatorChats.$inferSelect;
export type InsertOperatorChat = typeof operatorChats.$inferInsert;

// ===== アフィリエイト =====
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  commissionRate: int("commissionRate").default(0).notNull(), // パーセント
  fixedCommission: int("fixedCommission").default(0).notNull(), // 固定額（円）
  totalReferrals: int("totalReferrals").default(0).notNull(),
  totalCommission: int("totalCommission").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

// ===== アフィリエイト紹介履歴 =====
export const affiliateReferrals = mysqlTable("affiliate_referrals", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  friendId: int("friendId"),
  lineUserId: varchar("lineUserId", { length: 128 }),
  commission: int("commission").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "paid"]).default("pending").notNull(),
  referredAt: timestamp("referredAt").defaultNow().notNull(),
});

export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;

// ===== アカウント健全性 (BAN検知) =====
export const accountHealth = mysqlTable("account_health", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  status: mysqlEnum("status", ["normal", "warning", "danger"]).default("normal").notNull(),
  dailyMessageCount: int("dailyMessageCount").default(0).notNull(),
  dailyBlockCount: int("dailyBlockCount").default(0).notNull(),
  blockRate: int("blockRate").default(0).notNull(), // パーセント×100 (e.g. 250 = 2.50%)
  warningMessage: text("warningMessage"),
  lastCheckedAt: timestamp("lastCheckedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountHealth = typeof accountHealth.$inferSelect;
export type InsertAccountHealth = typeof accountHealth.$inferInsert;

// ===== コンバージョン定義 =====
export const conversionPoints = mysqlTable("conversion_points", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("eventType", { length: 64 }).notNull(), // purchase, signup, booking等
  value: int("value").default(0).notNull(), // CV価値（円）
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversionPoint = typeof conversionPoints.$inferSelect;
export type InsertConversionPoint = typeof conversionPoints.$inferInsert;

// ===== コンバージョンイベント =====
export const conversionEvents = mysqlTable("conversion_events", {
  id: int("id").autoincrement().primaryKey(),
  conversionPointId: int("conversionPointId").notNull(),
  clientId: int("clientId").notNull(),
  friendId: int("friendId"),
  lineUserId: varchar("lineUserId", { length: 128 }),
  value: int("value").default(0).notNull(),
  metadata: json("metadata"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export type ConversionEvent = typeof conversionEvents.$inferSelect;
export type InsertConversionEvent = typeof conversionEvents.$inferInsert;

// ===== 配信設定（時間制限・ステルス配信） =====
export const deliverySettings = mysqlTable("delivery_settings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  deliveryStartHour: int("deliveryStartHour").default(9).notNull(), // 配信開始時間
  deliveryEndHour: int("deliveryEndHour").default(23).notNull(), // 配信終了時間
  enableStealthMode: boolean("enableStealthMode").default(false).notNull(),
  stealthMinDelay: int("stealthMinDelay").default(1).notNull(), // 最小遅延（秒）
  stealthMaxDelay: int("stealthMaxDelay").default(5).notNull(), // 最大遅延（秒）
  batchSize: int("batchSize").default(50).notNull(), // バッチ配信数
  batchInterval: int("batchInterval").default(3).notNull(), // バッチ間隔（秒）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliverySettings = typeof deliverySettings.$inferSelect;
export type InsertDeliverySettings = typeof deliverySettings.$inferInsert;

// ===== Webhook設定 (IN/OUT) =====
export const webhookEndpoints = mysqlTable("webhook_endpoints", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  url: text("url").notNull(), // outbound: 送信先URL, inbound: 生成されたエンドポイント
  secret: varchar("secret", { length: 128 }), // 署名検証用シークレット
  eventTypes: json("eventTypes").notNull(), // ["message_received", "friend_added", ...]
  isActive: boolean("isActive").default(true).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  totalCalls: int("totalCalls").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type InsertWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

// ===== Webhookログ =====
export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").autoincrement().primaryKey(),
  endpointId: int("endpointId").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  payload: json("payload"),
  responseStatus: int("responseStatus"),
  responseBody: text("responseBody"),
  status: mysqlEnum("status", ["success", "failed"]).default("success").notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;

// ===== 友だち経路追跡 =====
export const friendSources = mysqlTable("friend_sources", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  description: text("description"),
  url: text("url"), // 追跡用URL
  friendCount: int("friendCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FriendSource = typeof friendSources.$inferSelect;
export type InsertFriendSource = typeof friendSources.$inferInsert;
