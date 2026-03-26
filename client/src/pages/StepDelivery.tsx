import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Send, Pencil, Trash2, ChevronRight, Clock, MessageSquare } from "lucide-react";

export default function StepDeliveryPage() {
  const { selectedClientId } = useClient();
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [scenarioDialog, setScenarioDialog] = useState(false);
  const [messageDialog, setMessageDialog] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [scenarioForm, setScenarioForm] = useState({ name: "", description: "", triggerType: "friend_add" as string, triggerKeyword: "" });
  const [messageForm, setMessageForm] = useState({ stepOrder: 1, delayDays: 0, delayHours: 0, messageContent: "" });

  const utils = trpc.useUtils();
  const { data: scenarios, isLoading } = trpc.stepScenario.list.useQuery({ clientId: selectedClientId! }, { enabled: !!selectedClientId });
  const { data: messages } = trpc.stepMessage.list.useQuery({ scenarioId: selectedScenarioId! }, { enabled: !!selectedScenarioId });

  const createScenario = trpc.stepScenario.create.useMutation({ onSuccess: () => { utils.stepScenario.list.invalidate(); setScenarioDialog(false); toast.success("シナリオを作成しました"); } });
  const updateScenario = trpc.stepScenario.update.useMutation({ onSuccess: () => { utils.stepScenario.list.invalidate(); setScenarioDialog(false); toast.success("シナリオを更新しました"); } });
  const deleteScenario = trpc.stepScenario.delete.useMutation({ onSuccess: () => { utils.stepScenario.list.invalidate(); setSelectedScenarioId(null); toast.success("シナリオを削除しました"); } });
  const toggleScenario = trpc.stepScenario.update.useMutation({ onSuccess: () => utils.stepScenario.list.invalidate() });

  const createMessage = trpc.stepMessage.create.useMutation({ onSuccess: () => { utils.stepMessage.list.invalidate(); setMessageDialog(false); toast.success("メッセージを追加しました"); } });
  const updateMessage = trpc.stepMessage.update.useMutation({ onSuccess: () => { utils.stepMessage.list.invalidate(); setMessageDialog(false); toast.success("メッセージを更新しました"); } });
  const deleteMessage = trpc.stepMessage.delete.useMutation({ onSuccess: () => { utils.stepMessage.list.invalidate(); toast.success("メッセージを削除しました"); } });

  const openCreateScenario = () => { setEditingScenarioId(null); setScenarioForm({ name: "", description: "", triggerType: "friend_add", triggerKeyword: "" }); setScenarioDialog(true); };
  const openEditScenario = (s: any) => { setEditingScenarioId(s.id); setScenarioForm({ name: s.name, description: s.description ?? "", triggerType: s.triggerType, triggerKeyword: s.triggerKeyword ?? "" }); setScenarioDialog(true); };
  const openCreateMessage = () => { setEditingMessageId(null); setMessageForm({ stepOrder: (messages?.length ?? 0) + 1, delayDays: 1, delayHours: 0, messageContent: "" }); setMessageDialog(true); };
  const openEditMessage = (m: any) => { setEditingMessageId(m.id); setMessageForm({ stepOrder: m.stepOrder, delayDays: m.delayDays, delayHours: m.delayHours, messageContent: m.messageContent }); setMessageDialog(true); };

  const triggerLabels: Record<string, string> = { friend_add: "友だち追加", keyword: "キーワード", manual: "手動" };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">ステップ配信</h1><p className="text-sm text-muted-foreground mt-1">シナリオベースの自動配信管理</p></div>
          <ClientSelector />
        </div>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Send className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">ステップ配信</h1><p className="text-sm text-muted-foreground mt-1">シナリオベースの自動配信管理</p></div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreateScenario} className="gap-2"><Plus className="h-4 w-4" /> 新規シナリオ</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-1">シナリオ一覧</h2>
          {isLoading ? (
            <Card className="animate-pulse"><CardContent className="h-24" /></Card>
          ) : !scenarios || scenarios.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center text-sm text-muted-foreground">シナリオがありません</CardContent></Card>
          ) : (
            scenarios.map((s) => (
              <Card key={s.id} className={`cursor-pointer transition-colors ${selectedScenarioId === s.id ? "border-primary bg-primary/5" : "hover:border-primary/30"}`} onClick={() => setSelectedScenarioId(s.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{s.name}</p>
                      <Badge variant="secondary" className="text-xs">{triggerLabels[s.triggerType]}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={s.isActive} onCheckedChange={(v) => { toggleScenario.mutate({ id: s.id, isActive: v }); }} onClick={(e) => e.stopPropagation()} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {!selectedScenarioId ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">シナリオを選択してください</p></CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{scenarios?.find(s => s.id === selectedScenarioId)?.name}</CardTitle>
                    <CardDescription>{scenarios?.find(s => s.id === selectedScenarioId)?.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { const s = scenarios?.find(s => s.id === selectedScenarioId); if (s) openEditScenario(s); }}><Pencil className="h-3 w-3 mr-1" /> 編集</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (confirm("削除しますか？")) deleteScenario.mutate({ id: selectedScenarioId }); }}><Trash2 className="h-3 w-3 mr-1" /> 削除</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">ステップメッセージ</h3>
                  <Button size="sm" onClick={openCreateMessage} className="gap-1"><Plus className="h-3 w-3" /> 追加</Button>
                </div>
                {!messages || messages.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">メッセージがありません</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m, i) => (
                      <div key={m.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">{i + 1}</div>
                          {i < messages.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{m.delayDays}日{m.delayHours > 0 ? ` ${m.delayHours}時間` : ""}後</span>
                          </div>
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-sm whitespace-pre-wrap">{m.messageContent}</p>
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Button size="sm" variant="ghost" onClick={() => openEditMessage(m)}><Pencil className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("削除しますか？")) deleteMessage.mutate({ id: m.id }); }}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={scenarioDialog} onOpenChange={setScenarioDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingScenarioId ? "シナリオ編集" : "新規シナリオ"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>シナリオ名 *</Label><Input value={scenarioForm.name} onChange={(e) => setScenarioForm({ ...scenarioForm, name: e.target.value })} placeholder="例: 新規友だちフォロー" /></div>
            <div><Label>説明</Label><Textarea value={scenarioForm.description} onChange={(e) => setScenarioForm({ ...scenarioForm, description: e.target.value })} rows={2} /></div>
            <div>
              <Label>トリガー</Label>
              <Select value={scenarioForm.triggerType} onValueChange={(v) => setScenarioForm({ ...scenarioForm, triggerType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="friend_add">友だち追加</SelectItem><SelectItem value="keyword">キーワード</SelectItem><SelectItem value="manual">手動</SelectItem></SelectContent>
              </Select>
            </div>
            {scenarioForm.triggerType === "keyword" && (
              <div><Label>トリガーキーワード</Label><Input value={scenarioForm.triggerKeyword} onChange={(e) => setScenarioForm({ ...scenarioForm, triggerKeyword: e.target.value })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScenarioDialog(false)}>キャンセル</Button>
            <Button onClick={() => {
              if (!scenarioForm.name.trim()) { toast.error("シナリオ名は必須です"); return; }
              if (editingScenarioId) updateScenario.mutate({ id: editingScenarioId, ...scenarioForm } as any);
              else createScenario.mutate({ clientId: selectedClientId!, ...scenarioForm } as any);
            }}>{editingScenarioId ? "更新" : "作成"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMessageId ? "メッセージ編集" : "メッセージ追加"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label>ステップ順</Label><Input type="number" value={messageForm.stepOrder} onChange={(e) => setMessageForm({ ...messageForm, stepOrder: parseInt(e.target.value) || 1 })} /></div>
              <div><Label>遅延（日）</Label><Input type="number" value={messageForm.delayDays} onChange={(e) => setMessageForm({ ...messageForm, delayDays: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>遅延（時間）</Label><Input type="number" value={messageForm.delayHours} onChange={(e) => setMessageForm({ ...messageForm, delayHours: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>メッセージ内容 *</Label><Textarea value={messageForm.messageContent} onChange={(e) => setMessageForm({ ...messageForm, messageContent: e.target.value })} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialog(false)}>キャンセル</Button>
            <Button onClick={() => {
              if (!messageForm.messageContent.trim()) { toast.error("メッセージは必須です"); return; }
              if (editingMessageId) updateMessage.mutate({ id: editingMessageId, ...messageForm });
              else createMessage.mutate({ scenarioId: selectedScenarioId!, ...messageForm });
            }}>{editingMessageId ? "更新" : "追加"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
