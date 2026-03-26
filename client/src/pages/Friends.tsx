import { useState, useMemo } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Users, Search, Eye, Tag } from "lucide-react";

const statusLabels: Record<string, string> = {
  active: "有効",
  blocked: "ブロック",
  unfollowed: "解除済み",
};
const statusColors: Record<string, string> = {
  active: "bg-primary/20 text-primary",
  blocked: "bg-destructive/20 text-destructive",
  unfollowed: "bg-muted text-muted-foreground",
};

export default function FriendsPage() {
  const { selectedClientId } = useClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [tagInput, setTagInput] = useState("");

  const { data: friends, isLoading } = trpc.friends.list.useQuery(
    { clientId: selectedClientId!, search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined },
    { enabled: !!selectedClientId }
  );

  const utils = trpc.useUtils();
  const updateMut = trpc.friends.update.useMutation({
    onSuccess: () => { utils.friends.list.invalidate(); toast.success("更新しました"); },
  });

  const openDetail = (f: any) => { setSelectedFriend(f); setTagInput(f.tags ?? ""); setDetailOpen(true); };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">友だち管理</h1><p className="text-sm text-muted-foreground mt-1">LINE友だちの情報管理・セグメント</p></div>
          <ClientSelector />
        </div>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Users className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">友だち管理</h1><p className="text-sm text-muted-foreground mt-1">LINE友だちの情報管理・セグメント</p></div>
        <ClientSelector />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="名前で検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="ステータス" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="active">有効</SelectItem>
            <SelectItem value="blocked">ブロック</SelectItem>
            <SelectItem value="unfollowed">解除済み</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : !friends || friends.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Users className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">友だちが登録されていません</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>表示名</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>タグ</TableHead>
                <TableHead>追加日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {friends.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.displayName ?? "不明"}</TableCell>
                  <TableCell><Badge className={statusColors[f.status] ?? ""} variant="secondary">{statusLabels[f.status] ?? f.status}</Badge></TableCell>
                  <TableCell>
                    {f.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(f.tags) ? f.tags : []).map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag.trim()}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.addedAt ? new Date(f.addedAt).toLocaleDateString("ja-JP") : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openDetail(f)}><Eye className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>友だち詳細</DialogTitle></DialogHeader>
          {selectedFriend && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground text-xs">表示名</Label><p className="font-medium">{selectedFriend.displayName ?? "不明"}</p></div>
                <div><Label className="text-muted-foreground text-xs">ステータス</Label><p><Badge className={statusColors[selectedFriend.status]} variant="secondary">{statusLabels[selectedFriend.status]}</Badge></p></div>
                <div><Label className="text-muted-foreground text-xs">LINE User ID</Label><p className="text-sm font-mono">{selectedFriend.lineUserId}</p></div>
                <div><Label className="text-muted-foreground text-xs">追加日</Label><p className="text-sm">{selectedFriend.addedAt ? new Date(selectedFriend.addedAt).toLocaleDateString("ja-JP") : "-"}</p></div>
              </div>
              <div>
                <Label className="flex items-center gap-1"><Tag className="h-3 w-3" /> タグ（カンマ区切り）</Label>
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="例: VIP, 体験済み, 男性" />
              </div>
              {selectedFriend.notes && (
                <div><Label className="text-muted-foreground text-xs">メモ</Label><p className="text-sm">{selectedFriend.notes}</p></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>閉じる</Button>
            <Button onClick={() => {
              if (selectedFriend) {
                updateMut.mutate({ id: selectedFriend.id, tags: tagInput });
                setDetailOpen(false);
              }
            }}>タグを保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
