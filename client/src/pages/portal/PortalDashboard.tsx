import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Send, Bot, Loader2 } from "lucide-react";

export default function PortalDashboard() {
  const { data: client, isLoading: clientLoading } = trpc.portal.myClient.useQuery();
  const { data: dashboard, isLoading: dashLoading } = trpc.portal.myDashboard.useQuery();

  if (clientLoading || dashLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = (dashboard ?? { friendCount: 0, autoReplyCount: 0, stepScenarioCount: 0, messageLogCount: 0, richMenuCount: 0, chatbotCount: 0 }) as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{client?.name ?? "ダッシュボード"}</h1>
        <p className="text-muted-foreground mt-1">LINE公式アカウントの運用状況を確認できます</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">友だち数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.friendCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">登録済みの友だち</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">自動応答</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.autoReplyCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">設定済みルール</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ステップ配信</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stepScenarioCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">配信シナリオ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">チャットボット</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.chatbotCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">AIシナリオ</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">アカウント情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ステータス</span>
              <span className={`text-sm font-medium ${client?.status === "active" ? "text-green-500" : client?.status === "trial" ? "text-yellow-500" : "text-red-500"}`}>
                {client?.status === "active" ? "アクティブ" : client?.status === "trial" ? "トライアル" : "停止中"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">リッチメニュー</span>
              <span className="text-sm font-medium">{stats.richMenuCount ?? 0} 件</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">配信履歴</span>
              <span className="text-sm font-medium">{stats.messageLogCount ?? 0} 件</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">クイックアクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickActionButton icon={MessageSquare} label="自動応答を設定" path="/portal/auto-replies" />
            <QuickActionButton icon={Bot} label="チャットボットを作成" path="/portal/chatbot" />
            <QuickActionButton icon={Send} label="ステップ配信を設定" path="/portal/step-delivery" />
            <QuickActionButton icon={Users} label="友だちを管理" path="/portal/friends" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, path }: { icon: React.ComponentType<{ className?: string }>; label: string; path: string }) {
  return (
    <a
      href={path}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </a>
  );
}
