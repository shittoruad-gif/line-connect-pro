import { useState, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, CalendarDays, Pencil, Trash2, Clock, Settings2 } from "lucide-react";

type BookingForm = {
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  notes: string;
};

type SettingsForm = {
  availableDays: number[];
  availableStartTime: string;
  availableEndTime: string;
  slotDuration: number;
  bufferTime: number;
  maxAdvanceDays: number;
};

const emptyBookingForm: BookingForm = {
  title: "",
  description: "",
  scheduledAt: "",
  duration: 60,
  notes: "",
};

const defaultSettings: SettingsForm = {
  availableDays: [1, 2, 3, 4, 5],
  availableStartTime: "09:00",
  availableEndTime: "18:00",
  slotDuration: 60,
  bufferTime: 10,
  maxAdvanceDays: 30,
};

const DAY_OPTIONS = [
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
  { value: 0, label: "日" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: string; className: string }> = {
  confirmed: { label: "確定", variant: "default", className: "bg-[#06C755] hover:bg-[#06C755]/80 text-white" },
  pending: { label: "保留", variant: "default", className: "bg-yellow-500 hover:bg-yellow-500/80 text-white" },
  cancelled: { label: "キャンセル", variant: "default", className: "bg-red-500 hover:bg-red-500/80 text-white" },
  completed: { label: "完了", variant: "default", className: "bg-gray-500 hover:bg-gray-500/80 text-white" },
};

const DURATION_OPTIONS = [
  { value: 30, label: "30分" },
  { value: 60, label: "60分" },
  { value: 90, label: "90分" },
  { value: 120, label: "120分" },
];

export default function BookingsPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyBookingForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SettingsForm>(defaultSettings);

  const utils = trpc.useUtils();
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: savedSettings } = trpc.bookings.settings.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  useEffect(() => {
    if (savedSettings) {
      setSettings({
        availableDays: (savedSettings.availableDays as number[] | null) ?? defaultSettings.availableDays,
        availableStartTime: savedSettings.availableStartTime ?? defaultSettings.availableStartTime,
        availableEndTime: savedSettings.availableEndTime ?? defaultSettings.availableEndTime,
        slotDuration: savedSettings.slotDuration ?? defaultSettings.slotDuration,
        bufferTime: savedSettings.bufferTime ?? defaultSettings.bufferTime,
        maxAdvanceDays: savedSettings.maxAdvanceDays ?? defaultSettings.maxAdvanceDays,
      });
    }
  }, [savedSettings]);

  const createMut = trpc.bookings.create.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      setDialogOpen(false);
      toast.success("予約を作成しました");
    },
  });
  const updateMut = trpc.bookings.update.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      setDialogOpen(false);
      toast.success("予約を更新しました");
    },
  });
  const deleteMut = trpc.bookings.delete.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      setDeleteConfirmId(null);
      toast.success("予約を削除しました");
    },
  });
  const statusMut = trpc.bookings.update.useMutation({
    onSuccess: () => {
      utils.bookings.list.invalidate();
      toast.success("ステータスを変更しました");
    },
  });
  const saveSettingsMut = trpc.bookings.saveSettings.useMutation({
    onSuccess: () => {
      utils.bookings.settings.invalidate();
      toast.success("予約設定を保存しました");
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyBookingForm);
    setDialogOpen(true);
  };

  const openEdit = (b: any) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      description: b.description ?? "",
      scheduledAt: b.scheduledAt ? new Date(b.scheduledAt).toISOString().slice(0, 16) : "",
      duration: b.duration ?? 60,
      notes: b.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("タイトルは必須です");
      return;
    }
    if (!form.scheduledAt) {
      toast.error("予約日時は必須です");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      duration: form.duration,
      notes: form.notes,
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, ...payload });
    } else {
      createMut.mutate({ clientId: selectedClientId!, ...payload });
    }
  };

  const toggleAvailableDay = (day: number) => {
    setSettings((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day].sort((a, b) => a - b),
    }));
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
            <h1 className="text-2xl font-bold tracking-tight">予約管理</h1>
            <p className="text-sm text-muted-foreground mt-1">予約の作成・管理・設定</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">予約管理</h1>
          <p className="text-sm text-muted-foreground mt-1">予約の作成・管理・設定</p>
        </div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="gap-2">
            <Settings2 className="h-4 w-4" /> 設定
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> 新規予約
          </Button>
        </div>
      </div>

      {/* Booking Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5" /> 予約設定
            </CardTitle>
            <CardDescription>予約受付の基本設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>受付可能曜日</Label>
              <div className="flex gap-3 mt-2">
                {DAY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.availableDays.includes(opt.value)}
                      onChange={() => toggleAvailableDay(opt.value)}
                      className="h-4 w-4 rounded border-border accent-[#06C755]"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>開始時間</Label>
                <Input
                  type="time"
                  value={settings.availableStartTime}
                  onChange={(e) => setSettings({ ...settings, availableStartTime: e.target.value })}
                />
              </div>
              <div>
                <Label>終了時間</Label>
                <Input
                  type="time"
                  value={settings.availableEndTime}
                  onChange={(e) => setSettings({ ...settings, availableEndTime: e.target.value })}
                />
              </div>
              <div>
                <Label>枠の長さ（分）</Label>
                <Select
                  value={String(settings.slotDuration)}
                  onValueChange={(v) => setSettings({ ...settings, slotDuration: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30分</SelectItem>
                    <SelectItem value="60">60分</SelectItem>
                    <SelectItem value="90">90分</SelectItem>
                    <SelectItem value="120">120分</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>バッファ（分）</Label>
                <Input
                  type="number"
                  value={settings.bufferTime}
                  onChange={(e) => setSettings({ ...settings, bufferTime: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            <div className="max-w-xs">
              <Label>最大予約可能日数</Label>
              <Input
                type="number"
                value={settings.maxAdvanceDays}
                onChange={(e) => setSettings({ ...settings, maxAdvanceDays: parseInt(e.target.value) || 30 })}
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">今日から何日先まで予約を受け付けるか</p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => saveSettingsMut.mutate({ clientId: selectedClientId!, ...settings })}
                disabled={saveSettingsMut.isPending}
              >
                設定を保存
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="h-48" />
        </Card>
      ) : !bookings || bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">予約がありません</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タイトル</TableHead>
                <TableHead>予約日時</TableHead>
                <TableHead>所要時間</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b: any) => {
                const statusInfo = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(b.scheduledAt)}
                      </div>
                    </TableCell>
                    <TableCell>{b.duration}分</TableCell>
                    <TableCell>
                      <Select
                        value={b.status}
                        onValueChange={(v) => statusMut.mutate({ id: b.id, status: v as "pending" | "confirmed" | "cancelled" | "completed" })}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <Badge className={cfg.className}>{cfg.label}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteConfirmId(b.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "予約編集" : "新規予約"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>タイトル *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="例: カウンセリング予約"
              />
            </div>
            <div>
              <Label>説明</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="予約の説明（任意）"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>予約日時 *</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
              <div>
                <Label>所要時間</Label>
                <Select
                  value={String(form.duration)}
                  onValueChange={(v) => setForm({ ...form, duration: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>メモ</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="備考を入力..."
                rows={3}
              />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>予約を削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">この操作は取り消せません。予約データは完全に削除されます。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) deleteMut.mutate({ id: deleteConfirmId });
              }}
              disabled={deleteMut.isPending}
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
