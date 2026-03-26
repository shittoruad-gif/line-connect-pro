import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, Send, MessageSquare, TrendingUp, Activity } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedClientId } = useClient();

  const { data: stats, isLoading } = trpc.clients.dashboard.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const { data: msgStats } = trpc.messageLogs.stats.useQuery(
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="友だち数"
              value={stats?.friendCount ?? 0}
              icon={Users}
              loading={isLoading}
            />
            <StatCard
              title="自動応答（有効）"
              value={stats?.activeAutoReplies ?? 0}
              icon={Bot}
              loading={isLoading}
            />
            <StatCard
              title="ステップ配信（有効）"
              value={stats?.activeScenarios ?? 0}
              icon={Send}
              loading={isLoading}
            />
            <StatCard
              title="配信メッセージ数"
              value={stats?.messagesSent ?? 0}
              icon={MessageSquare}
              loading={isLoading}
            />
          </div>

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
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
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
