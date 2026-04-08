import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";
import {
  Upload, ImageIcon, Loader2, Sparkles, Copy, Check,
  ExternalLink, Calendar, Clock, KeyRound, Zap, AlertCircle,
  RefreshCw, Mail, CalendarPlus, PenLine
} from "lucide-react";

type OcrResult = {
  groupName: string;
  dateTimeText: string;
  parsedDateTime: string;
  title: string;
  confidence: "high" | "medium" | "low";
  notes: string;
};

type MeetingResult = {
  id: number;
  title: string;
  joinUrl: string;
  startUrl: string;
  password: string;
  scheduledAt: number;
  duration: number;
  status: "created" | "mock" | "failed";
  zoomMeetingId: string;
  clientName: string;
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
  });
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2 text-muted-foreground hover:text-foreground">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span className="ml-1 text-xs">{copied ? "コピー済み" : label}</span>}
    </Button>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const map: Record<string, { label: string; className: string }> = {
    high: { label: "高精度", className: "bg-green-100 text-green-700 border-green-200" },
    medium: { label: "中精度", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    low: { label: "低精度", className: "bg-red-100 text-red-700 border-red-200" },
  };
  const cfg = map[confidence] ?? map.low;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>{cfg.label}</span>;
}

export default function ZoomHome() {
  const [isDragging, setIsDragging] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [meetingResult, setMeetingResult] = useState<MeetingResult | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [editDuration, setEditDuration] = useState(60);
  const [step, setStep] = useState<"upload" | "ocr" | "confirm" | "result">("upload");
  const [mode, setMode] = useState<"screenshot" | "manual">("screenshot");
  const [editClientName, setEditClientName] = useState("");
  const [invitationText, setInvitationText] = useState<string | null>(null);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [invitationCopied, setInvitationCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: appSettings } = trpc.appSettings.get.useQuery();
  const { data: zoomSettingsData } = trpc.zoomSettings.get.useQuery();
  const utils = trpc.useUtils();

  const uploadMutation = trpc.upload.uploadImage.useMutation();
  const ocrMutation = trpc.ocr.analyze.useMutation();
  const createMeetingMutation = trpc.meetings.create.useMutation();
  const renderInvitationMutation = trpc.invitationTemplates.render.useMutation();

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("画像ファイルを選択してください"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setOcrResult(null);
    setMeetingResult(null);
    setStep("ocr");

    try {
      const base64 = await toBase64(file);
      const { url } = await uploadMutation.mutateAsync({ base64, contentType: file.type, filename: file.name });
      setUploadedUrl(url);
      toast.info("スクリーンショットを解析中...");
      const result = await ocrMutation.mutateAsync({ base64, contentType: file.type });
      setOcrResult(result);
      setEditTitle(result.title);
      setEditDuration(appSettings?.defaultDuration ?? 60);
      if (result.parsedDateTime) {
        const d = new Date(result.parsedDateTime);
        if (!isNaN(d.getTime())) {
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          setEditDateTime(local.toISOString().slice(0, 16));
        }
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setMinutes(0, 0, 0);
        const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000);
        setEditDateTime(local.toISOString().slice(0, 16));
      }
      setStep("confirm");
      toast.success("解析完了！内容を確認してください");
    } catch (err: any) {
      toast.error("解析に失敗しました: " + (err?.message ?? "不明なエラー"));
      setStep("upload");
    }
  }, [uploadMutation, ocrMutation, appSettings]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleCreateMeeting = async () => {
    if (!editTitle || !editDateTime) { toast.error("タイトルと日時を入力してください"); return; }
    const scheduledAt = new Date(editDateTime).getTime();
    if (isNaN(scheduledAt)) { toast.error("正しい日時を入力してください"); return; }
    const clientName = ocrResult?.groupName ?? editTitle.replace(appSettings?.titleSuffix ?? "様広告MTG", "");
    try {
      const result = await createMeetingMutation.mutateAsync({
        title: editTitle, clientName, scheduledAt, duration: editDuration,
        screenshotUrl: uploadedUrl ?? undefined,
        rawExtracted: ocrResult ? JSON.stringify(ocrResult) : undefined,
        useMock: !zoomSettingsData?.configured,
      });
      setMeetingResult({ ...result, clientName });
      setStep("result");
      utils.meetings.list.invalidate();
      toast.success("Zoomミーティングを作成しました！");
    } catch (err: any) {
      toast.error("ミーティング作成に失敗しました: " + (err?.message ?? "不明なエラー"));
    }
  };

  const handleGenerateInvitation = async () => {
    if (!meetingResult) return;
    try {
      const { rendered } = await renderInvitationMutation.mutateAsync({
        title: meetingResult.title, clientName: meetingResult.clientName,
        scheduledAt: meetingResult.scheduledAt, duration: meetingResult.duration,
        joinUrl: meetingResult.joinUrl, password: meetingResult.password,
      });
      setInvitationText(rendered);
      setShowInvitationDialog(true);
    } catch { toast.error("招待文の生成に失敗しました"); }
  };

  const handleAddToCalendar = () => {
    if (!meetingResult) return;
    const url = buildGoogleCalendarUrl({
      title: meetingResult.title, startMs: meetingResult.scheduledAt,
      durationMinutes: meetingResult.duration,
      description: `参加URL: ${meetingResult.joinUrl}\nパスワード: ${meetingResult.password}`,
      location: meetingResult.joinUrl,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleManualCreate = async () => {
    if (!editClientName || !editDateTime) { toast.error("クライアント名と日時を入力してください"); return; }
    const scheduledAt = new Date(editDateTime).getTime();
    if (isNaN(scheduledAt)) { toast.error("正しい日時を入力してください"); return; }
    const suffix = appSettings?.titleSuffix ?? "様広告MTG";
    const title = editTitle || `${editClientName}${suffix}`;
    try {
      const result = await createMeetingMutation.mutateAsync({
        title, clientName: editClientName, scheduledAt, duration: editDuration,
        useMock: !zoomSettingsData?.configured,
      });
      setMeetingResult({ ...result, clientName: editClientName });
      setStep("result");
      utils.meetings.list.invalidate();
      toast.success("Zoomミーティングを作成しました！");
    } catch (err: any) {
      toast.error("作成に失敗しました: " + (err?.message ?? "不明なエラー"));
    }
  };

  const handleReset = () => {
    setImageFile(null); setImagePreview(null); setUploadedUrl(null);
    setOcrResult(null); setMeetingResult(null);
    setEditTitle(""); setEditDateTime(""); setEditDuration(60);
    setEditClientName(""); setStep("upload");
  };

  const isLoading = uploadMutation.isPending || ocrMutation.isPending;

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Zoom URL 自動発行</h1>
            <p className="text-sm text-muted-foreground mt-1">LINEスクリーンショットをアップロードして自動でミーティングを作成</p>
          </div>
          {step !== "upload" && (
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />リセット
            </Button>
          )}
        </div>

        {zoomSettingsData && !zoomSettingsData.configured && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">Zoom APIが未設定です。</span>
              <span className="ml-1">モックURLで動作します。</span>
              <button onClick={() => window.location.href = "/zoom-settings"} className="ml-2 underline font-medium hover:no-underline">設定する →</button>
            </div>
          </div>
        )}

        {/* Mode Tabs */}
        {step !== "result" && (
          <Tabs value={mode} onValueChange={(v) => { setMode(v as "screenshot" | "manual"); handleReset(); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="screenshot" className="gap-1.5"><Upload className="w-3.5 h-3.5" />スクショから作成</TabsTrigger>
              <TabsTrigger value="manual" className="gap-1.5"><PenLine className="w-3.5 h-3.5" />手動で作成</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Manual Entry Mode */}
        {mode === "manual" && step !== "result" && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PenLine className="w-4 h-4 text-muted-foreground" />
                ミーティング情報を入力
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="manual-client" className="text-sm font-medium">クライアント名 <span className="text-destructive">*</span></Label>
                <Input id="manual-client" value={editClientName} onChange={(e) => setEditClientName(e.target.value)} placeholder="例: 田中商事" />
                {editClientName && (
                  <p className="text-xs text-muted-foreground">タイトル: <span className="font-medium text-foreground">{editClientName}{appSettings?.titleSuffix ?? "様広告MTG"}</span></p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-title" className="text-sm font-medium">タイトル（カスタム、空欄で自動生成）</Label>
                <Input id="manual-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder={editClientName ? `${editClientName}${appSettings?.titleSuffix ?? "様広告MTG"}` : "自動生成されます"} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="manual-datetime" className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />開始日時 <span className="text-destructive">*</span></Label>
                  <Input id="manual-datetime" type="datetime-local" value={editDateTime} onChange={(e) => setEditDateTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-duration" className="text-sm font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />時間（分）</Label>
                  <Input id="manual-duration" type="number" min={15} max={480} step={15} value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} />
                </div>
              </div>
              <Button className="w-full h-11 text-sm font-semibold gap-2" onClick={handleManualCreate}
                disabled={createMeetingMutation.isPending || !editClientName || !editDateTime}>
                {createMeetingMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />作成中...</>
                  : <><Zap className="w-4 h-4" />Zoomミーティングを作成</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Upload (Screenshot mode) */}
        {mode === "screenshot" && <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
              スクリーンショットをアップロード
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!imagePreview ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
                  ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
                    <Upload className={`w-7 h-7 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">ドラッグ&ドロップ または クリックして選択</p>
                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WEBP 対応</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="relative rounded-xl overflow-hidden border border-border shrink-0 w-32 h-32">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{imageFile?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{imageFile ? (imageFile.size / 1024).toFixed(1) + " KB" : ""}</p>
                  {isLoading && <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /><span>AIが解析中...</span></div>}
                  {ocrResult && <div className="mt-3 flex items-center gap-2"><ConfidenceBadge confidence={ocrResult.confidence} /><span className="text-xs text-muted-foreground">解析完了</span></div>}
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => { setImageFile(null); setImagePreview(null); setStep("upload"); }}>
                    <ImageIcon className="w-3 h-3 mr-1" />別の画像を選択
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>}

        {/* Step 2: Confirm */}
        {mode === "screenshot" && (step === "confirm" || step === "result") && ocrResult && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                <Sparkles className="w-4 h-4 text-amber-500" />
                抽出結果の確認・編集
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-muted/40 text-sm">
                <div><p className="text-xs text-muted-foreground mb-1">グループ名</p><p className="font-medium text-foreground">{ocrResult.groupName || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">抽出された日時</p><p className="font-medium text-foreground">{ocrResult.dateTimeText || "—"}</p></div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm font-medium">ミーティングタイトル</Label>
                  <Input id="title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="〇〇様広告MTG" className="font-medium" disabled={step === "result"} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="datetime" className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />開始日時</Label>
                    <Input id="datetime" type="datetime-local" value={editDateTime} onChange={(e) => setEditDateTime(e.target.value)} disabled={step === "result"} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />時間（分）</Label>
                    <Input id="duration" type="number" min={15} max={480} step={15} value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} disabled={step === "result"} />
                  </div>
                </div>
              </div>
              {step === "confirm" && (
                <Button className="w-full h-11 text-sm font-semibold gap-2" onClick={handleCreateMeeting} disabled={createMeetingMutation.isPending || !editTitle || !editDateTime}>
                  {createMeetingMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />作成中...</> : <><Zap className="w-4 h-4" />Zoomミーティングを作成</>}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Result */}
        {step === "result" && meetingResult && (
          <Card className="overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/50" />
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                Zoomミーティング作成完了
                {meetingResult.status === "mock" && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">モック</Badge>}
                {meetingResult.status === "created" && <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">作成済み</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">ミーティングタイトル</p>
                <p className="font-semibold text-foreground text-lg">{meetingResult.title}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(meetingResult.scheduledAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{meetingResult.duration}分</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">参加URL</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="flex-1 text-sm font-mono text-foreground truncate">{meetingResult.joinUrl}</p>
                  <CopyButton text={meetingResult.joinUrl} />
                  <a href={meetingResult.joinUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground"><ExternalLink className="w-3.5 h-3.5" /></Button>
                  </a>
                </div>
              </div>
              {meetingResult.password && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1"><KeyRound className="w-3 h-3" />パスワード</Label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="flex-1 text-sm font-mono tracking-widest text-foreground">{meetingResult.password}</p>
                    <CopyButton text={meetingResult.password} />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>ミーティングID: <span className="font-mono">{meetingResult.zoomMeetingId}</span></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="gap-2 text-xs sm:text-sm" onClick={() => {
                  const text = `【${meetingResult.title}】\n日時: ${new Date(meetingResult.scheduledAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}\n参加URL: ${meetingResult.joinUrl}\nパスワード: ${meetingResult.password}`;
                  navigator.clipboard.writeText(text); toast.success("ミーティング情報をコピーしました");
                }}><Copy className="w-4 h-4 shrink-0" />全情報をコピー</Button>
                <Button variant="outline" className="gap-2 text-xs sm:text-sm" onClick={handleGenerateInvitation} disabled={renderInvitationMutation.isPending}>
                  {renderInvitationMutation.isPending ? <><Loader2 className="w-4 h-4 shrink-0 animate-spin" />生成中...</> : <><Mail className="w-4 h-4 shrink-0" />招待文を生成</>}
                </Button>
                <Button variant="outline" className="gap-2 text-xs sm:text-sm" onClick={handleAddToCalendar}><CalendarPlus className="w-4 h-4 shrink-0" />Googleカレンダーに追加</Button>
                <Button className="gap-2 text-xs sm:text-sm" onClick={handleReset}><Zap className="w-4 h-4 shrink-0" />新しく発行する</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invitation Dialog */}
      <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-muted-foreground" />招待文</DialogTitle>
            <DialogDescription>コピーしてメールやメッセージに貼り付けてください</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border max-h-80 overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{invitationText}</pre>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button className="flex-1 gap-2 text-sm" onClick={async () => {
                if (!invitationText) return;
                await navigator.clipboard.writeText(invitationText);
                setInvitationCopied(true); setTimeout(() => setInvitationCopied(false), 2000);
                toast.success("招待文をコピーしました");
              }}>
                {invitationCopied ? <><Check className="w-4 h-4 text-green-400" />コピー済み</> : <><Copy className="w-4 h-4" />招待文をコピー</>}
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/invitation-template"} className="gap-2 text-sm">テンプレートを編集</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
