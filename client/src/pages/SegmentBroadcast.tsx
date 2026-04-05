import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClient } from "@/contexts/ClientContext";
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
import { Send, Filter, Variable, CheckCircle, AlertCircle, Users, X } from "lucide-react";

const PERSONALIZATION_VARS = [
  { key: "{{name}}", label: "名前" },
  { key: "{{score}}", label: "スコア" },
  { key: "{{tags}}", label: "タグ" },
];

const STATUS_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "active", label: "有効" },
  { value: "blocked", label: "ブロック" },
  { value: "unfollowed", label: "解除済み" },
];

export default function SegmentBroadcast() {
  const { selectedClientId } = useClient();

  const [message, setMessage] = useState("");
  const [usePersonalization, setUsePersonalization] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [status, setStatus] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const sendMut = trpc.segmentBroadcast.send.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setConfirmOpen(false);
      toast.success(`${data.sent}件の配信が完了しました`);
    },
    onError: (err) => {
      toast.error(err.message || "配信に失敗しました");
      setConfirmOpen(false);
    },
  });

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
  };

  const insertVariable = (varKey: string) => {
    setMessage((prev) => prev + varKey);
  };

  const handleSendClick = () => {
    if (!message.trim()) { toast.error("メッセージを入力してください"); return; }
    setConfirmOpen(true);
  };

  const handleConfirmSend = () => {
    sendMut.mutate({
      clientId: selectedClientId!,
      messageContent: message.trim(),
      usePersonalization,
      filters: {
        tags: tags.length > 0 ? tags : undefined,
        minScore: minScore ? parseInt(minScore) : undefined,
        maxScore: maxScore ? parseInt(maxScore) : undefined,
        status: (status || undefined) as any,
        sourceCode: sourceCode || undefined,
      },
    });
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">セグメント配信</h1>
            <p className="text-sm text-muted-foreground mt-1">条件を指定してターゲット配信</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Send className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">セグメント配信</h1>
          <p className="text-sm text-muted-foreground mt-1">条件を指定してターゲット配信</p>
        </div>
        <ClientSelector />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="h-5 w-5 text-[#06C755]" />
                メッセージ内容
              </CardTitle>
              <CardDescription>配信するメッセージを作成します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>メッセージ本文</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={usePersonalization} onCheckedChange={setUsePersonalization} />
                    <Label className="text-sm text-muted-foreground">変数の差し込み</Label>
                  </div>
                </div>
                {usePersonalization && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                    {"{{name}}"} などの変数をメッセージに入れると、友だちごとに自動で置き換わります。
                  </p>
                )}
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="配信メッセージを入力してください..."
                  className="min-h-[160px] resize-y"
                />
              </div>

              {usePersonalization && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Variable className="h-3.5 w-3.5" />
                    変数を挿入
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PERSONALIZATION_VARS.map((v) => (
                      <Button key={v.key} variant="outline" size="sm" onClick={() => insertVariable(v.key)} className="text-xs gap-1.5">
                        <Variable className="h-3 w-3" />
                        {v.label}を挿入 <span className="text-muted-foreground font-mono">{v.key}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSendClick} className="gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white" disabled={sendMut.isPending}>
                  <Send className="h-4 w-4" />
                  配信する
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className="border-[#06C755]/30 bg-[#06C755]/5">
              <CardContent className="py-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-5 w-5 text-[#06C755]" />
                  <h3 className="font-semibold">配信結果</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#06C755]">{result.sent}</p>
                    <p className="text-xs text-muted-foreground mt-1">成功</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                    <p className="text-xs text-muted-foreground mt-1">失敗</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{result.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">合計</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-[#06C755]" />
                フィルター条件
              </CardTitle>
              <CardDescription>配信対象を絞り込みます</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tags */}
              <div className="space-y-2">
                <Label>タグ</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="タグを入力..."
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTag} className="shrink-0">追加</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Score Range */}
              <div className="space-y-2">
                <Label>スコア範囲</Label>
                <p className="text-xs text-muted-foreground">最小値以上〜最大値以下の友だちが対象</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    placeholder="最小"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground text-sm">〜</span>
                  <Input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    placeholder="最大"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>ステータス</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="すべて" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value || "all"} value={s.value || "all"}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source Code */}
              <div className="space-y-2">
                <Label>流入元コード</Label>
                <Input
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  placeholder="例: campaign_2026"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              配信確認
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">配信対象（フィルター条件に一致する友だち）</p>
              <p className="text-2xl font-bold text-primary mt-1">条件に一致する全員</p>
              <p className="text-xs text-muted-foreground mt-1">※実際の配信数はフィルター条件により異なります</p>
            </div>
            <p className="text-sm text-muted-foreground">以下の条件でメッセージを配信します。よろしいですか？</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">メッセージ</span>
                <span className="max-w-[280px] text-right font-medium break-words">{message.slice(0, 120)}{message.length > 120 ? "..." : ""}</span>
              </div>
              {tags.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">タグ</span>
                  <span className="font-medium">{tags.join(", ")}</span>
                </div>
              )}
              {(minScore || maxScore) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">スコア範囲</span>
                  <span className="font-medium">{minScore || "0"} 〜 {maxScore || "∞"}</span>
                </div>
              )}
              {status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ステータス</span>
                  <span className="font-medium">{STATUS_OPTIONS.find((s) => s.value === status)?.label}</span>
                </div>
              )}
              {sourceCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">流入元</span>
                  <span className="font-medium">{sourceCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">パーソナライゼーション</span>
                <Badge variant={usePersonalization ? "default" : "secondary"}>
                  {usePersonalization ? "ON" : "OFF"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>キャンセル</Button>
            <Button onClick={handleConfirmSend} disabled={sendMut.isPending} className="gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white">
              <Send className="h-4 w-4" />
              {sendMut.isPending ? "配信中..." : "配信実行"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
