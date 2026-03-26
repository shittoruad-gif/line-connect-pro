import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
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
import { Plus, Bot, Pencil, Trash2 } from "lucide-react";

type FormData = { keyword: string; matchType: "exact" | "partial"; replyType: "text" | "image" | "template"; replyContent: string; replyImageUrl: string; priority: number };
const emptyForm: FormData = { keyword: "", matchType: "partial", replyType: "text", replyContent: "", replyImageUrl: "", priority: 0 };

export default function AutoRepliesPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: replies, isLoading } = trpc.autoReply.list.useQuery({ clientId: selectedClientId! }, { enabled: !!selectedClientId });
  const createMut = trpc.autoReply.create.useMutation({ onSuccess: () => { utils.autoReply.list.invalidate(); setDialogOpen(false); toast.success("自動応答を作成しました"); } });
  const updateMut = trpc.autoReply.update.useMutation({ onSuccess: () => { utils.autoReply.list.invalidate(); setDialogOpen(false); toast.success("自動応答を更新しました"); } });
  const deleteMut = trpc.autoReply.delete.useMutation({ onSuccess: () => { utils.autoReply.list.invalidate(); toast.success("削除しました"); } });
  const toggleMut = trpc.autoReply.update.useMutation({ onSuccess: () => utils.autoReply.list.invalidate() });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: any) => { setEditingId(r.id); setForm({ keyword: r.keyword, matchType: r.matchType, replyType: r.replyType, replyContent: r.replyContent, replyImageUrl: r.replyImageUrl ?? "", priority: r.priority }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (!form.keyword.trim() || !form.replyContent.trim()) { toast.error("キーワードと返信内容は必須です"); return; }
    if (editingId) updateMut.mutate({ id: editingId, ...form });
    else createMut.mutate({ clientId: selectedClientId!, ...form });
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">自動応答</h1><p className="text-sm text-muted-foreground mt-1">キーワードに基づく自動応答メッセージの管理</p></div>
          <ClientSelector />
        </div>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Bot className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">自動応答</h1><p className="text-sm text-muted-foreground mt-1">キーワードに基づく自動応答メッセージの管理</p></div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> 新規作成</Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : !replies || replies.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Bot className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">自動応答が設定されていません</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>キーワード</TableHead>
                <TableHead>マッチ</TableHead>
                <TableHead>返信内容</TableHead>
                <TableHead>有効</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replies.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.keyword}</TableCell>
                  <TableCell><Badge variant="secondary">{r.matchType === "exact" ? "完全一致" : "部分一致"}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.replyContent}</TableCell>
                  <TableCell><Switch checked={r.isActive} onCheckedChange={(v) => toggleMut.mutate({ id: r.id, isActive: v })} /></TableCell>
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
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "自動応答編集" : "新規自動応答"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>キーワード *</Label><Input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="例: 予約" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>マッチタイプ</Label>
                <Select value={form.matchType} onValueChange={(v) => setForm({ ...form, matchType: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="partial">部分一致</SelectItem><SelectItem value="exact">完全一致</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>優先度</Label>
                <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div><Label>返信内容 *</Label><Textarea value={form.replyContent} onChange={(e) => setForm({ ...form, replyContent: e.target.value })} placeholder="返信メッセージを入力..." rows={4} /></div>
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
