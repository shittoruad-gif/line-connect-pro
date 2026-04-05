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
import {
  Settings, Eye, EyeOff, Copy, CheckCircle2, AlertCircle,
  ExternalLink, ChevronRight, ChevronDown, CircleDot,
} from "lucide-react";

const STEPS = [
  {
    num: 1,
    title: "LINE Developersにログイン",
    description: "LINE Developersコンソールにアクセスし、LINEアカウントでログインします。",
    link: "https://developers.line.biz/console/",
    linkLabel: "LINE Developersを開く",
    fields: [],
  },
  {
    num: 2,
    title: "Messaging APIチャネルを作成",
    description: "プロバイダーを選択（または新規作成）し、「Messaging API」チャネルを作成します。既にチャネルがある場合はそのまま次へ進んでください。",
    tip: "プロバイダー名は会社名やサービス名、チャネル名はLINE公式アカウントの名前を入力します。",
    fields: [],
  },
  {
    num: 3,
    title: "チャネル情報を入力",
    description: "チャネルの「Basic settings」タブから以下の情報をコピーして入力してください。",
    tip: "チャネルIDとチャネルシークレットは「Basic settings」タブにあります。",
    fields: ["channelName", "channelId", "channelSecret"],
  },
  {
    num: 4,
    title: "チャネルアクセストークンを発行",
    description: "チャネルの「Messaging API」タブの一番下にある「Channel access token」セクションで「Issue」ボタンを押してトークンを発行し、コピーして入力してください。",
    tip: "トークンは長い文字列です。「Issue」ボタンを押すと自動生成されます。",
    fields: ["channelAccessToken"],
  },
  {
    num: 5,
    title: "Webhook URLを設定",
    description: "下記のWebhook URLをコピーし、LINE Developersの「Messaging API」タブ → 「Webhook settings」の「Webhook URL」に貼り付けて「Update」を押してください。その後「Use webhook」をオンにしてください。",
    tip: "Webhook URLを設定することで、友だち追加やメッセージ受信のイベントがこのアプリに届くようになります。",
    fields: ["webhookUrl"],
  },
];

