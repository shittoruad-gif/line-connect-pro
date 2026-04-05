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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Target, Plus, Pencil, Trash2, TrendingUp, DollarSign,
  BarChart3, Activity,
} from "lucide-react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  purchase: "購入",
  signup: "登録",
  inquiry: "問い合わせ",
  reservation: "予約",
  click: "クリック",
  custom: "カスタム",
};

export default function ConversionsPage() {
  const { selectedClientId } = useClient();
  const [pointDialogOpen, setPointDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<any>(null);
  const [pointForm, setPointForm] = useState({ name: "", eventType: "purchase", value: 0, isActive: true });

  // --- Queries ---
  const { data: points, isLoading: pointsLoading } = trpc.conversions.listPoints.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: events } = trpc.conversions.events.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: stats } = trpc.conversions.stats.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  // --- Mutations ---
  const utils = trpc.useUtils();
  const createPointMut = trpc.conversions.createPoint.useMutation({
    onSuccess: () => {
      utils.conversions.listPoints.invalidate();
      setPointDialogOpen(false);
      toast.success("コンバージョンポイントを保存しました");
    },
    onError: (e) => toast.error(e.message),
  });
  const updatePointMut = trpc.conversions.updatePoint.useMutation({
    onSuccess: () => {
      utils.conversions.listPoints.invalidate();
      setPointDialogOpen(false);
      toast.success("コンバージョンポイントを保存しました");
    },
    onError: (e) => toast.error(e.message),
  });
  const deletePointMut = trpc.conversions.deletePoint.useMutation({
    onSuccess: () => { utils.conversions.listPoints.invalidate(); toast.success("削除しました"); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingPoint(null);
    setPointForm({ name: "", eventType: "purchase", value: 0, isActive: true });
    setPointDialogOpen(true);
  };

  const openEdit = (point: any) => {
    setEditingPoint(point);
    setPointForm({ name: point.name, eventType: point.eventType, value: point.value, isActive: point.isActive });
    setPointDialogOpen(true);
  };

  const handleSavePoint = () => {
    if (!selectedClientId) return;
    if (editingPoint) {
      updatePointMut.mutate({ id: editingPoint.id, ...pointForm });
    } else {
      createPointMut.mutate({ clientId: selectedClientId, ...pointForm });
    }
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">コンバージョン計測</h1>
            <p className="text-sm text-muted-foreground mt-1">コンバージョンポイントとイベントの管理</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">コンバージョン計測</h1>
          <p className="text-sm text-muted-foreground mt-1">コンバージョンポイントとイベントの管理</p>
        </div>
        <ClientSelector />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総コンバージョン数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(stats.totalConversions ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総コンバージョン金額</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{"\u00A5"}{(stats.totalValue ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversion Points */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              コンバージョンポイント
            </CardTitle>
            <CardDescription>計測するコンバージョンポイントの設定</CardDescription>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </Button>
        </CardHeader>
        <CardContent>
          {pointsLoading ? (
            <div className="h-24 bg-muted animate-pulse rounded" />
          ) : !points || points.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">コンバージョンポイントがありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>イベントタイプ</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {points.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{EVENT_TYPE_LABELS[p.eventType] ?? p.eventType}</Badge>
                    </TableCell>
                    <TableCell>{"\u00A5"}{(p.value ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("このコンバージョンポイントを削除しますか？")) {
                          deletePointMut.mutate({ id: p.id });
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

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            コンバージョンイベント
          </CardTitle>
          <CardDescription>発生したコンバージョンイベントの一覧</CardDescription>
        </CardHeader>
        <CardContent>
          {!events || events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">イベントがありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ポイント名</TableHead>
                  <TableHead>友だち</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>発生日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.pointName ?? "-"}</TableCell>
                    <TableCell>{e.friendName ?? e.friendId ?? "-"}</TableCell>
                    <TableCell>{"\u00A5"}{(e.value ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(e.occurredAt).toLocaleString("ja-JP")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Point Dialog */}
      <Dialog open={pointDialogOpen} onOpenChange={setPointDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPoint ? "コンバージョンポイント編集" : "新規コンバージョンポイント"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>名前</Label>
              <Input value={pointForm.name} onChange={(e) => setPointForm({ ...pointForm, name: e.target.value })} placeholder="例: 商品購入" />
            </div>
            <div>
              <Label>イベントタイプ</Label>
              <Select value={pointForm.eventType} onValueChange={(v) => setPointForm({ ...pointForm, eventType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>コンバージョン金額 (円)</Label>
              <Input type="number" value={pointForm.value} onChange={(e) => setPointForm({ ...pointForm, value: Number(e.target.value) })} placeholder="例: 10000" />
            </div>
            <div className="flex items-center justify-between">
              <Label>有効</Label>
              <Switch checked={pointForm.isActive} onCheckedChange={(v) => setPointForm({ ...pointForm, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPointDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSavePoint} disabled={createPointMut.isPending || updatePointMut.isPending}>
              {(createPointMut.isPending || updatePointMut.isPending) ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
