import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClient } from "@/contexts/ClientContext";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Zap, Trash2, ChevronDown, ChevronRight, ArrowRight, History, Pencil } from "lucide-react";

const triggerTypes = [
  { value: "friend_added", label: "友だち追加" },
  { value: "keyword_received", label: "キーワード受信" },
  { value: "tag_added", label: "タグ追加" },
  { value: "tag_removed", label: "タグ削除" },
  { value: "score_reached", label: "スコア到達" },
  { value: "link_clicked", label: "リンククリック" },
  { value: "form_submitted", label: "フォーム送信" },
] as const;

const actionTypes = [
  { value: "send_message", label: "メッセージ送信" },
  { value: "add_tag", label: "タグ追加" },
  { value: "remove_tag", label: "タグ削除" },
  { value: "add_score", label: "スコア加算" },
  { value: "start_scenario", label: "シナリオ開始" },
  { value: "send_rich_menu", label: "リッチメニュー送信" },
] as const;

const triggerLabel = (v: string) => triggerTypes.find(t => t.value === v)?.label ?? v;
const actionLabel = (v: string) => actionTypes.find(a => a.value === v)?.label ?? v;

type FormData = {
  name: string;
  triggerType: string;
  triggerConfig: Record<string, string>;
  actionType: string;
  actionConfig: Record<string, string>;
};
const emptyForm: FormData = { name: "", triggerType: "friend_added", triggerConfig: {}, actionType: "send_message", actionConfig: {} };

