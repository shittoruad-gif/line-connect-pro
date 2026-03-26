import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Video, Loader2, CheckCircle2, ExternalLink, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ZoomSettingsPage() {
  const [accountId, setAccountId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading, refetch } = trpc.zoomSettings.get.useQuery();
  const saveMutation = trpc.zoomSettings.save.useMutation({
    onSuccess: () => {
      toast.success("Zoom API設定を保存しました");
      setIsDirty(false);
      refetch();
    },
    onError: (err) => toast.error("保存に失敗しました: " + err.message),
  });

  useEffect(() => {
    if (data) {
      setAccountId(data.accountId);
      setClientId(data.clientId);
      // clientSecretはマスクされているので空にする
      setClientSecret("");
    }
  }, [data]);

  const handleSave = () => {
    if (!accountId || !clientId || !clientSecret) {
      toast.error("すべての項目を入力してください");
      return;
    }
    saveMutation.mutate({ accountId, clientId, clientSecret });
  };

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setIsDirty(true);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Video className="w-6 h-6 text-muted-foreground" />
            Zoom API 設定
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Server-to-Server OAuth アプリの認証情報を設定してください
          </p>
        </div>

        {/* Status */}
        {!isLoading && data && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            data.configured
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            {data.configured ? (
              <><CheckCircle2 className="w-4 h-4 shrink-0" /><span className="text-sm font-medium">Zoom APIが設定済みです。実際のZoomミーティングを作成できます。</span></>
            ) : (
              <><Video className="w-4 h-4 shrink-0" /><span className="text-sm font-medium">未設定です。設定するとZoomミーティングを自動作成できます。</span></>
            )}
          </div>
        )}

        {/* How to get credentials */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              認証情報の取得方法
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ol className="list-decimal list-inside space-y-1.5">
              <li><a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Zoom Marketplace <ExternalLink className="w-3 h-3" /></a> にアクセス</li>
              <li>「Develop」→「Build App」→「Server-to-Server OAuth」を選択</li>
              <li>アプリ名を入力して作成</li>
              <li>「App Credentials」から Account ID / Client ID / Client Secret をコピー</li>
              <li>「Scopes」で <code className="bg-muted px-1 rounded text-xs">meeting:write:admin</code> を追加</li>
              <li>アプリを「Activate」する</li>
            </ol>
          </CardContent>
        </Card>

        {/* Settings Form */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">認証情報</CardTitle>
            <CardDescription>Zoom Server-to-Server OAuth アプリの情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="accountId" className="text-sm font-medium">Account ID</Label>
                  <Input
                    id="accountId"
                    value={accountId}
                    onChange={handleChange(setAccountId)}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="clientId" className="text-sm font-medium">Client ID</Label>
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={handleChange(setClientId)}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="clientSecret" className="text-sm font-medium">Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="clientSecret"
                      type={showSecret ? "text" : "password"}
                      value={clientSecret}
                      onChange={handleChange(setClientSecret)}
                      placeholder={data?.configured ? "変更する場合は新しい値を入力" : "xxxxxxxxxxxxxxxxxxxxxxxx"}
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {data?.configured && (
                    <p className="text-xs text-muted-foreground">現在の値は保護されています。変更する場合のみ入力してください。</p>
                  )}
                </div>

                <Button
                  className="w-full h-10 font-semibold gap-2"
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !isDirty}
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />保存中...</>
                  ) : (
                    "設定を保存"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
