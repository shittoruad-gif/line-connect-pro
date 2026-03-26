import { useState, useEffect } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MessageCircle, Smartphone } from "lucide-react";

export default function GreetingPage() {
  const { selectedClientId } = useClient();
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: greeting } = trpc.greeting.get.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const utils = trpc.useUtils();
  const upsertMut = trpc.greeting.upsert.useMutation({
    onSuccess: () => { utils.greeting.get.invalidate(); toast.success("あいさつメッセージを保存しました"); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (greeting) {
      setContent(greeting.messageContent);
      setIsActive(greeting.isActive);
    } else {
      setContent("");
      setIsActive(true);
    }
  }, [greeting]);

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">あいさつメッセージ</h1><p className="text-sm text-muted-foreground mt-1">友だち追加時の自動メッセージ</p></div>
          <ClientSelector />
        </div>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">あいさつメッセージ</h1><p className="text-sm text-muted-foreground mt-1">友だち追加時の自動メッセージ</p></div>
        <ClientSelector />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>メッセージ設定</CardTitle>
                <CardDescription>友だち追加時に自動送信されるメッセージを設定します</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{isActive ? "有効" : "無効"}</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="友だち追加ありがとうございます！&#10;&#10;こちらのアカウントでは、最新情報やお得なクーポンをお届けします。&#10;&#10;メニューからお気軽にお問い合わせください。" rows={8} />
            <Button onClick={() => { if (!content.trim()) { toast.error("メッセージを入力してください"); return; } upsertMut.mutate({ clientId: selectedClientId!, messageContent: content, isActive }); }} disabled={upsertMut.isPending} className="w-full">
              {upsertMut.isPending ? "保存中..." : "保存"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> プレビュー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#7494C0] rounded-2xl p-4 max-w-[320px] mx-auto min-h-[400px]">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{content || "メッセージが入力されていません"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
