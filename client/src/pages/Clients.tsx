import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useClient } from "@/contexts/ClientContext";
import { industryLabels } from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Building2, Pencil, Trash2 } from "lucide-react";
import InviteClientDialog from "@/components/InviteClientDialog";

const statusLabels: Record<string, string> = {
  active: "有効",
  inactive: "無効",
  trial: "トライアル",
};

const statusColors: Record<string, string> = {
  active: "bg-primary/20 text-primary",
  inactive: "bg-muted text-muted-foreground",
  trial: "bg-chart-4/20 text-chart-4",
};

type FormData = {
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  notes: string;
};

const emptyForm: FormData = {
  name: "", industry: "other", contactName: "", contactEmail: "", contactPhone: "", status: "trial", notes: "",
};

export default function ClientsPage() {
  const { user } = useAuth();
  const { setSelectedClientId } = useClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: clients, isLoading } = trpc.clients.list.useQuery({ search: search || undefined });
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); setDialogOpen(false); toast.success("クライアントを作成しました"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); setDialogOpen(false); toast.success("クライアントを更新しました"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); toast.success("クライアントを削除しました"); },
    onError: (e) => toast.error(e.message),
  });

  const isAdmin = user?.role === "admin";

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ name: c.name, industry: c.industry, contactName: c.contactName ?? "", contactEmail: c.contactEmail ?? "", contactPhone: c.contactPhone ?? "", status: c.status, notes: c.notes ?? "" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("クライアント名は必須です"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form } as any);
    } else {
      createMutation.mutate(form as any);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">クライアント管理</h1>
          <p className="text-sm text-muted-foreground mt-1">登録されたクライアント企業の管理</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> 新規クライアント
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="クライアント名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>
          ))}
        </div>
      ) : !clients || clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">クライアントが登録されていません</p>
            {isAdmin && <p className="text-sm text-muted-foreground/70 mt-1">「新規クライアント」ボタンから追加してください</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="hover:border-primary/30 transition-colors cursor-pointer group" onClick={() => setSelectedClientId(client.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{industryLabels[client.industry] ?? client.industry}</p>
                  </div>
                  <Badge className={statusColors[client.status] ?? ""} variant="secondary">
                    {statusLabels[client.status] ?? client.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {client.contactName && <p>担当: {client.contactName}</p>}
                  {client.contactEmail && <p>{client.contactEmail}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openEdit(client); }}>
                      <Pencil className="h-3 w-3 mr-1" /> 編集
                    </Button>
                    <InviteClientDialog clientId={client.id} clientName={client.name} />
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("このクライアントを削除しますか？")) deleteMutation.mutate({ id: client.id });
                    }}>
                      <Trash2 className="h-3 w-3 mr-1" /> 削除
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "クライアント編集" : "新規クライアント"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>クライアント名 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: ABC パーソナルジム" />
            </div>
            <div>
              <Label>業種</Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(industryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>担当者名</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div>
                <Label>ステータス</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>メールアドレス</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <Label>電話番号</Label>
              <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
