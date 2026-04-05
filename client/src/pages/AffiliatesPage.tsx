import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Users, Plus, Copy, ExternalLink, Eye, DollarSign, UserPlus, Percent,
} from "lucide-react";

export default function AffiliatesPage() {
  const { selectedClientId } = useClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [referralsOpen, setReferralsOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", commissionRate: 0, fixedCommission: 0 });

  // --- Queries ---
  const { data: affiliates, isLoading } = trpc.affiliates.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: referrals } = trpc.affiliates.referrals.useQuery(
    { affiliateId: selectedAffiliate?.id },
    { enabled: !!selectedAffiliate?.id && referralsOpen }
  );

  // --- Mutations ---
  const utils = trpc.useUtils();
  const createMut = trpc.affiliates.create.useMutation({
    onSuccess: () => {
      utils.affiliates.list.invalidate();
      setCreateOpen(false);
      setForm({ name: "", code: "", commissionRate: 0, fixedCommission: 0 });
      toast.success("アフィリエイトを作成しました");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!selectedClientId) return;
    createMut.mutate({ clientId: selectedClientId, ...form });
  };

  const copyReferralUrl = (code: string) => {
    const url = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("紹介URLをコピーしました");
  };

  const openReferrals = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setReferralsOpen(true);
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">アフィリエイト管理</h1>
            <p className="text-sm text-muted-foreground mt-1">紹介パートナーの管理</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">アフィリエイト管理</h1>
          <p className="text-sm text-muted-foreground mt-1">紹介パートナーの管理</p>
        </div>
        <ClientSelector />
      </div>

      {/* Affiliates List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              アフィリエイト一覧
            </CardTitle>
            <CardDescription>紹介パートナーと成果の管理</CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 bg-muted animate-pulse rounded" />
          ) : !affiliates || affiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">アフィリエイトが登録されていません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>コード</TableHead>
                  <TableHead>報酬率</TableHead>
                  <TableHead>固定報酬</TableHead>
                  <TableHead>紹介数</TableHead>
                  <TableHead>総報酬額</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{a.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        {a.commissionRate}%
                      </span>
                    </TableCell>
                    <TableCell>{"\u00A5"}{(a.fixedCommission ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <UserPlus className="h-3 w-3 text-muted-foreground" />
                        {a.totalReferrals ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {"\u00A5"}{(a.totalCommission ?? 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => copyReferralUrl(a.code)} title="紹介URLをコピー">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openReferrals(a)} title="紹介一覧">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規アフィリエイト作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>名前</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: 田中太郎" />
            </div>
            <div>
              <Label>紹介コード</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="例: tanaka2024" />
            </div>
            <div>
              <Label>報酬率 (%)</Label>
              <Input type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} placeholder="例: 10" />
            </div>
            <div>
              <Label>固定報酬 (円)</Label>
              <Input type="number" value={form.fixedCommission} onChange={(e) => setForm({ ...form, fixedCommission: Number(e.target.value) })} placeholder="例: 500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>キャンセル</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referrals Dialog */}
      <Dialog open={referralsOpen} onOpenChange={setReferralsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAffiliate?.name} の紹介一覧</DialogTitle>
          </DialogHeader>
          {!referrals || referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">紹介実績がありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>紹介者</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>報酬額</TableHead>
                  <TableHead>紹介日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.friendName ?? r.friendId}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "converted" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{"\u00A5"}{(r.commission ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("ja-JP")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
