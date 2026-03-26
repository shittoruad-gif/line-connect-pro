import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, ArrowLeft, Check, Mail, Eye, EyeOff } from "lucide-react";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#06C755] flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">LINE Connect Pro</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = "パスワード" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={6}
        className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755] pr-10"
      />
      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" onClick={() => setShow(!show)}>
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ===== Login =====
export function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
        }
        setError(data.error || "ログインに失敗しました");
        return;
      }
      window.location.href = "/portal";
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setError("確認メールを再送しました。メールをご確認ください。");
      setNeedsVerification(false);
    } catch {
      setError("送信に失敗しました");
    }
  }

  return (
    <AuthLayout>
      <Card className="bg-white/[0.02] border-white/5">
        <CardContent className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">ログイン</h1>
          <p className="text-sm text-gray-400 text-center mb-6">LINE Connect Proにログインして、LINE運用を管理しましょう</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">メールアドレス</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">パスワード</label>
              <PasswordInput value={password} onChange={setPassword} />
            </div>

            {error && (
              <div className={`text-sm p-3 rounded-lg ${needsVerification ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {error}
                {needsVerification && (
                  <button type="button" className="block mt-2 text-[#06C755] hover:underline text-xs" onClick={handleResendVerification}>
                    確認メールを再送する
                  </button>
                )}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white h-11">
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <button className="text-sm text-[#06C755] hover:underline" onClick={() => navigate("/forgot-password")}>
              パスワードをお忘れですか？
            </button>
            <p className="text-sm text-gray-500">
              アカウントをお持ちでないですか？{" "}
              <button className="text-[#06C755] hover:underline" onClick={() => navigate("/register")}>新規登録</button>
            </p>
          </div>
        </CardContent>
      </Card>

      <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 mt-4 mx-auto" onClick={() => navigate("/lp")}>
        <ArrowLeft className="w-3 h-3" /> トップページに戻る
      </button>
    </AuthLayout>
  );
}

// ===== Register =====
export function RegisterPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で設定してください");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
        return;
      }
      setSuccess(true);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <Card className="bg-white/[0.02] border-[#06C755]/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#06C755]/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#06C755]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">確認メールを送信しました</h2>
            <p className="text-sm text-gray-400 mb-4">
              <span className="text-white font-medium">{email}</span> に確認メールを送信しました。
              メール内のリンクをクリックして、アカウントを有効化してください。
            </p>
            <p className="text-xs text-gray-500 mb-6">メールが届かない場合は、迷惑メールフォルダをご確認ください。</p>
            <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5" onClick={() => navigate("/login")}>
              ログイン画面へ
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="bg-white/[0.02] border-white/5">
        <CardContent className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">新規登録</h1>
          <p className="text-sm text-gray-400 text-center mb-6">14日間無料ですべての機能をお試しいただけます</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">お名前・店舗名</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="○○サロン" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">メールアドレス</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">パスワード（6文字以上）</label>
              <PasswordInput value={password} onChange={setPassword} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">パスワード（確認）</label>
              <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="パスワードをもう一度入力" />
            </div>

            {error && <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white h-11">
              {loading ? "登録中..." : "無料で登録する"}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            登録することで、利用規約とプライバシーポリシーに同意したことになります。
          </p>

          <p className="text-sm text-gray-500 text-center mt-6">
            既にアカウントをお持ちですか？{" "}
            <button className="text-[#06C755] hover:underline" onClick={() => navigate("/login")}>ログイン</button>
          </p>
        </CardContent>
      </Card>

      <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 mt-4 mx-auto" onClick={() => navigate("/lp")}>
        <ArrowLeft className="w-3 h-3" /> トップページに戻る
      </button>
    </AuthLayout>
  );
}

// ===== Forgot Password =====
export function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "送信に失敗しました");
        return;
      }
      setSuccess(true);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <Card className="bg-white/[0.02] border-[#06C755]/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#06C755]/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#06C755]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">メールを送信しました</h2>
            <p className="text-sm text-gray-400 mb-6">
              <span className="text-white font-medium">{email}</span> にパスワードリセットのリンクを送信しました。
              メール内のリンクから新しいパスワードを設定してください。
            </p>
            <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5" onClick={() => navigate("/login")}>
              ログイン画面へ
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="bg-white/[0.02] border-white/5">
        <CardContent className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">パスワードをリセット</h1>
          <p className="text-sm text-gray-400 text-center mb-6">登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">メールアドレス</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]" />
            </div>

            {error && <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white h-11">
              {loading ? "送信中..." : "リセットメールを送信"}
            </Button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            <button className="text-[#06C755] hover:underline" onClick={() => navigate("/login")}>ログインに戻る</button>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

// ===== Reset Password =====
export function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
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
        setError(data.error || "リセットに失敗しました");
        return;
      }
      setSuccess(true);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <Card className="bg-white/[0.02] border-red-500/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">無効なリンク</h2>
            <p className="text-sm text-gray-400 mb-6">パスワードリセットのリンクが無効です。もう一度お試しください。</p>
            <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5" onClick={() => navigate("/forgot-password")}>
              パスワードリセットへ
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <Card className="bg-white/[0.02] border-[#06C755]/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#06C755]/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#06C755]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">パスワードを変更しました</h2>
            <p className="text-sm text-gray-400 mb-6">新しいパスワードでログインしてください。</p>
            <Button className="bg-[#06C755] hover:bg-[#05b34c] text-white" onClick={() => navigate("/login")}>
              ログインする
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="bg-white/[0.02] border-white/5">
        <CardContent className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">新しいパスワードを設定</h1>
          <p className="text-sm text-gray-400 text-center mb-6">6文字以上の新しいパスワードを入力してください。</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">新しいパスワード</label>
              <PasswordInput value={password} onChange={setPassword} placeholder="新しいパスワード" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">パスワード（確認）</label>
              <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="もう一度入力" />
            </div>

            {error && <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white h-11">
              {loading ? "変更中..." : "パスワードを変更する"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
