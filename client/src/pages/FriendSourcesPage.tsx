import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClient } from "@/contexts/ClientContext";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Link2, Pencil, Trash2, Copy, BarChart3, Users } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = {
  primary: "#06C755",
  secondary: "#4ade80",
  tertiary: "#065f46",
  blue: "#3b82f6",
  orange: "#f97316",
  purple: "#a855f7",
  yellow: "#eab308",
  red: "#ef4444",
};

const PIE_COLORS = [COLORS.primary, COLORS.blue, COLORS.orange, COLORS.purple, COLORS.yellow, COLORS.secondary, COLORS.red, COLORS.tertiary];

type FormData = {
  name: string;
  code: string;
  description: string;
};

const emptyForm: FormData = { name: "", code: "", description: "" };

type FriendSource = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  friendCount: number;
  isActive: boolean;
};

export default function FriendSourcesPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: sources, isLoading } = trpc.friendSources.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const createMut = trpc.friendSources.create.useMutation({
    onSuccess: () => {
      utils.friendSources.list.invalidate();
      setDialogOpen(false);
      toast.success("経路を作成しました");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMut = trpc.friendSources.update.useMutation({
    onSuccess: () => {
      utils.friendSources.list.invalidate();
      setDialogOpen(false);
      toast.success("経路を更新しました");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = trpc.friendSources.delete.useMutation({
    onSuccess: () => {
      utils.friendSources.list.invalidate();
      setDeleteConfirmId(null);
      toast.success("経路を削除しました");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMut = trpc.friendSources.update.useMutation({
    onSuccess: () => utils.friendSources.list.invalidate(),
  });

  const getTrackingUrl = (code: string) => `/auth/line?ref=${code}`;

  const copyTrackingUrl = (code: string) => {
    const url = `${window.location.origin}${getTrackingUrl(code)}`;
    navigator.clipboard.writeText(url);
    toast.success("トラッキングURLをコピーしました");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (source: FriendSource) => {
    setEditingId(source.id);
    setForm({
      name: source.name,
      code: source.code,
      description: source.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("経路名は必須です");
      return;
    }
    if (!form.code.trim()) {
      toast.error("コードは必須です");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(form.code)) {
      toast.error("コードは英数字・ハイフン・アンダースコアのみ使用できます");
      return;
    }
    if (editingId) {
      updateMut.mutate({ id: editingId, name: form.name, description: form.description || undefined });
    } else {
      createMut.mutate({ clientId: selectedClientId!, name: form.name, code: form.code, description: form.description || undefined });
    }
  };

  // Chart data
  const chartData = (sources ?? [])
    .filter((s) => s.friendCount > 0)
    .sort((a, b) => b.friendCount - a.friendCount)
    .map((s) => ({ name: s.name, value: s.friendCount }));

  const totalFriends = (sources ?? []).reduce((sum, s) => sum + s.friendCount, 0);

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">友だち経路追跡</h1>
            <p className="text-sm text-muted-foreground mt-1">友だち追加の経路を管理・分析</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">友だち追加経路</h1>
          <p className="text-sm text-muted-foreground mt-1">友だちがどこから追加されたかを追跡・分析</p>
        </div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> 新規作成
          </Button>
        </div>
      </div>

      {/* Chart section */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" style={{ color: COLORS.primary }} />
                経路別友だち数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-foreground)",
                    }}
                  />
                  <Bar dataKey="value" name="友だち数" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: COLORS.primary }} />
                経路分布（合計: {totalFriends}人）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "rgba(255,255,255,0.3)" }}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-foreground)",
                    }}
                    formatter={(value: number) => [`${value}人`, "友だち数"]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : !sources || sources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">経路が設定されていません</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">「新規作成」から経路を追加し、発行されるトラッキングURLを広告やSNS、Webサイトに設置すると、友だちの追加元を自動追跡できます。</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>経路名</TableHead>
                <TableHead>コード</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="text-center">友だち数</TableHead>
                <TableHead className="text-center">有効</TableHead>
                <TableHead>トラッキングURL</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{source.code}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {source.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold" style={{ color: COLORS.primary }}>{source.friendCount}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={source.isActive}
                      onCheckedChange={(v) => toggleMut.mutate({ id: source.id, isActive: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded max-w-[200px] truncate block">
                        {getTrackingUrl(source.code)}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={() => copyTrackingUrl(source.code)}
                        title="URLをコピー"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(source)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteConfirmId(source.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "経路を編集" : "新規経路作成"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {form.code && (
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">トラッキングURL</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => copyTrackingUrl(form.code)}>
                    <Copy className="h-3 w-3" /> コピー
                  </Button>
                </div>
                <code className="text-sm font-medium break-all" style={{ color: COLORS.primary }}>
                  {window.location.origin}{getTrackingUrl(form.code)}
                </code>
                <p className="text-xs text-muted-foreground mt-2">このURLを広告やSNSに設置すると、ここからの友だち追加を追跡できます</p>
              </div>
            )}
            <div>
              <Label>経路名 *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例: Instagram広告"
              />
            </div>
            <div>
              <Label>経路コード *{editingId ? "（変更不可）" : ""}</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="例: instagram-ad"
                className="font-mono"
                disabled={!!editingId}
              />
              <p className="text-xs text-muted-foreground mt-1">
                英数字・ハイフン・アンダースコアのみ。例: instagram-ad, google-2026
              </p>
            </div>
            <div>
              <Label>説明</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="この経路の説明（任意）"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {editingId ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>経路を削除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            この経路を削除してもよろしいですか？この操作は取り消せません。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>キャンセル</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMut.mutate({ id: deleteConfirmId })}
              disabled={deleteMut.isPending}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
