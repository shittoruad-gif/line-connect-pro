import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sliders, Loader2, KeyRound, Users, Eye, EyeOff, ShieldCheck, Mail } from "lucide-react";

export default function AppSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-muted-foreground" />
          アプリ設定
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          アプリの各種設定を管理します
        </p>
      </div>

      {/* User Management (Admin Only) */}
      {isAdmin && <UserManagementSection />}
    </div>
  );
}

/* ===== User Management Section ===== */
function UserManagementSection() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string | null; email: string | null } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("パスワードをリセットしました");
      setResetDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const openResetDialog = (u: { id: number; name: string | null; email: string | null }) => {
    setSelectedUser(u);
    setNewPassword("");
    setShowPassword(false);
    setResetDialogOpen(true);
  };

  const handleReset = () => {
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      toast.error("パスワードは6文字以上で設定してください");
      return;
    }
    resetMutation.mutate({ userId: selectedUser.id, newPassword });
  };

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            ユーザー管理
          </CardTitle>
          <CardDescription>
            登録ユーザーの一覧とパスワードリセット
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !users || users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              ユーザーが登録されていません
            </p>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{u.name || "名前未設定"}</p>
                      {u.role === "admin" && (
                        <Badge variant="secondary" className="bg-primary/15 text-primary text-xs px-1.5 py-0">
                          <ShieldCheck className="w-3 h-3 mr-0.5" />管理者
                        </Badge>
                      )}
                      {u.emailVerified ? (
                        <Badge variant="secondary" className="bg-green-500/15 text-green-500 text-xs px-1.5 py-0">
                          <Mail className="w-3 h-3 mr-0.5" />確認済み
                        </Badge>
                      ) : u.loginMethod === "email" ? (
                        <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-500 text-xs px-1.5 py-0">
                          <Mail className="w-3 h-3 mr-0.5" />未確認
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email || "-"}</p>
                  </div>
                  {u.loginMethod === "email" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openResetDialog(u)}
                      className="shrink-0"
                    >
                      <KeyRound className="w-3 h-3 mr-1" />
                      PW リセット
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>パスワードリセット</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border text-sm">
              <p className="font-medium">{selectedUser?.name || "名前未設定"}</p>
              <p className="text-xs text-muted-foreground">{selectedUser?.email}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">新しいパスワード</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6文字以上"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                リセット後、このパスワードをユーザーに共有してください
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleReset}
              disabled={resetMutation.isPending || newPassword.length < 6}
            >
              {resetMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" />リセット中...</>
              ) : (
                "パスワードをリセット"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
