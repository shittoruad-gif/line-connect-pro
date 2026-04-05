import { useState } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <p className="text-muted-foreground">無効なリンクです。</p>
          <a href="/dashboard" className="text-primary hover:underline mt-4 inline-block">ログインページに戻る</a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      toast.error("パスワードは6文字以上で設定してください");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      setDone(true);
    } catch {
      toast.error("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">パスワードをリセットしました</h1>
          <p className="text-muted-foreground text-center">新しいパスワードでログインしてください。</p>
          <a href="/dashboard">
            <Button size="lg" className="w-full">ログインする</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Zoom URL 自動発行</span>
        </div>
        <h1 className="text-2xl font-semibold">新しいパスワードを設定</h1>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">新しいパスワード</label>
            <Input
              type="password"
              required
              placeholder="6文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">パスワード確認</label>
            <Input
              type="password"
              required
              placeholder="もう一度入力"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "処理中..." : "パスワードをリセット"}
          </Button>
        </form>
        <a href="/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> ログインに戻る
        </a>
      </div>
    </div>
  );
}
