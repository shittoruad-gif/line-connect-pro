import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Menu, Trash2, Pencil, Image } from "lucide-react";

export default function RichMenusPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", imageUrl: "", menuSize: "large" as "large" | "small" });

  const utils = trpc.useUtils();
  const { data: menus, isLoading } = trpc.richMenu.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const createMut = trpc.richMenu.create.useMutation({
    onSuccess: () => { utils.richMenu.list.invalidate(); setDialogOpen(false); toast.success("リッチメニューを作成しました"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.richMenu.update.useMutation({
    onSuccess: () => { utils.richMenu.list.invalidate(); setDialogOpen(false); toast.success("リッチメニューを更新しました"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.richMenu.delete.useMutation({
    onSuccess: () => { utils.richMenu.list.invalidate(); toast.success("リッチメニューを削除しました"); },
  });
  const toggleMut = trpc.richMenu.update.useMutation({
    onSuccess: () => utils.richMenu.list.invalidate(),
  });

  const openCreate = () => { setEditingId(null); setForm({ name: "", imageUrl: "", menuSize: "large" }); setDialogOpen(true); };
  const openEdit = (m: any) => { setEditingId(m.id); setForm({ name: m.name, imageUrl: m.imageUrl ?? "", menuSize: m.menuSize }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("メニュー名は必須です"); return; }
    if (editingId) {
      updateMut.mutate({ id: editingId, ...form });
    } else {
      createMut.mutate({ clientId: selectedClientId!, ...form });
    }
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">リッチメニュー</h1><p className="text-sm text-muted-foreground mt-1">LINE公式アカウントのリッチメニュー管理</p></div>
          <ClientSelector />
        </div>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Menu className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">リッチメニュー</h1><p className="text-sm text-muted-foreground mt-1">LINE公式アカウントのリッチメニュー管理</p></div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> 新規作成</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1, 2].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-48" /></Card>)}</div>
      ) : !menus || menus.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Image className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">リッチメニューがありません</p><p className="text-sm text-muted-foreground/70 mt-1">「新規作成」ボタンから追加してください</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {menus.map((menu) => (
            <Card key={menu.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{menu.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">サイズ: {menu.menuSize === "large" ? "大" : "小"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={menu.isActive ? "default" : "secondary"}>{menu.isActive ? "有効" : "無効"}</Badge>
                    <Switch checked={menu.isActive} onCheckedChange={(v) => toggleMut.mutate({ id: menu.id, isActive: v })} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {menu.imageUrl ? (
                  <div className="rounded-lg overflow-hidden bg-secondary/50 mb-3">
                    <img src={menu.imageUrl} alt={menu.name} className="w-full h-32 object-cover" />
                  </div>
                ) : (
                  <div className="rounded-lg bg-secondary/50 h-32 flex items-center justify-center mb-3">
                    <Image className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(menu)}><Pencil className="h-3 w-3 mr-1" /> 編集</Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("削除しますか？")) deleteMut.mutate({ id: menu.id }); }}><Trash2 className="h-3 w-3 mr-1" /> 削除</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "リッチメニュー編集" : "新規リッチメニュー"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>メニュー名 *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: メインメニュー" /></div>
            <div><Label>画像URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></div>
            <div>
              <Label>サイズ</Label>
              <Select value={form.menuSize} onValueChange={(v) => setForm({ ...form, menuSize: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="large">大 (2500x1686)</SelectItem>
                  <SelectItem value="small">小 (2500x843)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.imageUrl && (
              <div className="rounded-lg overflow-hidden bg-secondary/50"><img src={form.imageUrl} alt="Preview" className="w-full h-40 object-cover" /></div>
            )}
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