export default function AutomationRulesPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.automation.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const createMut = trpc.automation.create.useMutation({
    onSuccess: () => { utils.automation.list.invalidate(); setDialogOpen(false); setForm(emptyForm); toast.success("ルールを作成しました"); },
  });
  const updateMut = trpc.automation.update.useMutation({
    onSuccess: () => { utils.automation.list.invalidate(); setDialogOpen(false); toast.success("ルールを更新しました"); },
  });
  const deleteMut = trpc.automation.delete.useMutation({
    onSuccess: () => { utils.automation.list.invalidate(); toast.success("削除しました"); },
  });
  const toggleMut = trpc.automation.update.useMutation({
    onSuccess: () => utils.automation.list.invalidate(),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      triggerType: r.triggerType,
      triggerConfig: r.triggerConfig ?? {},
      actionType: r.actionType,
      actionConfig: r.actionConfig ?? {},
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("ルール名は必須です"); return; }
    const payload = {
      name: form.name,
      triggerType: form.triggerType as any,
      triggerConfig: form.triggerConfig,
      actionType: form.actionType as any,
      actionConfig: form.actionConfig,
    };
    if (editingId) updateMut.mutate({ id: editingId, ...payload });
    else createMut.mutate({ clientId: selectedClientId!, ...payload });
  };

  const updateTriggerConfig = (key: string, value: string) => {
    setForm({ ...form, triggerConfig: { ...form.triggerConfig, [key]: value } });
  };
  const updateActionConfig = (key: string, value: string) => {
    setForm({ ...form, actionConfig: { ...form.actionConfig, [key]: value } });
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">自動化ルール</h1><p className="text-sm text-muted-foreground mt-1">IF-THEN形式の自動化ルール管理</p></div>
          <ClientSelector />
        </div>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Zap className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">自動化ルール</h1><p className="text-sm text-muted-foreground mt-1">IF-THEN形式の自動化ルール管理</p></div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> 新規ルール</Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : !rules || rules.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Zap className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">自動化ルールがありません</p><p className="text-sm text-muted-foreground mt-2">「新規ルール」から IF（条件） → THEN（アクション） のルールを作成できます</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>ルール名</TableHead>
                <TableHead>トリガー → アクション</TableHead>
                <TableHead className="text-right">実行回数</TableHead>
                <TableHead>最終実行</TableHead>
                <TableHead>有効</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <>
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}>
                        {expandedId === rule.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{triggerLabel(rule.triggerType)}</Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-[#06C755]" />
                        <Badge variant="outline" className="text-xs">{actionLabel(rule.actionType)}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{rule.executionCount ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(rule.lastExecutedAt ? String(rule.lastExecutedAt) : null)}</TableCell>
                    <TableCell><Switch checked={rule.isActive} onCheckedChange={(v) => toggleMut.mutate({ id: rule.id, isActive: v })} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(rule)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("このルールを削除しますか？")) deleteMut.mutate({ id: rule.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === rule.id && (
                    <TableRow key={`${rule.id}-logs`}>
                      <TableCell colSpan={7} className="bg-secondary/30 p-0">
                        <ExecutionLogsSection ruleId={rule.id} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "ルール編集" : "新規自動化ルール"}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div><Label>ルール名 *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: 友だち追加時に挨拶" /></div>

            {/* Trigger */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Zap className="h-4 w-4 text-[#06C755]" /> トリガー (IF)</div>
              <div>
                <Label>トリガータイプ</Label>
                <Select value={form.triggerType} onValueChange={(v) => setForm({ ...form, triggerType: v, triggerConfig: {} })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <TriggerConfigForm triggerType={form.triggerType} config={form.triggerConfig} onChange={updateTriggerConfig} />
            </div>

            {/* Action */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><ArrowRight className="h-4 w-4 text-[#06C755]" /> アクション (THEN)</div>
              <div>
                <Label>アクションタイプ</Label>
                <Select value={form.actionType} onValueChange={(v) => setForm({ ...form, actionType: v, actionConfig: {} })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <ActionConfigForm actionType={form.actionType} config={form.actionConfig} onChange={updateActionConfig} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>{editingId ? "更新" : "作成"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TriggerConfigForm({ triggerType, config, onChange }: { triggerType: string; config: Record<string, string>; onChange: (key: string, value: string) => void }) {
  switch (triggerType) {
    case "keyword_received":
      return (
        <div className="space-y-1">
          <Label>キーワード</Label>
          <Input value={config.keyword ?? ""} onChange={(e) => onChange("keyword", e.target.value)} placeholder="例: 予約" />
          <p className="text-xs text-muted-foreground">友だちのメッセージにこのキーワードが含まれると実行されます</p>
        </div>
      );
    case "tag_added":
    case "tag_removed":
      return (
        <div className="space-y-1">
          <Label>タグ名</Label>
          <Input value={config.tagName ?? ""} onChange={(e) => onChange("tagName", e.target.value)} placeholder="例: VIP" />
          <p className="text-xs text-muted-foreground">{triggerType === "tag_added" ? "このタグが付与されたとき" : "このタグが削除されたとき"}に実行されます</p>
        </div>
      );
    case "score_reached":
      return (
        <div className="space-y-1">
          <Label>スコア閾値</Label>
          <Input type="number" value={config.threshold ?? ""} onChange={(e) => onChange("threshold", e.target.value)} placeholder="例: 100" />
          <p className="text-xs text-muted-foreground">友だちのスコアがこの値以上に達したときに実行されます</p>
        </div>
      );
    case "link_clicked":
      return (
        <div className="space-y-1">
          <Label>リンクID</Label>
          <Input value={config.linkId ?? ""} onChange={(e) => onChange("linkId", e.target.value)} placeholder="計測リンクのID" />
          <p className="text-xs text-muted-foreground">「クリック計測」で作成したリンクのIDを指定します</p>
        </div>
      );
    case "form_submitted":
      return (
        <div className="space-y-1">
          <Label>フォームID</Label>
          <Input value={config.formId ?? ""} onChange={(e) => onChange("formId", e.target.value)} placeholder="フォームのID" />
          <p className="text-xs text-muted-foreground">「LIFFフォーム」で作成したフォームのIDを指定します</p>
        </div>
      );
    case "friend_added":
    default:
      return <p className="text-xs text-muted-foreground">友だち追加時に自動で実行されます。追加設定はありません。</p>;
  }
}

function ActionConfigForm({ actionType, config, onChange }: { actionType: string; config: Record<string, string>; onChange: (key: string, value: string) => void }) {
  switch (actionType) {
    case "send_message":
      return (
        <div className="space-y-1">
          <Label>メッセージ内容</Label>
          <Textarea value={config.message ?? ""} onChange={(e) => onChange("message", e.target.value)} placeholder="送信するメッセージを入力..." rows={3} />
          <p className="text-xs text-muted-foreground">トリガー発動時に友だちへ自動送信されます</p>
        </div>
      );
    case "add_tag":
    case "remove_tag":
      return (
        <div className="space-y-1">
          <Label>タグ名</Label>
          <Input value={config.tagName ?? ""} onChange={(e) => onChange("tagName", e.target.value)} placeholder="例: 購入済み" />
          <p className="text-xs text-muted-foreground">{actionType === "add_tag" ? "友だちにこのタグを自動で付与します" : "友だちからこのタグを自動で削除します"}</p>
        </div>
      );
    case "add_score":
      return (
        <div className="space-y-1">
          <Label>加算スコア</Label>
          <Input type="number" value={config.score ?? ""} onChange={(e) => onChange("score", e.target.value)} placeholder="例: 10" />
          <p className="text-xs text-muted-foreground">友だちのスコアにこの値を加算します（マイナスで減算も可）</p>
        </div>
      );
    case "start_scenario":
      return (
        <div className="space-y-1">
          <Label>シナリオID</Label>
          <Input value={config.scenarioId ?? ""} onChange={(e) => onChange("scenarioId", e.target.value)} placeholder="シナリオのID" />
          <p className="text-xs text-muted-foreground">ステップ配信のシナリオIDを指定します</p>
        </div>
      );
    case "send_rich_menu":
      return (
        <div className="space-y-1">
          <Label>リッチメニューID</Label>
          <Input value={config.richMenuId ?? ""} onChange={(e) => onChange("richMenuId", e.target.value)} placeholder="リッチメニューのID" />
          <p className="text-xs text-muted-foreground">友だちに表示するリッチメニューを切り替えます</p>
        </div>
      );
    default:
      return <p className="text-xs text-muted-foreground">追加設定はありません</p>;
  }
}

function ExecutionLogsSection({ ruleId }: { ruleId: number }) {
  const { data: logs, isLoading } = trpc.automation.logs.useQuery({ ruleId });

  if (isLoading) {
    return <div className="p-6 text-center text-sm text-muted-foreground">読み込み中...</div>;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center text-center">
        <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">実行ログがありません</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-[#06C755]" />
        <span className="text-sm font-medium">実行ログ</span>
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {logs.map((log: any) => (
          <div key={log.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
            <div className="flex items-center gap-3">
              <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                {log.status === "success" ? "成功" : "失敗"}
              </Badge>
              <span className="text-muted-foreground">{log.friendDisplayName ?? `Friend #${log.friendId}`}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(log.executedAt).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
