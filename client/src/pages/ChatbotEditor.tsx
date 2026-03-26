import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Plus, Trash2, Save, Play, MessageSquare, BrainCircuit,
  MousePointer, GitBranch, Zap, Send, Bot, User, Loader2, GripVertical,
  ChevronRight, Settings2, X,
} from "lucide-react";

type Choice = { label: string; value: string; nextNodeId?: number | null };
type NodeFormData = {
  nodeType: "message" | "choices" | "ai_response" | "condition" | "action";
  label: string;
  messageContent: string;
  choices: Choice[];
  nextNodeId?: number | null;
  sortOrder: number;
};

const NODE_TYPE_CONFIG = {
  message: { icon: MessageSquare, label: "メッセージ", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  choices: { icon: MousePointer, label: "選択肢", color: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  ai_response: { icon: BrainCircuit, label: "AI応答", color: "bg-green-500/10 text-green-500 border-green-500/30" },
  condition: { icon: GitBranch, label: "条件分岐", color: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
  action: { icon: Zap, label: "アクション", color: "bg-red-500/10 text-red-500 border-red-500/30" },
};

// LINE Chat Preview Component
function ChatPreview({ nodes, scenarioId }: { nodes: any[]; scenarioId: number }) {
  const [messages, setMessages] = useState<{ role: "bot" | "user"; content: string; choices?: Choice[] }[]>([]);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const aiChatMutation = trpc.chatbot.aiChat.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function startPreview() {
    setMessages([]);
    setCurrentNodeIndex(0);
    setConversationHistory([]);
    if (nodes.length > 0) {
      processNode(nodes[0], 0);
    }
  }

  function processNode(node: any, index: number) {
    if (!node) return;
    if (node.nodeType === "message") {
      setMessages(prev => [...prev, { role: "bot", content: node.messageContent || node.label }]);
      // Auto-advance to next node after a delay
      const nextIdx = node.nextNodeId
        ? nodes.findIndex((n: any) => n.id === node.nextNodeId)
        : index + 1;
      if (nextIdx >= 0 && nextIdx < nodes.length) {
        setTimeout(() => processNode(nodes[nextIdx], nextIdx), 800);
      }
      setCurrentNodeIndex(nextIdx >= 0 ? nextIdx : index + 1);
    } else if (node.nodeType === "choices") {
      setMessages(prev => [
        ...prev,
        { role: "bot", content: node.messageContent || node.label, choices: node.choices || [] },
      ]);
      setCurrentNodeIndex(index);
    } else if (node.nodeType === "ai_response") {
      setMessages(prev => [...prev, { role: "bot", content: node.messageContent || "AIが応答を生成します。メッセージを入力してください。" }]);
      setCurrentNodeIndex(index);
    }
  }

  function handleChoiceSelect(choice: Choice) {
    setMessages(prev => [...prev, { role: "user", content: choice.label }]);
    const nextIdx = choice.nextNodeId
      ? nodes.findIndex((n: any) => n.id === choice.nextNodeId)
      : currentNodeIndex + 1;
    if (nextIdx >= 0 && nextIdx < nodes.length) {
      setTimeout(() => processNode(nodes[nextIdx], nextIdx), 500);
    } else {
      setMessages(prev => [...prev, { role: "bot", content: "ありがとうございます。ご案内は以上です。" }]);
    }
  }

  async function handleSendMessage() {
    if (!userInput.trim()) return;
    const msg = userInput.trim();
    setUserInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);

    const currentNode = nodes[currentNodeIndex];
    if (currentNode?.nodeType === "ai_response") {
      setIsAiLoading(true);
      const newHistory = [...conversationHistory, { role: "user" as const, content: msg }];
      try {
        const result = await aiChatMutation.mutateAsync({
          scenarioId,
          userMessage: msg,
          conversationHistory: newHistory,
        });
        const aiMsg = typeof result.message === 'string' ? result.message : String(result.message);
        setMessages(prev => [...prev, { role: "bot", content: aiMsg }]);
        setConversationHistory([...newHistory, { role: "assistant" as const, content: aiMsg }]);
      } catch {
        setMessages(prev => [...prev, { role: "bot", content: "エラーが発生しました。もう一度お試しください。" }]);
      }
      setIsAiLoading(false);
    } else {
      // Move to next node
      const nextIdx = currentNodeIndex + 1;
      if (nextIdx < nodes.length) {
        setTimeout(() => processNode(nodes[nextIdx], nextIdx), 500);
      }
    }
  }

  const lastMessage = messages[messages.length - 1];
  const showChoices = lastMessage?.role === "bot" && lastMessage?.choices?.length;
  const showInput = !showChoices && messages.length > 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            チャットプレビュー
          </CardTitle>
          <Button variant="outline" size="sm" onClick={startPreview} className="gap-1">
            <Play className="h-3.5 w-3.5" />
            {messages.length > 0 ? "リセット" : "開始"}
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <div className="flex-1 flex flex-col min-h-0">
        {/* LINE-style chat area */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ background: "linear-gradient(180deg, oklch(0.25 0.01 260) 0%, oklch(0.22 0.01 260) 100%)" }}
          ref={scrollRef}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">「開始」ボタンでプレビューを開始</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#06C755] text-white rounded-br-md"
                          : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.choices && msg.choices.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.choices.map((choice: Choice, ci: number) => (
                          <button
                            key={ci}
                            onClick={() => handleChoiceSelect(choice)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
                          >
                            {choice.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-[#06C755]/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-[#06C755]" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isAiLoading && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Input area */}
        {showInput && (
          <div className="flex-shrink-0 border-t p-3">
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="メッセージを入力..."
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                disabled={isAiLoading}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={isAiLoading || !userInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Main Editor Page
export default function ChatbotEditorPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = Number(params.id);
  const [, navigate] = useLocation();
  const { selectedClientId } = useClient();

  const [showAddNode, setShowAddNode] = useState(false);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [nodeForm, setNodeForm] = useState<NodeFormData>({
    nodeType: "message",
    label: "",
    messageContent: "",
    choices: [],
    sortOrder: 0,
  });

  const utils = trpc.useUtils();
  const { data: scenario } = trpc.chatbot.getScenario.useQuery({ id: scenarioId });
  const { data: nodes, isLoading: nodesLoading } = trpc.chatbot.listNodes.useQuery({ scenarioId });

  const createNodeMutation = trpc.chatbot.createNode.useMutation({
    onSuccess: () => {
      toast.success("ノードを追加しました");
      utils.chatbot.listNodes.invalidate();
      setShowAddNode(false);
      resetNodeForm();
    },
    onError: () => toast.error("追加に失敗しました"),
  });

  const updateNodeMutation = trpc.chatbot.updateNode.useMutation({
    onSuccess: () => {
      toast.success("ノードを更新しました");
      utils.chatbot.listNodes.invalidate();
      setEditingNode(null);
      resetNodeForm();
    },
    onError: () => toast.error("更新に失敗しました"),
  });

  const deleteNodeMutation = trpc.chatbot.deleteNode.useMutation({
    onSuccess: () => {
      toast.success("ノードを削除しました");
      utils.chatbot.listNodes.invalidate();
    },
    onError: () => toast.error("削除に失敗しました"),
  });

  function resetNodeForm() {
    setNodeForm({ nodeType: "message", label: "", messageContent: "", choices: [], sortOrder: 0 });
  }

  function openEditNode(node: any) {
    setEditingNode(node);
    setNodeForm({
      nodeType: node.nodeType,
      label: node.label,
      messageContent: node.messageContent || "",
      choices: node.choices || [],
      nextNodeId: node.nextNodeId,
      sortOrder: node.sortOrder,
    });
  }

  function addChoice() {
    setNodeForm(prev => ({
      ...prev,
      choices: [...prev.choices, { label: "", value: "" }],
    }));
  }

  function updateChoice(index: number, field: keyof Choice, value: string | number | null) {
    setNodeForm(prev => ({
      ...prev,
      choices: prev.choices.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  }

  function removeChoice(index: number) {
    setNodeForm(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index),
    }));
  }

  function handleSaveNode() {
    if (editingNode) {
      updateNodeMutation.mutate({
        id: editingNode.id,
        nodeType: nodeForm.nodeType,
        label: nodeForm.label,
        messageContent: nodeForm.messageContent || undefined,
        choices: nodeForm.choices.length > 0 ? nodeForm.choices : undefined,
        nextNodeId: nodeForm.nextNodeId,
        sortOrder: nodeForm.sortOrder,
      });
    } else {
      createNodeMutation.mutate({
        scenarioId,
        nodeType: nodeForm.nodeType,
        label: nodeForm.label,
        messageContent: nodeForm.messageContent || undefined,
        choices: nodeForm.choices.length > 0 ? nodeForm.choices : undefined,
        nextNodeId: nodeForm.nextNodeId ?? undefined,
        sortOrder: nodes?.length ?? 0,
      });
    }
  }

  const nodeDialog = showAddNode || editingNode;

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chatbot")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{scenario?.name || "シナリオ編集"}</h1>
            <p className="text-sm text-muted-foreground">{scenario?.description || "フローを編集してチャットボットを構築"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {scenario?.useAi && (
            <Badge variant="secondary" className="gap-1">
              <BrainCircuit className="h-3 w-3" />
              AI応答有効
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content: Flow Editor + Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left: Flow Editor */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                フローエディタ
              </CardTitle>
              <Button size="sm" className="gap-1" onClick={() => { resetNodeForm(); setShowAddNode(true); }}>
                <Plus className="h-3.5 w-3.5" />
                ノード追加
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {nodesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  読み込み中...
                </div>
              ) : !nodes?.length ? (
                <div className="text-center py-8">
                  <GitBranch className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">ノードがありません</p>
                  <Button size="sm" variant="outline" onClick={() => { resetNodeForm(); setShowAddNode(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    最初のノードを追加
                  </Button>
                </div>
              ) : (
                nodes.map((node: any, index: number) => {
                  const config = NODE_TYPE_CONFIG[node.nodeType as keyof typeof NODE_TYPE_CONFIG] || NODE_TYPE_CONFIG.message;
                  const Icon = config.icon;
                  return (
                    <div key={node.id} className="relative">
                      {index > 0 && (
                        <div className="flex justify-center -mt-1 mb-1">
                          <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all ${config.color}`}
                        onClick={() => openEditNode(node)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium opacity-70">{config.label}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{index + 1}</Badge>
                            </div>
                            <p className="text-sm font-medium truncate">{node.label}</p>
                            {node.messageContent && (
                              <p className="text-xs opacity-70 mt-1 line-clamp-2">{node.messageContent}</p>
                            )}
                            {node.choices && (node.choices as Choice[]).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(node.choices as Choice[]).map((c: Choice, ci: number) => (
                                  <span key={ci} className="text-[10px] px-2 py-0.5 rounded-full bg-background/50 border">
                                    {c.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("このノードを削除しますか？")) {
                                deleteNodeMutation.mutate({ id: node.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right: Chat Preview */}
        <ChatPreview nodes={nodes || []} scenarioId={scenarioId} />
      </div>

      {/* Node Add/Edit Dialog */}
      <Dialog open={!!nodeDialog} onOpenChange={(open) => { if (!open) { setShowAddNode(false); setEditingNode(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNode ? "ノード編集" : "ノード追加"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ノードタイプ</Label>
              <Select
                value={nodeForm.nodeType}
                onValueChange={(v: any) => setNodeForm(prev => ({ ...prev, nodeType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NODE_TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className="h-4 w-4" />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ラベル *</Label>
              <Input
                value={nodeForm.label}
                onChange={e => setNodeForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="例: 商品カテゴリを聞く"
              />
            </div>
            <div className="space-y-2">
              <Label>メッセージ内容</Label>
              <Textarea
                value={nodeForm.messageContent}
                onChange={e => setNodeForm(prev => ({ ...prev, messageContent: e.target.value }))}
                placeholder="ボットが送信するメッセージ"
                rows={3}
              />
            </div>

            {nodeForm.nodeType === "choices" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>選択肢</Label>
                  <Button variant="outline" size="sm" onClick={addChoice} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    追加
                  </Button>
                </div>
                {nodeForm.choices.map((choice, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={choice.label}
                      onChange={e => updateChoice(i, "label", e.target.value)}
                      placeholder="表示テキスト"
                      className="flex-1"
                    />
                    <Input
                      value={choice.value}
                      onChange={e => updateChoice(i, "value", e.target.value)}
                      placeholder="値"
                      className="w-24"
                    />
                    {nodes && nodes.length > 0 && (
                      <Select
                        value={choice.nextNodeId?.toString() || "none"}
                        onValueChange={v => updateChoice(i, "nextNodeId", v === "none" ? null : Number(v))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="次へ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">次のノード</SelectItem>
                          {nodes.map((n: any) => (
                            <SelectItem key={n.id} value={n.id.toString()}>{n.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeChoice(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {nodeForm.choices.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">「追加」ボタンで選択肢を追加してください</p>
                )}
              </div>
            )}

            {nodeForm.nodeType !== "choices" && nodes && nodes.length > 0 && (
              <div className="space-y-2">
                <Label>次のノード</Label>
                <Select
                  value={nodeForm.nextNodeId?.toString() || "auto"}
                  onValueChange={v => setNodeForm(prev => ({ ...prev, nextNodeId: v === "auto" ? undefined : Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="自動（次のノード）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自動（次のノード）</SelectItem>
                    {nodes.map((n: any) => (
                      <SelectItem key={n.id} value={n.id.toString()}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">キャンセル</Button>
            </DialogClose>
            <Button onClick={handleSaveNode} disabled={!nodeForm.label || createNodeMutation.isPending || updateNodeMutation.isPending}>
              {editingNode ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
