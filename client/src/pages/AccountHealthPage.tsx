import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShieldCheck, ShieldAlert, ShieldX, RefreshCw, MessageSquare,
  UserX, BarChart3, Lightbulb, Activity,
} from "lucide-react";

const HEALTH_CONFIG = {
  normal: {
    icon: ShieldCheck,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    label: "正常",
    badgeClass: "bg-primary/20 text-primary",
  },
  warning: {
    icon: ShieldAlert,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    label: "警告",
    badgeClass: "bg-yellow-500/20 text-yellow-400",
  },
  danger: {
    icon: ShieldX,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    label: "危険",
    badgeClass: "bg-destructive/20 text-destructive",
  },
};

const TIPS = [
  "短時間に大量のメッセージを送信しないようにしましょう。",
  "ブロック率を5%以下に保つことが推奨されます。",
  "配信時間帯を日中（9:00-21:00）に設定しましょう。",
  "セグメント配信を活用し、関心の高いユーザーに絞って配信しましょう。",
  "友だち追加直後の挨拶メッセージで、配信内容の期待値を伝えましょう。",
  "配信頻度を週1-2回程度に抑えると、ブロック率を低減できます。",
];

export default function AccountHealthPage() {
  const { selectedClientId } = useClient();

  const { data: health, isLoading, refetch } = trpc.accountHealth.get.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const refreshMut = trpc.accountHealth.refresh.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("健全性を再計算しました");
    },
    onError: (e) => toast.error(e.message),
  });

  const status = (health?.status as keyof typeof HEALTH_CONFIG) ?? "normal";
  const config = HEALTH_CONFIG[status] ?? HEALTH_CONFIG.normal;
  const StatusIcon = config.icon;

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">アカウント健全性</h1>
            <p className="text-sm text-muted-foreground mt-1">BAN検知・アカウントの健全性チェック</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">アカウント健全性</h1>
          <p className="text-sm text-muted-foreground mt-1">BAN検知・アカウントの健全性チェック</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refreshMut.mutate({ clientId: selectedClientId })}
            disabled={refreshMut.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMut.isPending ? "animate-spin" : ""}`} />
            再計算
          </Button>
          <ClientSelector />
        </div>
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : (
        <>
          {/* Status Display */}
          <Card className={`border ${config.borderColor}`}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className={`p-6 rounded-full ${config.bgColor} mb-4`}>
                <StatusIcon className={`h-16 w-16 ${config.color}`} />
              </div>
              <Badge className={`text-lg px-4 py-1 ${config.badgeClass}`}>
                {config.label}
              </Badge>
              {(health as any)?.warningMessage && (
                <p className="mt-4 text-sm text-muted-foreground text-center max-w-md">
                  {(health as any).warningMessage}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">日次メッセージ数</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{((health as any)?.dailyMessageCount ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">日次ブロック数</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{((health as any)?.dailyBlockCount ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ブロック率</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {((health as any)?.blockRate ?? 0).toFixed(1)}
                  <span className="text-sm text-muted-foreground ml-1">%</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Warning Message */}
          {(health as any)?.warningMessage && (
            <Card className="border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <ShieldAlert className="h-5 w-5" />
                  警告メッセージ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm">
                  <ShieldAlert className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>{(health as any).warningMessage}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                アカウント健全性を改善するヒント
              </CardTitle>
              <CardDescription>以下のポイントを意識して運用しましょう</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
