import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Webhook, Plus, Copy, Eye, Trash2, ArrowDownLeft, ArrowUpRight,
  Activity, FileText,
} from "lucide-react";

const EVENT_TYPES = [
  { value: "message.received", label: "メッセージ受信" },
  { value: "message.sent", label: "メッセージ送信" },
  { value: "friend.added", label: "友だち追加" },
  { value: "friend.blocked", label: "ブロック" },
  { value: "payment.completed", label: "決済完了" },
  { value: "conversion.occurred", label: "コンバージョン発生" },
];

export default function WebhooksPage() {
  const { selectedClientId } = useClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    direction: "outbound" as string,
    url: "",
    eventTypes: [] as string[],
    isActive: true,
  });

  // --- Queries ---
  const { data: endpoints, isLoading } = trpc.webhooks.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: logs } = trpc.webhooks.logs.useQuery(
    { endpointId: selectedEndpoint?.id! },
    { enabled: !!selectedClientId && !!selectedEndpoint?.id && logsOpen }
  );

  // --- Mutations ---
  const utils = trpc.useUtils();
  const createMut = trpc.webhooks.create.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
      setCreateOpen(false);
      setForm({ name: "", direction: "outbound", url: "", eventTypes: [], isActive: true });
      toast.success("Webhookエンドポイントを作成しました");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.webhooks.delete.useMutation({
    onSuccess: () => { utils.webhooks.list.invalidate(); toast.success("削除しました"); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!selectedClientId) return;
    createMut.mutate({ clientId: selectedClientId, ...form, direction: form.direction as "inbound" | "outbound" });
  };

  const toggleEventType = (eventType: string) => {
    setForm((prev) => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter((e) => e !== eventType)
        : [...prev.eventTypes, eventType],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}をコピーしました`);
  };

  const openLogs = (endpoint: any) => {
    setSelectedEndpoint(endpoint);
    setLogsOpen(true);
  };

  const directionBadge = (direction: string) => {
    if (direction === "inbound") {
      return (
        <Badge className="bg-blue-500/20 text-blue-400">
          <ArrowDownLeft className="h-3 w-3 mr-1" />
          IN
        </Badge>
      );
    }
    return (
      <Badge className="bg-primary/20 text-primary">
        <ArrowUpRight className="h-3 w-3 mr-1" />
        OUT
      </Badge>
    );
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Webhook管理</h1>
            <p className="text-sm text-muted-foreground mt-1">Webhook IN/OUTエンドポイントの管理</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Webhook className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">Webhook管理</h1>
          <p className="text-sm text-muted-foreground mt-1">Webhook IN/OUTエンドポイントの管理</p>
        </div>
        <ClientSelector />
      </div>

      {/* Endpoints List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              エンドポイント一覧
            </CardTitle>
            <CardDescription>受信（IN）と送信（OUT）のWebhookエンドポイント</CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 bg-muted animate-pulse rounded" />
          ) : !endpoints || endpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">エンドポイントがありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>方向</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>イベント</TableHead>
                  <TableHead>呼出数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((ep: any) => (
                  <TableRow key={ep.id}>
                    <TableCell className="font-medium">{ep.name}</TableCell>
                    <TableCell>{directionBadge(ep.direction)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground font-mono text-xs">
                      {ep.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(ep.eventTypes ?? []).slice(0, 2).map((et: string) => (
                          <Badge key={et} variant="outline" className="text-xs">{et}</Badge>
                        ))}
                        {(ep.eventTypes ?? []).length > 2 && (
                          <Badge variant="outline" className="text-xs">+{ep.eventTypes.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{(ep.totalCalls ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={ep.isActive ? "default" : "secondary"}>
                        {ep.isActive ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {ep.secret && (
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(ep.secret, "シークレット")} title="シークレットをコピー">
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {ep.url && (
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(ep.url, "URL")} title="URLをコピー">
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openLogs(ep)} title="ログを表示">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("このエンドポイントを削除しますか？")) {
                          deleteMut.mutate({ id: ep.id });
                        }
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規Webhookエンドポイント</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>名前</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: CRM連携" />
            </div>
            <div>
              <Label>方向</Label>
              <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">受信 (IN)</SelectItem>
                  <SelectItem value="outbound">送信 (OUT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.direction === "outbound" && (
              <div>
                <Label>送信先URL</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhook" />
              </div>
            )}
            <div>
              <Label className="mb-3 block">イベントタイプ</Label>
              <div className="space-y-2">
                {EVENT_TYPES.map((et) => (
                  <div key={et.value} className="flex items-center gap-2">
                    <Checkbox
                      id={et.value}
                      checked={form.eventTypes.includes(et.value)}
                      onCheckedChange={() => toggleEventType(et.value)}
                    />
                    <label htmlFor={et.value} className="text-sm cursor-pointer">{et.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>有効</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>キャンセル</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedEndpoint?.name} - ログ
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            {!logs || logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">ログがありません</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>イベント</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>レスポンスコード</TableHead>
                    <TableHead>日時</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.eventType}</TableCell>
                      <TableCell>
                        <Badge className={log.status === "success" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.responseCode ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("ja-JP")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
