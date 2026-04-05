import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClient } from "@/contexts/ClientContext";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Star, Pencil, Trash2, Trophy, Zap } from "lucide-react";

const EVENT_TYPES = [
  { value: "message_received", label: "メッセージ受信" },
  { value: "link_clicked", label: "リンククリック" },
  { value: "form_submitted", label: "フォーム送信" },
  { value: "purchase_completed", label: "購入完了" },
  { value: "friend_added", label: "友だち追加" },
  { value: "rich_menu_tapped", label: "リッチメニュータップ" },
  { value: "step_completed", label: "ステップ完了" },
  { value: "keyword_matched", label: "キーワードマッチ" },
  { value: "manual", label: "手動" },
] as const;

const eventTypeLabels: Record<string, string> = Object.fromEntries(EVENT_TYPES.map((e) => [e.value, e.label]));

type RuleForm = {
  eventType: string;
  points: number;
  description: string;
  isActive: boolean;
};

const emptyRuleForm: RuleForm = { eventType: "message_received", points: 1, description: "", isActive: true };

export default function ScoringPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyRuleForm);

  const utils = trpc.useUtils();
  const { data: rules, isLoading: rulesLoading } = trpc.scoring.listRules.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: ranking, isLoading: rankingLoading } = trpc.scoring.ranking.useQuery(
    { clientId: selectedClientId!, limit: 20 },
    { enabled: !!selectedClientId }
  );

  const createMut = trpc.scoring.createRule.useMutation({
    onSuccess: () => { utils.scoring.listRules.invalidate(); setDialogOpen(false); toast.success("スコアルールを作成しました"); },
  });
  const updateMut = trpc.scoring.updateRule.useMutation({
    onSuccess: () => { utils.scoring.listRules.invalidate(); setDialogOpen(false); toast.success("スコアルールを更新しました"); },
  });
  const deleteMut = trpc.scoring.deleteRule.useMutation({
    onSuccess: () => { utils.scoring.listRules.invalidate(); toast.success("削除しました"); },
  });
  const toggleMut = trpc.scoring.updateRule.useMutation({
    onSuccess: () => utils.scoring.listRules.invalidate(),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyRuleForm); setDialogOpen(true); };
  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({ eventType: r.eventType, points: r.points, description: r.description ?? "", isActive: r.isActive });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.eventType || form.points === 0) { toast.error("イベントタイプとポイントは必須です"); return; }
    const payload = { ...form, eventType: form.eventType as any };
    if (editingId) updateMut.mutate({ id: editingId, ...payload });
    else createMut.mutate({ clientId: selectedClientId!, ...payload });
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">スコアリング管理</h1>
            <p className="text-sm text-muted-foreground mt-1">友だちのエンゲージメントスコアを管理</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Star className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">スコアリング管理</h1>
          <p className="text-sm text-muted-foreground mt-1">友だちのエンゲージメントスコアを管理</p>
        </div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> 新規ルール</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-[#06C755]" />
              スコアルール
            </CardTitle>
            <CardDescription>イベントごとのポイント設定</CardDescription>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="animate-pulse h-32" />
            ) : !rules || rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Zap className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">スコアルールがありません</p>
                <p className="text-xs text-muted-foreground mt-1">ルールを作成すると、友だちの行動に応じてスコアが自動計算されます</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>イベント</TableHead>
                    <TableHead className="text-right">ポイント</TableHead>
                    <TableHead>有効</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{eventTypeLabels[r.eventType] ?? r.eventType}</p>
                          {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.points > 0 ? "default" : "secondary"} className={r.points > 0 ? "bg-[#06C755]/20 text-[#06C755]" : ""}>
                          {r.points > 0 ? `+${r.points}` : r.points}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={r.isActive} onCheckedChange={(v) => toggleMut.mutate({ id: r.id, isActive: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("削除しますか？")) deleteMut.mutate({ id: r.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              スコアランキング
            </CardTitle>
            <CardDescription>スコア上位の友だち一覧</CardDescription>
          </CardHeader>
          <CardContent>
            {rankingLoading ? (
              <div className="animate-pulse h-32" />
            ) : !ranking || ranking.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">ランキングデータがありません</p>
                <p className="text-xs text-muted-foreground mt-1">スコアルールを作成し、友だちが行動するとランキングに表示されます</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>友だち名</TableHead>
                    <TableHead className="text-right">スコア</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((f, i) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <span className={`font-bold ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{f.displayName}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-[#06C755]/20 text-[#06C755]">{f.score ?? 0}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "スコアルール編集" : "新規スコアルール"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>イベントタイプ</Label>
              <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v })}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ポイント</Label>
              <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })} placeholder="例: 10" />
              <p className="text-xs text-muted-foreground">目安: メッセージ受信=1〜5、フォーム送信=5〜20、購入完了=20〜50</p>
            </div>
            <div className="space-y-2">
              <Label>メモ（内部用）</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="このルールの用途メモ（任意）" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>有効</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editingId ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
