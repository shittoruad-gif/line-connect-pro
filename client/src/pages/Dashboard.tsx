import { useState, useEffect, useRef } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Bot, Send, MessageSquare, TrendingUp, Activity,
  Bell, UserPlus, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ===== SSE Notification Hook =====
type Notification = {
  type: string;
  clientId?: number;
  title: string;
  message: string;
  timestamp: string;
};

function useNotifications(clientId: number | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!clientId) return;
    const url = `/api/sse/notifications?clientId=${clientId}`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(url);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connected") return;
          setNotifications((prev) => [data, ...prev].slice(0, 50));
        } catch { /* ignore parse errors */ }
      };
      es.onerror = () => {
        es?.close();
      };
    } catch { /* SSE not supported */ }
    return () => { es?.close(); };
  }, [clientId]);

  return notifications;
}

// ===== Chart Colors =====
const COLORS = {
  primary: "#06C755",
  secondary: "#4ade80",
  tertiary: "#065f46",
  blue: "#3b82f6",
  orange: "#f97316",
  red: "#ef4444",
  purple: "#a855f7",
  yellow: "#eab308",
};

const PIE_COLORS = [COLORS.primary, COLORS.blue, COLORS.orange, COLORS.purple];

const TYPE_LABELS: Record<string, string> = {
  auto_reply: "自動応答",
  broadcast: "一斉配信",
  step: "ステップ",
  manual: "手動",
  active: "アクティブ",
  blocked: "ブロック",
  unfollowed: "解除",
};

// ===== Main Dashboard =====
export default function Dashboard() {
  const { user } = useAuth();
  const { selectedClientId } = useClient();
  const notifications = useNotifications(selectedClientId);

  const { data: stats, isLoading } = trpc.clients.dashboard.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const { data: msgStats } = trpc.messageLogs.stats.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const { data: messageChart } = trpc.analytics.messageChart.useQuery(
    { clientId: selectedClientId!, days: 30 },
    { enabled: !!selectedClientId }
  );

  const { data: friendGrowth } = trpc.analytics.friendGrowth.useQuery(
    { clientId: selectedClientId!, days: 30 },
    { enabled: !!selectedClientId }
  );

  const { data: messageTypeData } = trpc.analytics.messageTypeBreakdown.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const { data: friendStatusData } = trpc.analytics.friendStatusBreakdown.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.role === "admin" ? "全クライアントの管理概要" : "アカウントの運用状況"}
          </p>
        </div>
        <ClientSelector />
      </div>

      {!selectedClientId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              上部のセレクターからクライアントを選択すると、ダッシュボードが表示されます
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="友だち数" value={stats?.friendCount ?? 0} icon={Users} loading={isLoading} />
            <StatCard title="自動応答（有効）" value={stats?.activeAutoReplies ?? 0} icon={Bot} loading={isLoading} />
            <StatCard title="ステップ配信（有効）" value={stats?.activeScenarios ?? 0} icon={Send} loading={isLoading} />
            <StatCard title="配信メッセージ数" value={stats?.messagesSent ?? 0} icon={MessageSquare} loading={isLoading} />
          </div>

          {/* Delivery Status */}
          {msgStats && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">配信成功</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{msgStats.sent}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">配信失敗</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-destructive" />
                    <span className="text-2xl font-bold">{msgStats.failed}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">配信待ち</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{msgStats.pending}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Message Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  配信数推移（過去30日）
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messageChart && messageChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={messageChart}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }} tickFormatter={(v) => v?.slice(5) || ""} />
                      <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                        labelStyle={{ color: "#ccc" }}
                      />
                      <Area type="monotone" dataKey="total" stroke={COLORS.primary} fill="url(#colorTotal)" name="合計" />
                      <Area type="monotone" dataKey="sent" stroke={COLORS.secondary} fill="none" name="成功" strokeDasharray="3 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="配信データがありません" />
                )}
              </CardContent>
            </Card>

            {/* Friend Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  友だち追加推移（過去30日）
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendGrowth && friendGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={friendGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }} tickFormatter={(v) => v?.slice(5) || ""} />
                      <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                        labelStyle={{ color: "#ccc" }}
                      />
                      <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="追加数" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="友だち追加データがありません" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pie Charts + Notifications Row */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Message Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">配信タイプ内訳</CardTitle>
              </CardHeader>
              <CardContent>
                {messageTypeData && messageTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={messageTypeData.map((d) => ({ name: TYPE_LABELS[d.type] || d.type, value: d.count }))}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        paddingAngle={3} dataKey="value"
                      >
                        {messageTypeData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Legend formatter={(v) => <span className="text-xs text-gray-400">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="データなし" height={200} />
                )}
              </CardContent>
            </Card>

            {/* Friend Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">友だちステータス</CardTitle>
              </CardHeader>
              <CardContent>
                {friendStatusData && friendStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={friendStatusData.map((d) => ({ name: TYPE_LABELS[d.status] || d.status, value: d.count }))}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        paddingAngle={3} dataKey="value"
                      >
                        {friendStatusData.map((_, i) => (
                          <Cell key={i} fill={[COLORS.primary, COLORS.red, COLORS.yellow][i % 3]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Legend formatter={(v) => <span className="text-xs text-gray-400">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="データなし" height={200} />
                )}
              </CardContent>
            </Card>

            {/* Real-time Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  リアルタイム通知
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">{notifications.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      新しい通知はありません
                    </p>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                        <NotificationIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{n.title}</p>
                          <p className="text-muted-foreground truncate">{n.message}</p>
                        </div>
                        <span className="text-muted-foreground/50 shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ===== Sub Components =====
function StatCard({ title, value, icon: Icon, loading }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label, height = 250 }: { label: string; height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "friend_added": return <UserPlus className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />;
    case "message_received": return <MessageSquare className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />;
    case "auto_reply_sent": return <Bot className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />;
    default: return <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />;
  }
}
