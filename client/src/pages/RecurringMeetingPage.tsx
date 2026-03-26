import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw, Plus, Trash2, CalendarPlus, Copy, Check,
  ChevronDown, ChevronUp, Loader2, ExternalLink, Calendar,
  Pencil, PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const RECURRENCE_LABELS: Record<string, string> = {
  weekly: "毎週",
  biweekly: "隔週",
  monthly: "毎月",
};

type GroupType = {
  id: number;
  title: string;
  clientName: string;
  recurrenceType: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  occurrences: number;
  firstDate: number;
  totalCreated: number;
  createdAt: Date;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "created") return <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">発行済み</Badge>;
  if (status === "mock") return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">モック</Badge>;
  return <Badge variant="destructive" className="text-xs">失敗</Badge>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        toast.success("コピーしました");
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

/** 最初の開始日時(UTC ms)を計算: 指定した曜日の次の日付 + 時刻 */
function calcFirstDate(dayOfWeek: number, startTime: string): number {
  const [hh, mm] = startTime.split(":").map(Number);
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayDow = jstNow.getUTCDay();
  let daysAhead = dayOfWeek - todayDow;
  if (daysAhead <= 0) daysAhead += 7;
  const target = new Date(jstNow);
  target.setUTCDate(target.getUTCDate() + daysAhead);
  target.setUTCHours(hh - 9, mm, 0, 0);
  return target.getTime();
}

function formatJST(ms: number): string {
  return new Date(ms).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PreviewDates({
  recurrenceType,
  dayOfWeek,
  startTime,
  occurrences,
}: {
  recurrenceType: string;
  dayOfWeek: number;
  startTime: string;
  occurrences: number;
}) {
  const dates = useMemo(() => {
    if (!startTime.match(/^\d{2}:\d{2}$/)) return [];
    const result: number[] = [];
    let current = calcFirstDate(dayOfWeek, startTime);
    for (let i = 0; i < Math.min(occurrences, 12); i++) {
      result.push(current);
      if (recurrenceType === "weekly") current += 7 * 24 * 60 * 60 * 1000;
      else if (recurrenceType === "biweekly") current += 14 * 24 * 60 * 60 * 1000;
      else {
        const d = new Date(current);
        d.setMonth(d.getMonth() + 1);
        current = d.getTime();
      }
    }
    return result;
  }, [recurrenceType, dayOfWeek, startTime, occurrences]);

  if (dates.length === 0) return null;
  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">発行予定日時プレビュー</p>
      <div className="grid grid-cols-2 gap-1">
        {dates.map((d, i) => (
          <p key={i} className="text-xs text-foreground">
            {i + 1}. {formatJST(d)}
          </p>
        ))}
      </div>
    </div>
  );
}

