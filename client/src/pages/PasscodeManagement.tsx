import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ToggleLeft, ToggleRight, Ticket, Users, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PasscodeManagement() {
  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState<"lifetime" | "paid">("lifetime");
  const [newMaxUses, setNewMaxUses] = useState("1");

  const passcodes = trpc.passcodes.list.useQuery();
  const subscriptions = trpc.subscription.listAll.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.passcodes.create.useMutation({
    onSuccess: (data) => {
      toast.success(`パスコード作成完了: ${data.code}`);
      setNewCode("");
      setNewMaxUses("1");
      utils.passcodes.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.passcodes.toggle.useMutation({
    onSuccess: () => utils.passcodes.list.invalidate(),
  });

  const deleteMutation = trpc.passcodes.delete.useMutation({
    onSuccess: () => {
      toast.success("削除しました");
      utils.passcodes.list.invalidate();
    },
  });

  const setPlanMutation = trpc.subscription.setUserPlan.useMutation({
    onSuccess: () => {
      toast.success("プラン変更完了");
      utils.subscription.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const copyCode = async (code: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed"; ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success(`コピーしました: ${code}`);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          パスコード管理
        </h1>
        <p className="text-muted-foreground mt-1">パスコードの作成・管理とユーザーのプラン変更を行います。</p>
      </div>

      {/* Create Passcode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">新しいパスコードを作成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-muted-foreground mb-1 block">コード</label>
              <Input
                placeholder="例: ZOOM-FREE-2026"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="w-40">
              <label className="text-sm text-muted-foreground mb-1 block">プラン</label>
              <Select value={newPlan} onValueChange={(v) => setNewPlan(v as "lifetime" | "paid")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifetime">永年無料</SelectItem>
                  <SelectItem value="paid">有料（1ヶ月）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <label className="text-sm text-muted-foreground mb-1 block">使用上限</label>
              <Input
                type="number"
                min="1"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
              />
            </div>
            <Button
              onClick={() => createMutation.mutate({
                code: newCode.trim(),
                plan: newPlan,
                maxUses: parseInt(newMaxUses) || 1,
              })}
              disabled={!newCode.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              作成
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Passcode List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">パスコード一覧</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>コード</TableHead>
                <TableHead className="hidden sm:table-cell">プラン</TableHead>
                <TableHead>使用数</TableHead>
                <TableHead className="hidden sm:table-cell">ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passcodes.data?.map((pc) => (
                <TableRow key={pc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{pc.code}</code>
                      <button onClick={() => copyCode(pc.code)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={pc.plan === "lifetime" ? "default" : "secondary"}>
                      {pc.plan === "lifetime" ? "永年無料" : "有料"}
                    </Badge>
                  </TableCell>
                  <TableCell>{pc.currentUses} / {pc.maxUses}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={pc.isActive ? "default" : "outline"}>
                      {pc.isActive ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleMutation.mutate({ id: pc.id, isActive: !pc.isActive })}
                      >
                        {pc.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: pc.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!passcodes.data || passcodes.data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    パスコードがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            ユーザープラン管理
          </CardTitle>
          <CardDescription>ユーザーのプランを手動で変更できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>メール</TableHead>
                <TableHead>現在のプラン</TableHead>
                <TableHead>パスコード</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.data?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.userName || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{sub.userEmail || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={sub.plan === "lifetime" ? "default" : sub.plan === "paid" ? "secondary" : "outline"}>
                      {sub.plan === "lifetime" ? "永年無料" : sub.plan === "paid" ? "有料" : "無料"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sub.passcodeUsed ? (
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{sub.passcodeUsed}</code>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={sub.plan}
                      onValueChange={(plan) =>
                        setPlanMutation.mutate({ userId: sub.userId, plan: plan as "free" | "paid" | "lifetime" })
                      }
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">無料</SelectItem>
                        <SelectItem value="paid">有料</SelectItem>
                        <SelectItem value="lifetime">永年無料</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {(!subscriptions.data || subscriptions.data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    サブスクリプションデータがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
