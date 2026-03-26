import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function PortalLineSettings() {
  const { data: client } = trpc.portal.myClient.useQuery();
  const clientId = client?.id;
  const { data: channel, isLoading } = trpc.lineChannel.get.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  );
  const upsertMutation = trpc.lineChannel.upsert.useMutation({
    onSuccess: () => toast.success("LINE連携設定を保存しました"),
    onError: (err) => toast.error(err.message),
  });

  const [channelName, setChannelName] = useState("");
  const [channelIdVal, setChannelIdVal] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [channelAccessToken, setChannelAccessToken] = useState("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (channel) {
      setChannelName(channel.channelName ?? "");
      setChannelIdVal(channel.channelId ?? "");
      setChannelSecret("");
      setChannelAccessToken(channel.channelAccessToken ?? "");
      setIsActive(channel.isActive);
    }
  }, [channel]);

  if (isLoading || !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = !!channel?.channelId;

  const handleSave = () => {
    const data: any = { clientId, channelName, channelId: channelIdVal, isActive };
    if (channelSecret) data.channelSecret = channelSecret;
    if (channelAccessToken) data.channelAccessToken = channelAccessToken;
    upsertMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LINE連携設定</h1>
        <p className="text-muted-foreground mt-1">LINE Messaging APIの接続情報を設定します</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Messaging API設定</CardTitle>
                <CardDescription>LINE Developersコンソールから取得した情報を入力してください</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" /> 接続済み
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-yellow-500">
                  <AlertCircle className="h-4 w-4" /> 未接続
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>チャネル名</Label>
            <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="LINE公式アカウント名" />
          </div>
          <div className="space-y-2">
            <Label>チャネルID</Label>
            <Input value={channelIdVal} onChange={(e) => setChannelIdVal(e.target.value)} placeholder="1234567890" />
          </div>
          <div className="space-y-2">
            <Label>チャネルシークレット</Label>
            <Input type="password" value={channelSecret} onChange={(e) => setChannelSecret(e.target.value)} placeholder={channel?.channelSecret ? "••••••••（変更する場合のみ入力）" : "チャネルシークレットを入力"} />
          </div>
          <div className="space-y-2">
            <Label>チャネルアクセストークン</Label>
            <Input type="password" value={channelAccessToken} onChange={(e) => setChannelAccessToken(e.target.value)} placeholder="チャネルアクセストークンを入力" />
          </div>

          {channel?.webhookUrl && (
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input value={channel.webhookUrl} readOnly className="bg-muted" />
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(channel.webhookUrl!); toast.success("コピーしました"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">このURLをLINE DevelopersコンソールのWebhook URLに設定してください</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>連携を有効化</Label>
              <p className="text-xs text-muted-foreground">オンにするとWebhookが有効になります</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 保存中...</> : "設定を保存"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
