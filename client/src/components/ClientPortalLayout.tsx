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
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, MessageSquare,
  Menu, Bot, Send, Users, FileText, Settings,
  ChevronDown, MessageCircle, Target, Megaphone, Bell, CalendarDays,
  Link2, Workflow, FormInput, Headphones, BarChart3,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { trpc } from "@/lib/trpc";
import { Badge } from "./ui/badge";

export type PortalMenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
};

type PortalMenuGroup = {
  label: string;
  items: PortalMenuItem[];
};

const portalMenuGroups: PortalMenuGroup[] = [
  {
    label: "",
    items: [
      { icon: LayoutDashboard, label: "ダッシュボード", path: "/portal" },
    ],
  },
  {
    label: "メッセージ",
    items: [
      { icon: MessageCircle, label: "あいさつメッセージ", path: "/portal/greeting" },
      { icon: Send, label: "ステップ配信", path: "/portal/step-delivery" },
      { icon: Megaphone, label: "セグメント配信", path: "/portal/segment-broadcast" },
      { icon: Bell, label: "リマインダー", path: "/portal/reminders" },
      { icon: Headphones, label: "チャット", path: "/portal/operator-chat" },
      { icon: FileText, label: "配信履歴", path: "/portal/message-logs" },
    ],
  },
  {
    label: "友だち",
    items: [
      { icon: Users, label: "友だち管理", path: "/portal/friends" },
      { icon: Target, label: "スコアリング", path: "/portal/scoring" },
    ],
  },
  {
    label: "コンテンツ",
    items: [
      { icon: Menu, label: "リッチメニュー", path: "/portal/rich-menus" },
      { icon: Bot, label: "自動応答", path: "/portal/auto-replies" },
      { icon: MessageSquare, label: "AIチャット", path: "/portal/chatbot" },
      { icon: FormInput, label: "フォーム", path: "/portal/liff-forms" },
    ],
  },
  {
    label: "自動化・計測",
    items: [
      { icon: Workflow, label: "自動化", path: "/portal/automation" },
      { icon: Link2, label: "クリック計測", path: "/portal/tracking" },
      { icon: BarChart3, label: "CV計測", path: "/portal/conversions" },
    ],
  },
  {
    label: "設定",
    items: [
      { icon: Settings, label: "LINE連携", path: "/portal/line-settings" },
      { icon: CalendarDays, label: "予約管理", path: "/portal/bookings" },
    ],
  },
];

const portalMenuItems: PortalMenuItem[] = portalMenuGroups.flatMap((g) => g.items);

const SIDEBAR_WIDTH_KEY = "portal-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { data: myClient, isLoading: clientLoading } = trpc.portal.myClient.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading || clientLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zoom URL 自動発行</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              クライアントポータル
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              ログインしてLINE公式アカウントの管理を開始しましょう。
            </p>
          </div>
          <a
            href={`/api/oauth/login`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full shadow-lg hover:shadow-xl"
          >
            ログイン
          </a>
        </div>
      </div>
    );
  }

  if (!myClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zoom URL 自動発行</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              アカウントが見つかりません
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              管理者から招待コードを受け取っている場合は、下記から招待を承認してください。
            </p>
          </div>
          <InviteAcceptForm />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <PortalLayoutContent setSidebarWidth={setSidebarWidth} clientName={myClient.name}>
        {children}
      </PortalLayoutContent>
    </SidebarProvider>
  );
}

function InviteAcceptForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const acceptMutation = trpc.invitations.accept.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (err) => setError(err.message),
  });

  if (success) {
    return (
      <div className="text-center">
        <Badge variant="default" className="bg-green-600 text-white px-4 py-2">
          招待を承認しました。ページをリロードしています...
        </Badge>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <input
        type="text"
        placeholder="招待コードを入力"
        value={code}
        onChange={(e) => { setCode(e.target.value); setError(""); }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        onClick={() => acceptMutation.mutate({ code })}
        disabled={!code || acceptMutation.isPending}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 w-full disabled:opacity-50"
      >
        {acceptMutation.isPending ? "処理中..." : "招待を承認"}
      </button>
    </div>
  );
}

type PortalLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  clientName: string;
};

function PortalLayoutContent({
  children,
  setSidebarWidth,
  clientName,
}: PortalLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = portalMenuItems.find((item) => location === item.path || (item.path !== "/portal" && location.startsWith(item.path)));
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
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
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold tracking-tight truncate text-sm">
                    {clientName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    クライアントポータル
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {portalMenuGroups.map((group) => (
              <div key={group.label || "__top"} className="px-2 py-1">
                {group.label && !isCollapsed && (
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {group.label}
                  </div>
                )}
                {group.label && isCollapsed && (
                  <div className="my-1 mx-auto w-4 border-t border-border" />
                )}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = item.path === "/portal"
                      ? location === "/portal"
                      : location.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-9 transition-all font-normal rounded-lg ${isActive ? "font-medium" : ""}`}
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
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
                      クライアント
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
