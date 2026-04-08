import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Sliders, Loader2, Clock, KeyRound, Type } from "lucide-react";

const DURATION_PRESETS = [30, 45, 60, 90, 120];

export default function AppSettingsPage() {
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [autoPassword, setAutoPassword] = useState(true);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [titleSuffix, setTitleSuffix] = useState("様広告MTG");
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading, refetch } = trpc.appSettings.get.useQuery();
  const saveMutation = trpc.appSettings.save.useMutation({
    onSuccess: () => {
      toast.success("設定を保存しました");
      setIsDirty(false);
      refetch();
    },
    onError: (err) => toast.error("保存に失敗しました: " + err.message),
  });

  useEffect(() => {
    if (data) {
      setDefaultDuration(data.defaultDuration);
      setAutoPassword(data.autoPassword);
      setDefaultPassword(data.defaultPassword ?? "");
      setTitleSuffix(data.titleSuffix);
    }
  }, [data]);

  const handleSave = () => {
    if (!titleSuffix) {
      toast.error("タイトルの接尾辞を入力してください");
      return;
    }
    if (!autoPassword && !defaultPassword) {
      toast.error("固定パスワードを使用する場合は入力してください");
      return;
    }
    saveMutation.mutate({ defaultDuration, autoPassword, defaultPassword, titleSuffix });
  };

  const mark = () => setIsDirty(true);

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-muted-foreground" />
            デフォルト設定
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ミーティング作成時のデフォルト値をカスタマイズできます
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Title Format */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  タイトル形式
                </CardTitle>
                <CardDescription>グループ名の後ろに付ける文字列を設定します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="titleSuffix" className="text-sm font-medium">接尾辞</Label>
                  <Input
                    id="titleSuffix"
                    value={titleSuffix}
                    onChange={(e) => { setTitleSuffix(e.target.value); mark(); }}
                    placeholder="様広告MTG"
                  />
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
                  <p className="text-muted-foreground text-xs mb-1">プレビュー</p>
                  <p className="font-medium text-foreground">田中商事<span className="text-primary">{titleSuffix || "様広告MTG"}</span></p>
                </div>
              </CardContent>
            </Card>

            {/* Duration */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  デフォルトミーティング時間
                </CardTitle>
                <CardDescription>新しいミーティング作成時のデフォルト時間</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Presets */}
                <div className="flex gap-2 flex-wrap">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDefaultDuration(d); mark(); }}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors
                        ${defaultDuration === d
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                    >
                      {d}分
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-sm font-medium">カスタム（分）</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={defaultDuration}
                    onChange={(e) => { setDefaultDuration(Number(e.target.value)); mark(); }}
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  パスワード設定
                </CardTitle>
                <CardDescription>ミーティングパスワードの生成方法</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">パスワードを自動生成</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ミーティングごとにランダムなパスワードを生成します</p>
                  </div>
                  <Switch
                    checked={autoPassword}
                    onCheckedChange={(v) => { setAutoPassword(v); mark(); }}
                  />
                </div>

                {!autoPassword && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium">固定パスワード</Label>
                    <Input
                      id="password"
                      value={defaultPassword}
                      onChange={(e) => { setDefaultPassword(e.target.value); mark(); }}
                      placeholder="固定パスワードを入力"
                      maxLength={128}
                    />
                    <p className="text-xs text-muted-foreground">すべてのミーティングで同じパスワードを使用します</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save */}
            <Button
              className="w-full h-11 font-semibold gap-2"
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
      </div>
    </>
  );
}
