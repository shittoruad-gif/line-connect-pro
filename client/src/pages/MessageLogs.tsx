import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";

const statusLabels: Record<string, string> = {
  sent: "送信済み",
  failed: "失敗",
  pending: "送信待ち",
};
const statusColors: Record<string, string> = {
  sent: "bg-primary/20 text-primary",
  failed: "bg-destructive/20 text-destructive",
  pending: "bg-chart-4/20 text-chart-4",
};
const typeLabels: Record<string, string> = {
  broadcast: "一斉配信",
  step: "ステップ配信",
  auto_reply: "自動応答",
  greeting: "あいさつ",
  manual: "手動",
};

export default function MessageLogsPage() {
  const { selectedClientId } = useClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: logs, isLoading } = trpc.messageLogs.list.useQuery(
    {
      clientId: selectedClientId!,
      // filters applied client-side
    },
    { enabled: !!selectedClientId }
  );

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">配信履歴</h1><p className="text-sm text-muted-foreground mt-1">メッセージ配信のログ・レポート</p></div>
          <ClientSelector />
        </div>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><FileText className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">配信履歴</h1><p className="text-sm text-muted-foreground mt-1">メッセージ配信のログ・レポート</p></div>
        <ClientSelector />
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="ステータス" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="sent">送信済み</SelectItem>
            <SelectItem value="failed">失敗</SelectItem>
            <SelectItem value="pending">送信待ち</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="配信タイプ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="broadcast">一斉配信</SelectItem>
            <SelectItem value="step">ステップ配信</SelectItem>
            <SelectItem value="auto_reply">自動応答</SelectItem>
            <SelectItem value="greeting">あいさつ</SelectItem>
            <SelectItem value="manual">手動</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : !logs || logs.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><FileText className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">配信履歴がありません</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>対象</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{new Date(log.sentAt ?? log.createdAt).toLocaleString("ja-JP")}</TableCell>
                  <TableCell><Badge variant="secondary">{typeLabels[log.messageType] ?? log.messageType}</Badge></TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm">{log.messageContent}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.recipientCount ? `${log.recipientCount}人` : "-"}</TableCell>
                  <TableCell><Badge className={statusColors[log.status] ?? ""} variant="secondary">{statusLabels[log.status] ?? log.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
