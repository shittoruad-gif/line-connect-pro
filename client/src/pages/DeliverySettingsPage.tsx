import { useState, useEffect } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Settings, Clock, EyeOff, Layers, Save,
} from "lucide-react";

export default function DeliverySettingsPage() {
  const { selectedClientId } = useClient();
  const [form, setForm] = useState({
    deliveryStartHour: 9,
    deliveryEndHour: 21,
    enableStealthMode: false,
    stealthMinDelay: 1,
    stealthMaxDelay: 5,
    batchSize: 100,
    batchInterval: 60,
  });

  const { data: settings, isLoading } = trpc.deliverySettings.get.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const utils = trpc.useUtils();
  const saveMut = trpc.deliverySettings.save.useMutation({
    onSuccess: () => {
      utils.deliverySettings.get.invalidate();
      toast.success("配信設定を保存しました");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        deliveryStartHour: settings.deliveryStartHour ?? 9,
        deliveryEndHour: settings.deliveryEndHour ?? 21,
        enableStealthMode: settings.enableStealthMode ?? false,
        stealthMinDelay: settings.stealthMinDelay ?? 1,
        stealthMaxDelay: settings.stealthMaxDelay ?? 5,
        batchSize: settings.batchSize ?? 100,
        batchInterval: settings.batchInterval ?? 60,
      });
    }
  }, [settings]);

  const handleSave = () => {
    if (!selectedClientId) return;
    saveMut.mutate({ clientId: selectedClientId, ...form });
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">配信設定</h1>
            <p className="text-sm text-muted-foreground mt-1">メッセージ配信の詳細設定</p>
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
          <h1 className="text-2xl font-bold tracking-tight">配信設定</h1>
          <p className="text-sm text-muted-foreground mt-1">メッセージ配信の詳細設定</p>
        </div>
        <ClientSelector />
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : (
        <>
          {/* Time Restriction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                配信時間制限
              </CardTitle>
              <CardDescription>メッセージを配信する時間帯を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">開始時刻: {form.deliveryStartHour}:00</Label>
                  <Slider
                    value={[form.deliveryStartHour]}
                    onValueChange={([v]) => setForm({ ...form, deliveryStartHour: v })}
                    min={0}
                    max={23}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="mb-3 block">終了時刻: {form.deliveryEndHour}:00</Label>
                  <Slider
                    value={[form.deliveryEndHour]}
                    onValueChange={([v]) => setForm({ ...form, deliveryEndHour: v })}
                    min={0}
                    max={23}
                    step={1}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  配信可能時間帯: {form.deliveryStartHour}:00 - {form.deliveryEndHour}:00
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Stealth Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="h-5 w-5" />
                ステルスモード
              </CardTitle>
              <CardDescription>メッセージ間にランダムな遅延を挿入し、自然な配信を実現します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">ステルスモード</p>
                  <p className="text-sm text-muted-foreground">有効にするとランダム遅延が適用されます</p>
                </div>
                <Switch
                  checked={form.enableStealthMode}
                  onCheckedChange={(v) => setForm({ ...form, enableStealthMode: v })}
                />
              </div>

              {form.enableStealthMode && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>最小遅延 (秒)</Label>
                    <Input
                      type="number"
                      value={form.stealthMinDelay}
                      onChange={(e) => setForm({ ...form, stealthMinDelay: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>最大遅延 (秒)</Label>
                    <Input
                      type="number"
                      value={form.stealthMaxDelay}
                      onChange={(e) => setForm({ ...form, stealthMaxDelay: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Batch Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                バッチ配信設定
              </CardTitle>
              <CardDescription>一度に送信するメッセージ数とバッチ間隔を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>バッチサイズ (件)</Label>
                  <Input
                    type="number"
                    value={form.batchSize}
                    onChange={(e) => setForm({ ...form, batchSize: Number(e.target.value) })}
                    min={1}
                    placeholder="例: 100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">1回のバッチで送信するメッセージ数</p>
                </div>
                <div>
                  <Label>バッチ間隔 (秒)</Label>
                  <Input
                    type="number"
                    value={form.batchInterval}
                    onChange={(e) => setForm({ ...form, batchInterval: Number(e.target.value) })}
                    min={1}
                    placeholder="例: 60"
                  />
                  <p className="text-xs text-muted-foreground mt-1">バッチ間の待機時間</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saveMut.isPending}
            className="w-full"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMut.isPending ? "保存中..." : "配信設定を保存"}
          </Button>
        </>
      )}
    </div>
  );
}
