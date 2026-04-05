import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, Video,
  Menu, Settings, ChevronDown, Clock, FileText, Mail,
  Ticket,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import PricingGate from "@/pages/PricingGate";

export type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  adminOnly?: boolean;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "",
    items: [
      { icon: LayoutDashboard, label: "ダッシュボード", path: "/dashboard" },
    ],
  },
  {
    label: "Zoom",
    items: [
      { icon: Video, label: "Zoom URL 発行", path: "/zoom" },
      { icon: Clock, label: "ミーティング履歴", path: "/zoom-history" },
      { icon: Mail, label: "招待文テンプレート", path: "/invitation-template" },
    ],
  },
  {
    label: "設定",
    items: [
      { icon: Settings, label: "Zoom API設定", path: "/zoom-settings" },
      { icon: FileText, label: "アプリ設定", path: "/app-settings" },
      { icon: Ticket, label: "パスコード��理", path: "/passcodes", adminOnly: true },
    ],
  },
];

// Flat list for route matching
const menuItems: MenuItem[] = menuGroups.flatMap((g) => g.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <SubscriptionGate user={user}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </SidebarProvider>
    </SubscriptionGate>
  );
}

/** 課金ゲート: admin は常にパス、それ以外は有料/lifetimeプランが必要 */
function SubscriptionGate({ user, children }: { user: { id: number; role: string }; children: React.ReactNode }) {
  const { data: sub, isLoading } = trpc.subscription.me.useQuery();

  // 管理者は常にアクセス可能
  if (user.role === "admin") return <>{children}</>;

  if (isLoading) return <DashboardLayoutSkeleton />;

  // プランが有効でない場合は料金ゲートを表示
  if (!sub?.active) return <PricingGate />;

  return <>{children}</>;
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => location.startsWith(item.path));
  const isMobile = useIsMobile();
  const isAdmin = user?.role === "admin";

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH)
        setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-14 justify-center border-b border-sidebar-border/50">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Video className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-bold tracking-tight truncate text-sm">
                    Zoom URL 自動発行
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {menuGroups.map((group) => {
              const groupItems = group.items.filter(
                (item) => !item.adminOnly || isAdmin
              );
              if (groupItems.length === 0) return null;
              return (
                <div key={group.label || "__top"} className="px-2 py-1">
                  {group.label && !isCollapsed && (
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                      {group.label}
                    </div>
                  )}
                  {group.label && isCollapsed && (
                    <div className="my-1 mx-auto w-4 border-t border-sidebar-border" />
                  )}
                  <SidebarMenu>
                    {groupItems.map((item) => {
                      const isActive = location.startsWith(item.path);
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className={`h-9 transition-all font-normal rounded-lg ${isActive ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent/50"}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </div>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {isAdmin ? "管理者" : "クライアント"}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground text-sm font-medium">
                {activeMenuItem?.label ?? "メニュー"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}

/** メール+パスワードログインフォーム */
function LoginForm() {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "registered">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          toast.success("パスワードリセットメールを送信しました。メールをご確認ください。");
        } else {
          const data = await res.json();
          toast.error(data.error || "送信に失敗しました");
        }
        return;
      }

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email, password }
        : { email, password, name: name || undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          toast.error("メールアドレスが未確認です。受信トレイをご確認ください。", { duration: 6000 });
          // Offer to resend
          const resend = await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          if (resend.ok) {
            toast.info("確認メールを再送信しました。", { duration: 5000 });
          }
          return;
        }
        toast.error(data.error || "エラーが発生しました");
        return;
      }

      if (mode === "register") {
        setMode("registered");
        return;
      }

      window.location.reload();
    } catch {
      toast.error("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // Registration success - show verification notice
  if (mode === "registered") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full text-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zoom URL 自動発行</span>
          </div>
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">確認メールを送信しました</h1>
          <p className="text-muted-foreground">
            <strong>{email}</strong> に確認メールを送信しました。<br />
            メール内のリンクをクリックして、アカウントを有効化してください。
          </p>
          <Button variant="outline" onClick={() => { setMode("login"); setPassword(""); }}>
            ログイン画面に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="flex flex-col items-center gap-5 p-8 max-w-sm w-full bg-card rounded-2xl shadow-lg border">
        <div className="flex flex-col items-center gap-2 mb-1">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <Video className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Zoom URL 自動発行</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-center">
          {mode === "login" ? "ログイン" : mode === "register" ? "アカウント作成" : "パスワードをリセット"}
        </h1>
        {mode === "forgot" && (
          <p className="text-sm text-muted-foreground text-center">
            登録したメールアドレスを入力してください。パスワードリセットのリンクを送信します。
          </p>
        )}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium mb-1 block">お名前</label>
              <Input
                placeholder="山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">メールアドレス</label>
            <Input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label className="text-sm font-medium mb-1 block">パスワード</label>
              <Input
                type="password"
                required
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="h-11 rounded-xl"
              />
            </div>
          )}
          <Button type="submit" size="lg" className="w-full h-12 rounded-xl text-base font-bold shadow-sm" disabled={loading}>
            {loading ? "処理中..." : mode === "login" ? "ログイン" : mode === "register" ? "アカウント作成" : "リセットメールを送信"}
          </Button>
        </form>
        {mode === "login" && (
          <button className="text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => setMode("forgot")}>
            パスワードを忘れた方
          </button>
        )}
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? (
            <>アカウントをお持ちでない方は <button className="text-primary font-medium hover:underline" onClick={() => setMode("register")}>新規登録</button></>
          ) : mode === "register" ? (
            <>既にアカウントをお持ちの方は <button className="text-primary font-medium hover:underline" onClick={() => setMode("login")}>ログイン</button></>
          ) : (
            <button className="text-primary font-medium hover:underline" onClick={() => setMode("login")}>ログインに戻る</button>
          )}
        </p>
      </div>
    </div>
  );
}
