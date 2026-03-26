import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Bot, Zap, Trash2, Edit, Play, MessageSquare, BrainCircuit, ArrowRight } from "lucide-react";

export default function ChatbotPage() {
  const { selectedClientId } = useClient();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [aiSystemPrompt, setAiSystemPrompt] = useState("");

  const utils = trpc.useUtils();
  const { data: scenarios, isLoading } = trpc.chatbot.listScenarios.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: stats } = trpc.chatbot.stats.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const createMutation = trpc.chatbot.createScenario.useMutation({
    onSuccess: () => {
      toast.success("シナリオを作成しました");
      utils.chatbot.listScenarios.invalidate();
      utils.chatbot.stats.invalidate();
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error("作成に失敗しました"),
  });

  const deleteMutation = trpc.chatbot.deleteScenario.useMutation({
    onSuccess: () => {
      toast.success("シナリオを削除しました");
      utils.chatbot.listScenarios.invalidate();
      utils.chatbot.stats.invalidate();
    },
    onError: () => toast.error("削除に失敗しました"),
  });

  const toggleMutation = trpc.chatbot.updateScenario.useMutation({
    onSuccess: () => {
      toast.success("ステータスを更新しました");
      utils.chatbot.listScenarios.invalidate();
      utils.chatbot.stats.invalidate();
    },
  });

  function resetForm() {
    setName("");
    setDescription("");
    setTriggerKeyword("");
    setUseAi(false);
    setAiSystemPrompt("");
  }

  if (!selectedClientId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">AIチャットボット</h1>
        <p className="text-muted-foreground">クライアントを選択してください</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            AIチャットボット
          </h1>
          <p className="text-muted-foreground mt-1">
            対話型シナリオを作成し、LINEで自動接客を実現します
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              新規シナリオ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>新規チャットボットシナリオ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>シナリオ名 *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="例: 商品おすすめボット" />
              </div>
              <div className="space-y-2">
                <Label>説明</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="シナリオの概要を入力" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>トリガーキーワード</Label>
                <Input value={triggerKeyword} onChange={e => setTriggerKeyword(e.target.value)} placeholder="例: おすすめ" />
                <p className="text-xs text-muted-foreground">ユーザーがこのキーワードを送信するとシナリオが開始します</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">AI応答を使用</Label>
                  <p className="text-sm text-muted-foreground">AIが文脈に応じた自然な応答を生成します</p>
                </div>
                <Switch checked={useAi} onCheckedChange={setUseAi} />
              </div>
              {useAi && (
                <div className="space-y-2">
                  <Label>AIシステムプロンプト</Label>
                  <Textarea
                    value={aiSystemPrompt}
                    onChange={e => setAiSystemPrompt(e.target.value)}
                    placeholder="例: あなたはパーソナルトレーニングジムの接客スタッフです。お客様のニーズをヒアリングし、最適なコースを提案してください。"
                    rows={4}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">キャンセル</Button>
              </DialogClose>
              <Button
                onClick={() => createMutation.mutate({
                  clientId: selectedClientId,
                  name,
                  description: description || undefined,
                  triggerKeyword: triggerKeyword || undefined,
                  useAi,
                  aiSystemPrompt: aiSystemPrompt || undefined,
                })}
                disabled={!name || createMutation.isPending}
              >
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">シナリオ数</p>
                  <p className="text-2xl font-bold">{stats.totalScenarios}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Zap className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">稼働中</p>
                  <p className="text-2xl font-bold">{stats.activeScenarios}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">会話数</p>
                  <p className="text-2xl font-bold">{stats.totalConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scenario List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
      ) : !scenarios?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">シナリオがありません</h3>
            <p className="text-muted-foreground text-center mb-4">
              「新規シナリオ」ボタンからチャットボットシナリオを作成してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map(scenario => (
            <Card key={scenario.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{scenario.name}</CardTitle>
                    {scenario.description && (
                      <CardDescription className="mt-1 line-clamp-2">{scenario.description}</CardDescription>
                    )}
                  </div>
                  <Switch
                    checked={scenario.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: scenario.id, isActive: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {scenario.useAi && (
                    <Badge variant="secondary" className="gap-1">
                      <BrainCircuit className="h-3 w-3" />
                      AI応答
                    </Badge>
                  )}
                  {scenario.triggerKeyword && (
                    <Badge variant="outline" className="gap-1">
                      <Zap className="h-3 w-3" />
                      {scenario.triggerKeyword}
                    </Badge>
                  )}
                  <Badge variant={scenario.isActive ? "default" : "secondary"}>
                    {scenario.isActive ? "稼働中" : "停止中"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => navigate(`/chatbot/${scenario.id}`)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    編集
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("このシナリオを削除しますか？")) {
                        deleteMutation.mutate({ id: scenario.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
