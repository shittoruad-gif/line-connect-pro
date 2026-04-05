import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Bell, Pencil, Trash2, CalendarClock } from "lucide-react";

type FormData = {
  name: string;
  eventDate: string;
  messageContent: string;
  reminderDays: number[];
  targetTags: string;
};

const emptyForm: FormData = {
  name: "",
  eventDate: "",
  messageContent: "",
  reminderDays: [1],
  targetTags: "",
};

const REMINDER_DAY_OPTIONS = [
  { value: 7, label: "7日前" },
  { value: 3, label: "3日前" },
  { value: 1, label: "1日前" },
  { value: 0, label: "当日" },
];

export default function RemindersPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: reminders, isLoading } = trpc.reminders.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const createMut = trpc.reminders.create.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      setDialogOpen(false);
      toast.success("リマインダーを作成しました");
    },
  });
  const updateMut = trpc.reminders.update.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      setDialogOpen(false);
      toast.success("リマインダーを更新しました");
    },
  });
  const deleteMut = trpc.reminders.delete.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      toast.success("削除しました");
    },
  });
  const toggleMut = trpc.reminders.update.useMutation({
    onSuccess: () => utils.reminders.list.invalidate(),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      eventDate: r.eventDate ? new Date(r.eventDate).toISOString().slice(0, 16) : "",
      messageContent: r.messageContent ?? "",
      reminderDays: r.reminderDays ?? [1],
      targetTags: Array.isArray(r.targetTags) ? r.targetTags.join(", ") : r.targetTags ?? "",
    });
    setDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter((d) => d !== day)
        : [...prev.reminderDays, day].sort((a, b) => b - a),
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("リマインダー名は必須です");
      return;
    }
    if (!form.eventDate) {
      toast.error("イベント日時は必須です");
      return;
    }
    if (!form.messageContent.trim()) {
      toast.error("メッセージ内容は必須です");
      return;
    }
    if (form.reminderDays.length === 0) {
      toast.error("配信タイミングを1つ以上選択してください");
      return;
    }

    const payload = {
      name: form.name,
      eventDate: new Date(form.eventDate).toISOString(),
      messageContent: form.messageContent,
      reminderDays: form.reminderDays,
      targetTags: form.targetTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, ...payload });
    } else {
      createMut.mutate({ clientId: selectedClientId!, ...payload });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">リマインダー配信</h1>
            <p className="text-sm text-muted-foreground mt-1">イベント前のリマインダーメッセージ管理</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">リマインダー配信</h1>
          <p className="text-sm text-muted-foreground mt-1">イベント前のリマインダーメッセージ管理</p>
        </div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> 新規作成
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="h-48" />
        </Card>
      ) : !reminders || reminders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">リマインダーが設定されていません</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>リマインダー名</TableHead>
                <TableHead>イベント日時</TableHead>
                <TableHead>配信タイミング</TableHead>
                <TableHead>有効</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(r.eventDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(r.reminderDays ?? []).sort((a: number, b: number) => b - a).map((d: number) => (
                        <Badge key={d} variant="secondary" className="text-xs">
                          {d === 0 ? "当日" : `${d}日前`}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={r.isActive}
                      onCheckedChange={(v) => toggleMut.mutate({ id: r.id, isActive: v })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("削除しますか？")) deleteMut.mutate({ id: r.id });
                        }}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "リマインダー編集" : "新規リマインダー"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>リマインダー名 *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例: セミナー参加リマインド"
              />
            </div>
            <div>
              <Label>イベント日時 *</Label>
              <Input
                type="datetime-local"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
            </div>
            <div>
              <Label>メッセージ内容 *</Label>
              <Textarea
                value={form.messageContent}
                onChange={(e) => setForm({ ...form, messageContent: e.target.value })}
                placeholder="リマインダーメッセージを入力..."
                rows={4}
              />
            </div>
            <div>
              <Label>配信タイミング *</Label>
              <div className="flex gap-3 mt-2">
                {REMINDER_DAY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.reminderDays.includes(opt.value)}
                      onChange={() => toggleDay(opt.value)}
                      className="h-4 w-4 rounded border-border accent-[#06C755]"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>対象タグ</Label>
              <Input
                value={form.targetTags}
                onChange={(e) => setForm({ ...form, targetTags: e.target.value })}
                placeholder="カンマ区切りで入力（例: VIP, 新規）"
              />
              <p className="text-xs text-muted-foreground mt-1">空欄の場合、全ての友だちに配信されます</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editingId ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
