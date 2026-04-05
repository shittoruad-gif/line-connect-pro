import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClient } from "@/contexts/ClientContext";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Link2, Trash2, Copy, ChevronDown, ChevronRight, BarChart3, MousePointerClick } from "lucide-react";

type FormData = { name: string; originalUrl: string; autoTag: string };
const emptyForm: FormData = { name: "", originalUrl: "", autoTag: "" };

export default function TrackingLinksPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: links, isLoading } = trpc.tracking.listLinks.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const createMut = trpc.tracking.createLink.useMutation({
    onSuccess: () => { utils.tracking.listLinks.invalidate(); setDialogOpen(false); setForm(emptyForm); toast.success("計測リンクを作成しました"); },
  });
  const deleteMut = trpc.tracking.deleteLink.useMutation({
    onSuccess: () => { utils.tracking.listLinks.invalidate(); toast.success("削除しました"); },
  });
  const toggleMut = trpc.tracking.updateLink.useMutation({
    onSuccess: () => utils.tracking.listLinks.invalidate(),
  });

  const openCreate = () => { setForm(emptyForm); setDialogOpen(true); };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.originalUrl.trim()) { toast.error("名前とURLは必須です"); return; }
    createMut.mutate({ clientId: selectedClientId!, name: form.name, originalUrl: form.originalUrl, autoTag: form.autoTag || undefined });
  };

  const copyShortUrl = (shortCode: string) => {
    const url = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(url);
    toast.success("短縮URLをコピーしました");
  };

  const truncateUrl = (url: string, max = 40) => url.length > max ? url.slice(0, max) + "..." : url;

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">クリック計測</h1><p className="text-sm text-muted-foreground mt-1">リンクのクリック計測・短縮URL管理</p></div>
          <ClientSelector />
        </div>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">クリック計測</h1><p className="text-sm text-muted-foreground mt-1">リンクのクリック計測・短縮URL管理</p></div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> 新規作成</Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : !links || links.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">計測リンクがありません</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>名前</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>短縮コード</TableHead>
                <TableHead>自動タグ</TableHead>
                <TableHead className="text-right">総クリック</TableHead>
                <TableHead className="text-right">ユニーク</TableHead>
                <TableHead>有効</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <>
                  <TableRow key={link.id}>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setExpandedId(expandedId === link.id ? null : link.id)}>
                        {expandedId === link.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[200px]" title={link.originalUrl}>{truncateUrl(link.originalUrl)}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-mono text-xs">{link.shortCode}</Badge></TableCell>
                    <TableCell>{link.autoTag ? <Badge variant="outline">{link.autoTag}</Badge> : <span className="text-muted-foreground text-xs">-</span>}</TableCell>
                    <TableCell className="text-right font-medium">{link.totalClicks ?? 0}</TableCell>
                    <TableCell className="text-right font-medium">{link.uniqueClicks ?? 0}</TableCell>
                    <TableCell><Switch checked={link.isActive} onCheckedChange={(v) => toggleMut.mutate({ id: link.id, isActive: v })} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => copyShortUrl(link.shortCode)} title="短縮URLをコピー"><Copy className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("このリンクを削除しますか？")) deleteMut.mutate({ id: link.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === link.id && (
                    <TableRow key={`${link.id}-stats`}>
                      <TableCell colSpan={9} className="bg-secondary/30 p-0">
                        <ClickStatsSection linkId={link.id} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新規計測リンク</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>リンク名 *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: LP広告リンクA" /></div>
            <div><Label>元URL *</Label><Input value={form.originalUrl} onChange={(e) => setForm({ ...form, originalUrl: e.target.value })} placeholder="https://example.com/lp" /></div>
            <div><Label>自動タグ（任意）</Label><Input value={form.autoTag} onChange={(e) => setForm({ ...form, autoTag: e.target.value })} placeholder="例: 広告A" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending}>作成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClickStatsSection({ linkId }: { linkId: number }) {
  const { data: stats, isLoading } = trpc.tracking.clickStats.useQuery({ trackingLinkId: linkId });

  if (isLoading) {
    return <div className="p-6 text-center text-sm text-muted-foreground">読み込み中...</div>;
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center text-center">
        <MousePointerClick className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">まだクリックデータがありません</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-4 w-4 text-[#06C755]" />
        <span className="text-sm font-medium">クリック統計</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat: any, i: number) => (
          <div key={i} className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
