import { useState, useEffect, useRef } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageCircle, User, Search } from "lucide-react";

export default function OperatorChatPage() {
  const { selectedClientId } = useClient();
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  const { data: friends } = trpc.operatorChat.friendList.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId, refetchInterval: 10000 }
  );

  const { data: messages } = trpc.operatorChat.messages.useQuery(
    { clientId: selectedClientId!, friendId: selectedFriendId! },
    { enabled: !!selectedClientId && !!selectedFriendId, refetchInterval: 3000 }
  );

  const selectedFriend = friends?.find((f: any) => f.id === selectedFriendId);

  const sendMut = trpc.operatorChat.send.useMutation({
    onSuccess: () => {
      utils.operatorChat.messages.invalidate();
      utils.operatorChat.friendList.invalidate();
      setMessageInput("");
    },
    onError: (err) => toast.error(err.message ?? "送信に失敗しました"),
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim() || !selectedFriendId) return;
    sendMut.mutate({ clientId: selectedClientId!, friendId: selectedFriendId, messageContent: messageInput.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">オペレーターチャット</h1>
            <p className="text-sm text-muted-foreground mt-1">LINE友だちとの1対1チャット</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">オペレーターチャット</h1>
          <p className="text-sm text-muted-foreground mt-1">LINE友だちとの1対1チャット</p>
        </div>
        <ClientSelector />
      </div>

      <Card className="overflow-hidden">
        <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left Sidebar - Friend List */}
          <div className="w-80 border-r flex flex-col shrink-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="友だちを検索..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {!friends || friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4 text-center">
                  <User className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">友だちがいません</p>
                  <p className="text-xs mt-1">LINE公式アカウントに友だち追加されると、ここに表示されます</p>
                </div>
              ) : (
                <div className="divide-y">
                  {friends.map((friend: any) => (
                    <button
                      key={friend.id}
                      onClick={() => setSelectedFriendId(friend.id)}
                      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-colors ${
                        selectedFriendId === friend.id ? "bg-secondary" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={friend.pictureUrl} alt={friend.displayName} />
                        <AvatarFallback>
                          {(friend.displayName ?? "?").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">
                            {friend.displayName ?? "不明"}
                          </span>
                          {friend.lastMessageAt && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                              {new Date(friend.lastMessageAt).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {friend.lastMessage ?? "メッセージなし"}
                          </p>
                          {friend.unreadCount > 0 && (
                            <Badge
                              className="ml-2 h-5 min-w-[20px] px-1.5 text-[10px] font-bold shrink-0"
                              style={{ backgroundColor: "#06C755", color: "#fff" }}
                            >
                              {friend.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedFriendId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-10 w-10 text-primary/40" />
                </div>
                <p className="text-lg font-medium">チャットを開始</p>
                <p className="text-sm mt-1">左のリストから友だちを選んでメッセージを送りましょう</p>
              </div>
            ) : (
              <>
                {/* Friend Info Header */}
                {selectedFriend && (
                  <div className="border-b px-4 py-3 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={selectedFriend.pictureUrl ?? undefined} alt={selectedFriend.displayName ?? undefined} />
                      <AvatarFallback>
                        {(selectedFriend.displayName ?? "?").slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {selectedFriend.displayName ?? "不明"}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {selectedFriend.tags
                          ? (Array.isArray(selectedFriend.tags) ? selectedFriend.tags : []).map(
                            (tag: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] h-4 px-1.5">
                                {tag}
                              </Badge>
                            )
                          )
                          : null}
                        {selectedFriend.score != null && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            スコア: {selectedFriend.score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-3">
                    {messages?.map((msg: any) => {
                      const isOutgoing = msg.direction === "outgoing";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                        >
                          <div className="flex flex-col max-w-[70%]">
                            <div
                              className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                                isOutgoing
                                  ? "rounded-br-md text-white"
                                  : "bg-secondary rounded-bl-md"
                              }`}
                              style={isOutgoing ? { backgroundColor: "#06C755" } : undefined}
                            >
                              {msg.content}
                            </div>
                            <span
                              className={`text-[10px] text-muted-foreground mt-1 ${
                                isOutgoing ? "text-right" : "text-left"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="メッセージを入力..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!messageInput.trim() || sendMut.isPending}
                      size="icon"
                      style={{ backgroundColor: "#06C755" }}
                      className="hover:opacity-90 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
