import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InviteClientDialogProps {
  clientId: number;
  clientName: string;
}

export default function InviteClientDialog({ clientId, clientName }: InviteClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "editor" | "viewer">("editor");
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const createMutation = trpc.invitations.create.useMutation({
    onSuccess: (data) => {
      setInviteCode(data.code);
      toast.success("招待コードを発行しました");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!email) return;
    createMutation.mutate({ clientId, email, role });
  };

  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success("招待コードをコピーしました");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setRole("editor");
    setInviteCode(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          招待
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>クライアントを招待</DialogTitle>
          <DialogDescription>
            {clientName} のポータルにアクセスできる招待コードを発行します
          </DialogDescription>
        </DialogHeader>

        {!inviteCode ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>メールアドレス</Label>
              <Input
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>権限</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">オーナー（全権限）</SelectItem>
                  <SelectItem value="editor">編集者（閲覧・編集）</SelectItem>
                  <SelectItem value="viewer">閲覧者（閲覧のみ）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">招待コードを発行しました</span>
            </div>
            <div className="space-y-2">
              <Label>招待コード</Label>
              <div className="flex gap-2">
                <Input value={inviteCode} readOnly className="bg-muted font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                このコードをクライアントに共有してください。クライアントはポータルにログイン後、このコードを入力して承認します。有効期限は7日間です。
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!inviteCode ? (
            <Button onClick={handleCreate} disabled={!email || createMutation.isPending}>
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 発行中...</> : "招待コードを発行"}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>閉じる</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