export default function LineSettingsPage() {
  const { selectedClientId } = useClient();
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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

  // Auto-generate webhook URL
  const webhookUrl = selectedClientId
    ? `${window.location.origin}/api/webhook/line/${selectedClientId}`
    : "";

  useEffect(() => {
    if (channel) {
      setForm({
        channelName: channel.channelName ?? "",
        channelId: channel.channelId ?? "",
        channelSecret: "",
        channelAccessToken: "",
        webhookUrl: webhookUrl,
        isActive: channel.isActive,
      });
      // If already configured, show all steps as complete
      if (channel.channelId && channel.channelAccessToken) {
        setCurrentStep(6); // all done
      }
    } else {
      setForm({ channelName: "", channelId: "", channelSecret: "", channelAccessToken: "", webhookUrl: webhookUrl, isActive: false });
    }
  }, [channel, webhookUrl]);

  const handleSave = () => {
    if (!selectedClientId) return;
    const data: any = {
      clientId: selectedClientId,
      channelName: form.channelName,
      channelId: form.channelId,
      webhookUrl: webhookUrl,
      isActive: form.isActive,
    };
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
            <p className="text-sm text-muted-foreground mt-1">LINE公式アカウントとの連携を設定します</p>
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

  const isConfigured = channel?.channelId && channel?.channelAccessToken;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LINE連携設定</h1>
          <p className="text-sm text-muted-foreground mt-1">LINE公式アカウントとの連携を設定します</p>
        </div>
        <ClientSelector />
      </div>

      {/* Connection Status */}
      <Card className={isConfigured ? "border-primary/30 bg-primary/5" : "border-orange-500/30 bg-orange-500/5"}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              <div>
                <p className="font-medium">
                  {isConfigured ? "LINE連携済み" : "LINE未連携"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isConfigured
                    ? `${channel.channelName || "チャネル"} と連携中`
                    : "下記の手順に沿って連携を完了してください"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConfigured && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {form.isActive ? "有効" : "無効"}
                  </span>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => {
                      setForm({ ...form, isActive: v });
                      // Auto-save active status
                      if (selectedClientId) {
                        upsertMutation.mutate({
                          clientId: selectedClientId,
                          channelName: form.channelName,
                          channelId: form.channelId,
                          webhookUrl: webhookUrl,
                          isActive: v,
                        });
                      }
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>連携手順</CardTitle>
          <CardDescription>
            LINE Developers でMessaging APIチャネルを作成し、以下の情報を入力してください。
            初めての方は順番に進めてください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {STEPS.map((step) => {
            const isOpen = currentStep === step.num || currentStep > 5;
            const isComplete = isConfigured
              ? true
              : step.num < currentStep;

            return (
              <div
                key={step.num}
                className={`rounded-lg border transition-all ${
                  isOpen
                    ? "border-primary/30 bg-primary/5"
                    : isComplete
                    ? "border-primary/20 bg-primary/[0.02]"
                    : "border-border"
                }`}
              >
                {/* Step Header */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left"
                  onClick={() => setCurrentStep(isOpen && currentStep <= 5 ? 0 : step.num)}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isComplete
                        ? "bg-primary text-primary-foreground"
                        : isOpen
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isOpen ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Step Content */}
                {isOpen && (
                  <div className="px-4 pb-4 pl-14 space-y-4">
                    <p className="text-sm text-muted-foreground">{step.description}</p>

                    {step.tip && (
                      <div className="flex gap-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
                        <CircleDot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                        <span>{step.tip}</span>
                      </div>
                    )}

                    {step.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(step.link, "_blank")}
                      >
                        {step.linkLabel}
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    )}

                    {/* Form fields for this step */}
                    {step.fields.includes("channelName") && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">チャネル名（管理用）</Label>
                          <Input
                            value={form.channelName}
                            onChange={(e) => setForm({ ...form, channelName: e.target.value })}
                            placeholder="例: 〇〇公式アカウント"
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">このアプリ内での表示名です。自由に設定できます。</p>
                        </div>
                        <div>
                          <Label className="text-xs">チャネルID</Label>
                          <Input
                            value={form.channelId}
                            onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                            placeholder="例: 1234567890"
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Basic settings → 「Channel ID」に表示される数字です。
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">チャネルシークレット</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showSecret ? "text" : "password"}
                              value={form.channelSecret}
                              onChange={(e) => setForm({ ...form, channelSecret: e.target.value })}
                              placeholder={channel?.channelSecret ? "変更する場合のみ入力" : "Basic settings → Channel secret"}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowSecret(!showSecret)}
                            >
                              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Basic settings → 「Channel secret」の値です。Webhookの署名検証に使用します。
                          </p>
                        </div>
                      </div>
                    )}

                    {step.fields.includes("channelAccessToken") && (
                      <div>
                        <Label className="text-xs">チャネルアクセストークン（長期）</Label>
                        <div className="relative mt-1">
                          <Input
                            type={showToken ? "text" : "password"}
                            value={form.channelAccessToken}
                            onChange={(e) => setForm({ ...form, channelAccessToken: e.target.value })}
                            placeholder={channel?.channelAccessToken ? "変更する場合のみ入力" : "Messaging API → Channel access token"}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowToken(!showToken)}
                          >
                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Messaging API タブの最下部「Channel access token」で「Issue」を押して取得します。
                        </p>
                      </div>
                    )}

                    {step.fields.includes("webhookUrl") && (
                      <div>
                        <Label className="text-xs">Webhook URL（自動生成）</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={webhookUrl}
                            readOnly
                            className="flex-1 bg-muted/50 font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(webhookUrl);
                              toast.success("Webhook URLをコピーしました");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          このURLをLINE Developersの「Webhook URL」欄に貼り付けてください。
                          「Use webhook」を必ずオンにしてください。
                        </p>
                      </div>
                    )}

                    {/* Next button within step */}
                    {step.num < 5 && currentStep <= 5 && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => setCurrentStep(step.num + 1)}
                      >
                        次へ <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Save Button */}
          <div className="pt-4">
            <Button onClick={handleSave} disabled={upsertMutation.isPending} className="w-full" size="lg">
              {upsertMutation.isPending ? "保存中..." : "設定を保存して連携を完了"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              すべての情報を入力したら「保存」を押してください。保存後、連携が有効になります。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
