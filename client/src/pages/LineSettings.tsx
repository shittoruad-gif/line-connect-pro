import { useState, useEffect } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Eye, EyeOff, Copy, CheckCircle2, AlertCircle } from "lucide-react";

export default function LineSettingsPage() {
  const { selectedClientId } = useClient();
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState({ channelName: "", channelId: "", channelSecret: "", channelAccessToken: "", webhookUrl: "", isActive: false });

  const { data: channel, isLoading } = trpc.lineChannel.get.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const utils = trpc.useUtils();
  const upsertMutation = trpc.lineChannel.upsert.useMutation({
    onSuccess: () => { utils.lineChannel.get.invalidate(); toast.success("LINE連携設定を保存しました"); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (channel) {
      setForm({
        channelName: channel.channelName ?? "",
        channelId: channel.channelId ?? "",
        channelSecret: "",
        channelAccessToken: "",
        webhookUrl: channel.webhookUrl ?? "",
        isActive: channel.isActive,
      });
    } else {
      setForm({ channelName: "", channelId: "", channelSecret: "", channelAccessToken: "", webhookUrl: "", isActive: false });
    }
  }, [channel]);

  const handleSave = () => {
    if (!selectedClientId) return;
    const data: any = { clientId: selectedClientId, channelName: form.channelName, channelId: form.channelId, webhookUrl: form.webhookUrl, isActive: form.isActive };
    if (form.channelSecret) data.channelSecret = form.channelSecret;
    if (form.channelAccessToken) data.channelAccessToken = form.channelAccessToken;
    upsertMutation.mutate(data);
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LINE連携設定</h1>
            <p className="text-sm text-muted-foreground mt-1">Messaging APIのチャネル設定</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">LINE連携設定</h1>
          <p className="text-sm text-muted-foreground mt-1">Messaging APIのチャネル設定</p>
        </div>
        <ClientSelector />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            チャネル設定
          </CardTitle>
          <CardDescription>LINE Developersコンソールから取得した情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">連携ステータス</p>
              <p className="text-sm text-muted-foreground">Messaging APIとの接続状態</p>
            </div>
            <div className="flex items-center gap-3">
              {form.isActive ? (
                <span className="flex items-center gap-1.5 text-sm text-primary"><CheckCircle2 className="h-4 w-4" /> 有効</span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><AlertCircle className="h-4 w-4" /> 無効</span>
              )}
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label>チャネル名</Label>
              <Input value={form.channelName} onChange={(e) => setForm({ ...form, channelName: e.target.value })} placeholder="例: My LINE Bot" />
            </div>
            <div>
              <Label>チャネルID</Label>
              <Input value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} placeholder="例: 1234567890" />
            </div>
            <div>
              <Label>チャネルシークレット</Label>
              <div className="relative">
                <Input type={showSecret ? "text" : "password"} value={form.channelSecret} onChange={(e) => setForm({ ...form, channelSecret: e.target.value })} placeholder={channel?.channelSecret ? "変更する場合のみ入力" : "チャネルシークレットを入力"} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>チャネルアクセストークン</Label>
              <div className="relative">
                <Input type={showToken ? "text" : "password"} value={form.channelAccessToken} onChange={(e) => setForm({ ...form, channelAccessToken: e.target.value })} placeholder={channel?.channelAccessToken ? "変更する場合のみ入力" : "アクセストークンを入力"} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowToken(!showToken)}>
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} placeholder="https://example.com/webhook" className="flex-1" />
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(form.webhookUrl); toast.success("コピーしました"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={upsertMutation.isPending} className="w-full">
            {upsertMutation.isPending ? "保存中..." : "設定を保存"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
