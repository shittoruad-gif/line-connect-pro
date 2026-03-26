import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, Copy, ExternalLink, Trash2, KeyRound,
  History as HistoryIcon, Loader2, Check, CalendarPlus, Mail,
  Search, Download, RefreshCw,
} from "lucide-react";
import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "created") return <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Zoom作成済み</Badge>;
  if (status === "mock") return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">モック</Badge>;
  return <Badge variant="destructive" className="text-xs">失敗</Badge>;
}

function formatJST(ms: number) {
  return new Date(ms).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ZoomHistory() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [invitationText, setInvitationText] = useState<string | null>(null);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [invitationCopied, setInvitationCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: meetings, isLoading, refetch } = trpc.meetings.list.useQuery();
  const renderInvitationMutation = trpc.invitationTemplates.render.useMutation();
  const deleteMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => { toast.success("削除しました"); refetch(); setDeleteId(null); },
    onError: () => toast.error("削除に失敗しました"),
  });
  const retryMutation = trpc.meetings.retry.useMutation({
    onSuccess: () => { toast.success("Zoomミーティングを再作成しました"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const sorted = meetings ? [...meetings].sort((a, b) => b.scheduledAt - a.scheduledAt) : [];
  const q = searchQuery.toLowerCase();
  const filtered = sorted
    .filter(m => statusFilter === "all" || m.status === statusFilter)
    .filter(m => !q || m.title.toLowerCase().includes(q) || (m.clientName?.toLowerCase().includes(q)));

  const handleAddToCalendar = (meeting: typeof sorted[0]) => {
    const url = buildGoogleCalendarUrl({
      title: meeting.title,
      startMs: meeting.scheduledAt,
      durationMinutes: meeting.duration,
      description: `参加URL: ${meeting.joinUrl}\nパスワード: ${meeting.password}`,
      location: meeting.joinUrl ?? "",
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleGenerateInvitation = async (meeting: typeof sorted[0]) => {
    try {
      const { rendered } = await renderInvitationMutation.mutateAsync({
        title: meeting.title,
        clientName: meeting.title.replace(/様広告.*$/, ""),
        scheduledAt: meeting.scheduledAt,
        duration: meeting.duration,
        joinUrl: meeting.joinUrl ?? "",
        password: meeting.password ?? "",
      });
      setInvitationText(rendered);
      setShowInvitationDialog(true);
    } catch {
      toast.error("招待文の生成に失敗しました");
    }
  };

  const handleExportCsv = () => {
    const headers = ["タイトル", "クライアント名", "予定日時", "時間(分)", "ステータス", "参加URL", "パスワード", "ミーティングID"];
    const rows = filtered.map(m => [
      m.title,
      m.clientName ?? "",
      formatJST(m.scheduledAt),
      String(m.duration),
      m.status === "created" ? "作成済み" : m.status === "mock" ? "モック" : "失敗",
      m.joinUrl ?? "",
      m.password ?? "",
      m.zoomMeetingId ?? "",
    ]);
    const csv = "\uFEFF" + [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zoom-meetings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSVをダウンロードしました");
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <HistoryIcon className="w-6 h-6 text-muted-foreground" />
              ミーティング履歴
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sorted.length > 0
                ? filtered.length === sorted.length
                  ? `${sorted.length}件のミーティング`
                  : `${filtered.length}/${sorted.length}件のミーティング`
                : "まだミーティングがありません"}
            </p>
          </div>
          {sorted.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />CSV
            </Button>
          )}
        </div>

        {/* Search & Filter */}
        {sorted.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="タイトル・クライアント名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="created">作成済み</SelectItem>
                <SelectItem value="mock">モック</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <HistoryIcon className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">履歴がありません</p>
              <p className="text-sm text-muted-foreground mt-1">ミーティングを作成すると、ここに表示されます</p>
              <Button className="mt-6" onClick={() => window.location.href = "/zoom"}>
                最初のミーティングを作成
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">一致するミーティングがありません</p>
            <p className="text-sm text-muted-foreground mt-1">検索条件を変更してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((meeting) => (
              <Card key={meeting.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Title + Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground text-base leading-tight">{meeting.title}</h3>
                        <StatusBadge status={meeting.status} />
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatJST(meeting.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {meeting.duration}分
                        </span>
                      </div>

                      {/* URL */}
                      {meeting.joinUrl && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                          <p className="flex-1 text-xs font-mono text-foreground truncate">{meeting.joinUrl}</p>
                          <CopyButton text={meeting.joinUrl} />
                          <a href={meeting.joinUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </div>
                      )}

                      {/* Password */}
                      {meeting.password && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span className="font-mono tracking-widest text-foreground">{meeting.password}</span>
                          <CopyButton text={meeting.password} />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {(meeting.status === "failed" || meeting.status === "mock") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Zoom URLをリトライ"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => retryMutation.mutate({ id: meeting.id })}
                          disabled={retryMutation.isPending}
                        >
                          {retryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Googleカレンダーに追加"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleAddToCalendar(meeting)}
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="招待文を生成"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleGenerateInvitation(meeting)}
                        disabled={renderInvitationMutation.isPending}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(meeting.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Invitation Dialog */}
      <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-muted-foreground" />
              招待文
            </DialogTitle>
            <DialogDescription>
              コピーしてメールやメッセージに貼り付けてください
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border max-h-80 overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {invitationText}
              </pre>
            </div>
            <div className="flex gap-3 mt-4">
              <Button className="flex-1 gap-2" onClick={async () => {
                if (!invitationText) return;
                await navigator.clipboard.writeText(invitationText);
                setInvitationCopied(true);
                setTimeout(() => setInvitationCopied(false), 2000);
                toast.success("招待文をコピーしました");
              }}>
                {invitationCopied
                  ? <><Check className="w-4 h-4 text-green-400" />コピー済み</>
                  : <><Copy className="w-4 h-4" />招待文をコピー</>}
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/invitation-template"} className="gap-2">
                テンプレートを編集
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>履歴を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は元に戻せません。ミーティング履歴が削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId !== null) deleteMutation.mutate({ id: deleteId }); }}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
