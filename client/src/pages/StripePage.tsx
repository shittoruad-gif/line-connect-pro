import { useState, useEffect } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  CreditCard, Settings, Eye, EyeOff, Plus, Pencil, Trash2,
  DollarSign, TrendingUp, Receipt, BarChart3,
} from "lucide-react";

export default function StripePage() {
  const { selectedClientId } = useClient();
  const [showPublishable, setShowPublishable] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ publishableKey: "", stripeSecretKey: "" });
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ name: "", amount: 0, interval: "one_time" as string, isActive: true });

  // --- Queries ---
  const { data: stripeSettings } = trpc.stripe.settings.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: plans, isLoading: plansLoading } = trpc.stripe.listPlans.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: payments } = trpc.stripe.listPayments.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: stats } = trpc.stripe.stats.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  // --- Mutations ---
  const utils = trpc.useUtils();
  const saveSettingsMut = trpc.stripe.saveSettings.useMutation({
    onSuccess: () => { utils.stripe.settings.invalidate(); toast.success("Stripe設定を保存しました"); },
    onError: (e) => toast.error(e.message),
  });
  const createPlanMut = trpc.stripe.createPlan.useMutation({
    onSuccess: () => { utils.stripe.listPlans.invalidate(); setPlanDialogOpen(false); toast.success("プランを作成しました"); },
    onError: (e) => toast.error(e.message),
  });
  const updatePlanMut = trpc.stripe.updatePlan.useMutation({
    onSuccess: () => { utils.stripe.listPlans.invalidate(); setPlanDialogOpen(false); toast.success("プランを更新しました"); },
    onError: (e) => toast.error(e.message),
  });
  const deletePlanMut = trpc.stripe.deletePlan.useMutation({
    onSuccess: () => { utils.stripe.listPlans.invalidate(); toast.success("プランを削除しました"); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (stripeSettings) {
      setSettingsForm({
        publishableKey: stripeSettings.publishableKey ?? "",
        stripeSecretKey: "",
      });
    }
  }, [stripeSettings]);

  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: "", amount: 0, interval: "one_time", isActive: true });
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({ name: plan.name, amount: plan.amount, interval: plan.interval, isActive: plan.isActive });
    setPlanDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!selectedClientId) return;
    if (editingPlan?.id) {
      updatePlanMut.mutate({ id: editingPlan.id, ...planForm, interval: planForm.interval as any });
    } else {
      createPlanMut.mutate({ clientId: selectedClientId, ...planForm, interval: planForm.interval as any });
    }
  };

  const intervalLabels: Record<string, string> = {
    one_time: "単発",
    monthly: "月額",
    yearly: "年額",
  };

  const statusColors: Record<string, string> = {
    succeeded: "bg-primary/20 text-primary",
    pending: "bg-yellow-500/20 text-yellow-400",
    failed: "bg-destructive/20 text-destructive",
    refunded: "bg-muted text-muted-foreground",
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stripe決済管理</h1>
            <p className="text-sm text-muted-foreground mt-1">決済プラン・履歴の管理</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">Stripe決済管理</h1>
          <p className="text-sm text-muted-foreground mt-1">決済プラン・履歴の管理</p>
        </div>
        <ClientSelector />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総売上</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{"\u00A5"}{(stats.totalRevenue ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">月間売上</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{"\u00A5"}{(stats.monthlyRevenue ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総決済数</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(stats.totalPayments ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            APIキー設定
          </CardTitle>
          <CardDescription>Stripeダッシュボードから取得したAPIキーを設定してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>公開可能キー (Publishable Key)</Label>
            <div className="relative">
              <Input
                type={showPublishable ? "text" : "password"}
                value={settingsForm.publishableKey}
                onChange={(e) => setSettingsForm({ ...settingsForm, publishableKey: e.target.value })}
                placeholder="pk_live_..."
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPublishable(!showPublishable)}>
                {showPublishable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>シークレットキー (Secret Key)</Label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={settingsForm.stripeSecretKey}
                onChange={(e) => setSettingsForm({ ...settingsForm, stripeSecretKey: e.target.value })}
                placeholder={stripeSettings?.configured ? "変更する場合のみ入力" : "sk_live_..."}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowSecret(!showSecret)}>
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            onClick={() => {
              if (!selectedClientId) return;
              saveSettingsMut.mutate({ clientId: selectedClientId, stripePublishableKey: settingsForm.publishableKey, stripeSecretKey: settingsForm.stripeSecretKey });
            }}
            disabled={saveSettingsMut.isPending}
            className="w-full"
          >
            {saveSettingsMut.isPending ? "保存中..." : "APIキーを保存"}
          </Button>
        </CardContent>
      </Card>

      {/* Payment Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              決済プラン
            </CardTitle>
            <CardDescription>料金プランの作成・管理</CardDescription>
          </div>
          <Button onClick={openCreatePlan} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            新規プラン
          </Button>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="h-24 bg-muted animate-pulse rounded" />
          ) : !plans || plans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">プランがありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>プラン名</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>課金タイプ</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{"\u00A5"}{plan.amount.toLocaleString()}</TableCell>
                    <TableCell>{intervalLabels[plan.interval] ?? plan.interval}</TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditPlan(plan)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("このプランを削除しますか？")) {
                          deletePlanMut.mutate({ id: plan.id });
                        }
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            決済履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">決済履歴がありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>決済日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{"\u00A5"}{p.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[p.status] ?? "bg-muted text-muted-foreground"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString("ja-JP") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "プラン編集" : "新規プラン作成"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>プラン名</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="例: ベーシックプラン" />
            </div>
            <div>
              <Label>金額 (円)</Label>
              <Input type="number" value={planForm.amount} onChange={(e) => setPlanForm({ ...planForm, amount: Number(e.target.value) })} placeholder="例: 9800" />
            </div>
            <div>
              <Label>課金タイプ</Label>
              <Select value={planForm.interval} onValueChange={(v) => setPlanForm({ ...planForm, interval: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">単発</SelectItem>
                  <SelectItem value="monthly">月額</SelectItem>
                  <SelectItem value="yearly">年額</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>有効</Label>
              <Switch checked={planForm.isActive} onCheckedChange={(v) => setPlanForm({ ...planForm, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSavePlan} disabled={createPlanMut.isPending || updatePlanMut.isPending}>
              {createPlanMut.isPending || updatePlanMut.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
