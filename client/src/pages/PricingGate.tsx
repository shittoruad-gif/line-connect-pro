import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Check, ArrowRight, Ticket, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_URL = "https://example.com/payment"; // 決済URL（後で設定変更可）

export default function PricingGate() {
  const [passcode, setPasscode] = useState("");
  const utils = trpc.useUtils();

  const activateMutation = trpc.subscription.activatePasscode.useMutation({
    onSuccess: (data) => {
      toast.success(data.plan === "lifetime" ? "永年無料プランが適用されました！" : "有料プランが適用されました！");
      utils.subscription.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zoom URL 自動発行</span>
          </div>
          <h1 className="text-2xl font-bold">プランの選択</h1>
          <p className="text-muted-foreground text-sm">
            Zoom URL自動発行の全機能を利用するにはプランをご選択ください。
          </p>
        </div>

        {/* Paid Plan Card */}
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">スタンダードプラン</CardTitle>
              <Badge className="bg-primary/10 text-primary border-primary/20">おすすめ</Badge>
            </div>
            <CardDescription>
              <span className="text-3xl font-bold text-foreground">¥980</span>
              <span className="text-muted-foreground"> /月</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {[
                "スクリーンショットOCR（無制限）",
                "Zoom URL自動発行",
                "定期ミーティング一括発行",
                "招待文テンプレート",
                "Googleカレンダー連携",
                "ミーティング履歴管理",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              size="lg"
              onClick={() => window.open(PAYMENT_URL, "_blank")}
            >
              お支払いページへ
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              お支払い完了後、管理者がプランを有効化します。
            </p>
          </CardContent>
        </Card>

        {/* Passcode Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              パスコードをお持ちの方
            </CardTitle>
            <CardDescription>
              パスコードを入力してプランをアクティベートできます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="パスコードを入力"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && passcode.trim()) {
                    activateMutation.mutate({ code: passcode.trim() });
                  }
                }}
              />
              <Button
                onClick={() => activateMutation.mutate({ code: passcode.trim() })}
                disabled={!passcode.trim() || activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