// ---- Edit Dialog ----
function EditDialog({
  group,
  open,
  onClose,
  onUpdated,
}: {
  group: GroupType;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "biweekly" | "monthly">(
    group.recurrenceType as any
  );
  const [dayOfWeek, setDayOfWeek] = useState(group.dayOfWeek);
  const [startTime, setStartTime] = useState(group.startTime);
  const [duration, setDuration] = useState(group.duration);
  const [occurrences, setOccurrences] = useState(group.occurrences);

  const updateMutation = trpc.recurringMeetings.update.useMutation({
    onSuccess: () => {
      toast.success("設定を更新しました");
      onUpdated();
      onClose();
    },
    onError: () => toast.error("更新に失敗しました"),
  });

  const handleSave = () => {
    if (!startTime.match(/^\d{2}:\d{2}$/)) {
      toast.error("時刻の形式が正しくありません（例: 10:00）");
      return;
    }
    updateMutation.mutate({
      id: group.id,
      recurrenceType,
      dayOfWeek,
      startTime,
      duration,
      occurrences,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-muted-foreground" />
            定期ミーティングを編集
          </DialogTitle>
          <DialogDescription className="truncate">
            {group.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>繰り返し</Label>
              <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">毎週</SelectItem>
                  <SelectItem value="biweekly">隔週</SelectItem>
                  <SelectItem value="monthly">毎月</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>曜日</Label>
              <Select value={String(dayOfWeek)} onValueChange={v => setDayOfWeek(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}曜日</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-startTime">開始時刻</Label>
              <Input
                id="edit-startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>時間（分）</Label>
              <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90, 120].map(d => (
                    <SelectItem key={d} value={String(d)}>{d}分</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-occurrences">
              合計回数: <span className="text-foreground font-semibold">{occurrences}回</span>
              {occurrences > group.occurrences && (
                <span className="ml-2 text-xs text-emerald-600 font-medium">
                  （+{occurrences - group.occurrences}回 追加発行）
                </span>
              )}
            </Label>
            <input
              id="edit-occurrences"
              type="range"
              min={group.occurrences}
              max={group.occurrences + 24}
              value={occurrences}
              onChange={e => setOccurrences(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>現在: {group.occurrences}回</span>
              <span>最大: {group.occurrences + 24}回</span>
            </div>
          </div>

          <PreviewDates
            recurrenceType={recurrenceType}
            dayOfWeek={dayOfWeek}
            startTime={startTime}
            occurrences={Math.min(occurrences, 12)}
          />

          <div className="flex gap-3 pt-1">
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</>
                : <><Check className="w-4 h-4" />設定を保存</>}
            </Button>
            <Button variant="outline" onClick={onClose}>キャンセル</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Add Occurrences Dialog ----
function AddOccurrencesDialog({
  group,
  open,
  onClose,
  onAdded,
}: {
  group: GroupType;
  open: boolean;
  onClose: () => void;
  onAdded: (result: { added: number; meetings: any[] }) => void;
}) {
  const [additional, setAdditional] = useState(4);

  const addMutation = trpc.recurringMeetings.addOccurrences.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.added}回分のURLを追加発行しました`);
      onAdded(data);
      onClose();
    },
    onError: () => toast.error("追加発行に失敗しました"),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-muted-foreground" />
            URLを追加発行
          </DialogTitle>
          <DialogDescription className="truncate">
            {group.title} — 最後の回から続けて発行します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="add-occ">
              追加回数: <span className="text-foreground font-semibold">{additional}回</span>
            </Label>
            <input
              id="add-occ"
              type="range"
              min={1}
              max={24}
              value={additional}
              onChange={e => setAdditional(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1回</span>
              <span>24回</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border text-sm text-muted-foreground">
            現在 <span className="text-foreground font-medium">{group.occurrences}回</span> →
            追加後 <span className="text-foreground font-medium">{group.occurrences + additional}回</span>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={() => addMutation.mutate({ id: group.id, additionalOccurrences: additional })}
              disabled={addMutation.isPending}
            >
              {addMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />発行中...</>
                : <><PlusCircle className="w-4 h-4" />{additional}回分を追加発行</>}
            </Button>
            <Button variant="outline" onClick={onClose}>キャンセル</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Group Card ----
function RecurringGroupCard({
  group,
  onDelete,
  onRefetch,
}: {
  group: GroupType;
  onDelete: (id: number) => void;
  onRefetch: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addResult, setAddResult] = useState<{ added: number; meetings: any[] } | null>(null);

  const { data: meetings, refetch: refetchMeetings } = trpc.recurringMeetings.getMeetings.useQuery(
    { recurringId: group.id },
    { enabled: expanded }
  );

  const handleAdded = (result: { added: number; meetings: any[] }) => {
    setAddResult(result);
    refetchMeetings();
    onRefetch();
  };

  return (
    <>
      <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">{group.title}</h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  {RECURRENCE_LABELS[group.recurrenceType]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                毎{DAY_NAMES[group.dayOfWeek]}曜 {group.startTime} ·{" "}
                {group.duration}分 · 計{group.occurrences}回
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                初回: {formatJST(group.firstDate)}
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              {/* 編集ボタン */}
              <Button
                variant="ghost"
                size="sm"
                title="設定を編集"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowEdit(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              {/* 追加発行ボタン */}
              <Button
                variant="ghost"
                size="sm"
                title="URLを追加発行"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
                onClick={() => setShowAdd(true)}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
              {/* 削除ボタン */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(group.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {/* 展開ボタン */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              {!meetings ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : meetings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">ミーティングがありません</p>
              ) : (
                [...meetings].sort((a, b) => a.scheduledAt - b.scheduledAt).map((m, i) => {
                  const calUrl = buildGoogleCalendarUrl({
                    title: m.title,
                    startMs: m.scheduledAt,
                    durationMinutes: m.duration,
                    description: `参加URL: ${m.joinUrl}\nパスワード: ${m.password}`,
                    location: m.joinUrl ?? "",
                  });
                  return (
                    <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                      <span className="text-muted-foreground w-5 text-xs shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{formatJST(m.scheduledAt)}</p>
                        {m.joinUrl && (
                          <p className="text-xs text-muted-foreground truncate">{m.joinUrl}</p>
                        )}
                      </div>
                      <StatusBadge status={m.status} />
                      {m.joinUrl && <CopyBtn text={m.joinUrl} />}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                        title="Googleカレンダーに追加"
                        onClick={() => window.open(calUrl, "_blank", "noopener,noreferrer")}
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </Button>
                      {m.joinUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          title="Zoomを開く"
                          onClick={() => window.open(m.joinUrl!, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {showEdit && (
        <EditDialog
          group={group}
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onUpdated={onRefetch}
        />
      )}

      {/* Add Occurrences Dialog */}
      {showAdd && (
        <AddOccurrencesDialog
          group={group}
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}

      {/* Add Result Dialog */}
      {addResult && (
        <Dialog open={!!addResult} onOpenChange={() => setAddResult(null)}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                追加発行完了
              </DialogTitle>
              <DialogDescription>
                {addResult.added}回分のZoom URLを追加しました
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {addResult.meetings.map((m, i) => {
                const calUrl = buildGoogleCalendarUrl({
                  title: m.title,
                  startMs: m.scheduledAt,
                  durationMinutes: m.duration,
                  description: `参加URL: ${m.joinUrl}\nパスワード: ${m.password}`,
                  location: m.joinUrl,
                });
                return (
                  <div key={m.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">
                        {i + 1}回目 — {formatJST(m.scheduledAt)}
                      </p>
                      <StatusBadge status={m.status} />
                    </div>
                    {m.joinUrl && (
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground truncate flex-1">{m.joinUrl}</p>
                        <CopyBtn text={m.joinUrl} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Googleカレンダーに追加"
                          onClick={() => window.open(calUrl, "_blank", "noopener,noreferrer")}
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    {m.password && (
                      <p className="text-xs text-muted-foreground">
                        パスワード: <span className="text-foreground font-mono">{m.password}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <Button className="w-full mt-2" onClick={() => setAddResult(null)}>閉じる</Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ---- Main Page ----
export default function RecurringMeetingPage() {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [clientName, setClientName] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [occurrences, setOccurrences] = useState(4);

  const [createResult, setCreateResult] = useState<{
    recurringId: number;
    title: string;
    totalCreated: number;
    meetings: Array<{
      id: number;
      title: string;
      scheduledAt: number;
      duration: number;
      joinUrl: string;
      password: string;
      status: string;
      zoomMeetingId: string;
    }>;
  } | null>(null);

  const { data: groups, isLoading, refetch } = trpc.recurringMeetings.list.useQuery();
  const createMutation = trpc.recurringMeetings.create.useMutation({
    onSuccess: (data) => {
      setCreateResult(data);
      setShowForm(false);
      setClientName("");
      refetch();
    },
    onError: () => toast.error("定期ミーティングの作成に失敗しました"),
  });
  const deleteMutation = trpc.recurringMeetings.delete.useMutation({
    onSuccess: () => {
      toast.success("削除しました");
      refetch();
      setDeleteId(null);
    },
    onError: () => toast.error("削除に失敗しました"),
  });

  const handleCreate = () => {
    if (!clientName.trim()) {
      toast.error("クライアント名を入力してください");
      return;
    }
    if (!startTime.match(/^\d{2}:\d{2}$/)) {
      toast.error("時刻の形式が正しくありません（例: 10:00）");
      return;
    }
    const firstDate = calcFirstDate(dayOfWeek, startTime);
    createMutation.mutate({
      clientName: clientName.trim(),
      recurrenceType,
      dayOfWeek,
      startTime,
      duration,
      occurrences,
      firstDate,
    });
  };

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">定期ミーティング</h1>
            <p className="text-sm text-muted-foreground mt-1">
              毎週・隔週・毎月の繰り返しZoom URLを一括発行・編集
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            新規作成
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                定期ミーティング設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="clientName">クライアント名 <span className="text-destructive">*</span></Label>
                <Input
                  id="clientName"
                  placeholder="例: 田中商事"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
                {clientName && (
                  <p className="text-xs text-muted-foreground">
                    タイトル: <span className="text-foreground font-medium">{clientName}様広告MTG</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>繰り返し</Label>
                  <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">毎週</SelectItem>
                      <SelectItem value="biweekly">隔週</SelectItem>
                      <SelectItem value="monthly">毎月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>曜日</Label>
                  <Select value={String(dayOfWeek)} onValueChange={v => setDayOfWeek(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map((d, i) => (
                        <SelectItem key={i} value={String(i)}>{d}曜日</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="startTime">開始時刻</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>時間（分）</Label>
                  <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[30, 45, 60, 90, 120].map(d => (
                        <SelectItem key={d} value={String(d)}>{d}分</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="occurrences">
                  一括発行回数: <span className="text-foreground font-semibold">{occurrences}回</span>
                </Label>
                <input
                  id="occurrences"
                  type="range"
                  min={1}
                  max={24}
                  value={occurrences}
                  onChange={e => setOccurrences(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1回</span>
                  <span>24回</span>
                </div>
              </div>

              <PreviewDates
                recurrenceType={recurrenceType}
                dayOfWeek={dayOfWeek}
                startTime={startTime}
                occurrences={occurrences}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" />発行中...</>
                    : <><RefreshCw className="w-4 h-4" />{occurrences}回分を一括発行</>}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>キャンセル</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Groups List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !groups || groups.length === 0 ? (
          <Card className="border border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">定期ミーティングがありません</p>
              <p className="text-sm text-muted-foreground mt-1">
                「新規作成」から毎週・隔週・毎月の繰り返しZoom URLを一括発行できます
              </p>
              <Button className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" />
                最初の定期ミーティングを作成
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground px-1">
              <Pencil className="w-3 h-3 inline mr-1" />編集 ·
              <PlusCircle className="w-3 h-3 inline mx-1" />追加発行 ·
              <Trash2 className="w-3 h-3 inline mx-1" />削除 ·
              <ChevronDown className="w-3 h-3 inline mx-1" />URL一覧
            </p>
            {[...groups].sort((a, b) => b.firstDate - a.firstDate).map(g => (
              <RecurringGroupCard key={g.id} group={g} onDelete={setDeleteId} onRefetch={refetch} />
            ))}
          </div>
        )}
      </div>

      {/* Create Result Dialog */}
      {createResult && (
        <Dialog open={!!createResult} onOpenChange={() => setCreateResult(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                一括発行完了
              </DialogTitle>
              <DialogDescription>
                <span className="font-semibold text-foreground">{createResult.title}</span> を
                {createResult.totalCreated}回分発行しました
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {createResult.meetings.map((m, i) => {
                const calUrl = buildGoogleCalendarUrl({
                  title: m.title,
                  startMs: m.scheduledAt,
                  durationMinutes: m.duration,
                  description: `参加URL: ${m.joinUrl}\nパスワード: ${m.password}`,
                  location: m.joinUrl,
                });
                return (
                  <div key={m.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">
                        {i + 1}回目 — {formatJST(m.scheduledAt)}
                      </p>
                      <StatusBadge status={m.status} />
                    </div>
                    {m.joinUrl && (
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground truncate flex-1">{m.joinUrl}</p>
                        <CopyBtn text={m.joinUrl} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Googleカレンダーに追加"
                          onClick={() => window.open(calUrl, "_blank", "noopener,noreferrer")}
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    {m.password && (
                      <p className="text-xs text-muted-foreground">
                        パスワード: <span className="text-foreground font-mono">{m.password}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <Button className="w-full mt-2" onClick={() => setCreateResult(null)}>閉じる</Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>定期ミーティングを削除しますか？</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
