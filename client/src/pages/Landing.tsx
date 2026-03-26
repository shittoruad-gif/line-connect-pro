import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video, Zap, Shield, ChevronRight, Check, ArrowRight,
  Menu, X, Camera, Clock, Link2, RefreshCw, FileText, Calendar,
} from "lucide-react";

// ===== Header =====
function LandingHeader() {
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D8CFF] flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Zoom URL 自動発行</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">機能</a>
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">使い方</a>
            <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-gray-300" onClick={() => navigate("/dashboard")}>
              ログイン
            </Button>
            <Button className="bg-[#2D8CFF] hover:bg-[#2681eb] text-white" onClick={() => navigate("/dashboard")}>
              無料で始める
            </Button>
          </div>

          <button className="md:hidden text-gray-400" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4">
            <nav className="flex flex-col gap-3">
              <a href="#features" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>機能</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>使い方</a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>FAQ</a>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" className="text-gray-300" onClick={() => navigate("/dashboard")}>ログイン</Button>
                <Button size="sm" className="bg-[#2D8CFF] hover:bg-[#2681eb] text-white" onClick={() => navigate("/dashboard")}>無料で始める</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// ===== Hero Section =====
function HeroSection() {
  const [, navigate] = useLocation();
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,140,255,0.15)_0%,_transparent_50%)]" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#2D8CFF]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#D4A843]/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="mb-6 bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20 hover:bg-[#2D8CFF]/15">
          <Zap className="w-3 h-3 mr-1" /> LINEスクショからZoom URLを即発行
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
          スクショ1枚で、
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D8CFF] to-[#D4A843]">
            Zoom URLを自動発行。
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          LINEのグループチャットのスクショをアップロードするだけ。
          <br className="hidden md:block" />
          AIがグループ名と日時を抽出し、Zoom URLを自動生成します。
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-[#2D8CFF] hover:bg-[#2681eb] text-white text-lg px-8 h-14 shadow-lg shadow-[#2D8CFF]/20" onClick={() => navigate("/dashboard")}>
            今すぐ使ってみる
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#2D8CFF]" />
            初期費用0円
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#2D8CFF]" />
            Zoom API連携
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#2D8CFF]" />
            即日利用開始
          </div>
        </div>

        {/* Dashboard preview mock */}
        <div className="mt-16 relative mx-auto max-w-5xl">
          <div className="rounded-xl border border-white/10 bg-[#111118] shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-4 text-xs text-gray-500">Zoom URL 自動発行 - ダッシュボード</span>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "発行済みURL", value: "1,247", icon: Link2, change: "+24" },
                { label: "定期MTG", value: "56", icon: RefreshCw, change: "稼働中" },
                { label: "今月発行", value: "230", icon: Calendar, change: "今月" },
                { label: "OCR精度", value: "98.5%", icon: Camera, change: "正確" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-4 h-4 text-[#2D8CFF]" />
                    <span className="text-xs text-[#D4A843]">{stat.change}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

// ===== Features Section =====
const features = [
  {
    icon: Camera,
    title: "スクショOCR",
    description: "LINEグループチャットのスクリーンショットをAIが解析。グループ名と日時を自動抽出します。",
  },
  {
    icon: Video,
    title: "Zoom URL自動発行",
    description: "Server-to-Server OAuth連携で、ワンクリックでZoomミーティングURLとパスワードを発行。",
  },
  {
    icon: RefreshCw,
    title: "定期ミーティング一括発行",
    description: "毎週・隔週・毎月の定期ミーティングURLを一括生成。追加発行も簡単です。",
  },
  {
    icon: FileText,
    title: "招待文テンプレート",
    description: "変数置換対応の招待文テンプレートで、コピペするだけでクライアントに送信可能。",
  },
  {
    icon: Calendar,
    title: "Googleカレンダー連携",
    description: "発行したミーティングをワンクリックでGoogleカレンダーに追加。OAuth不要。",
  },
  {
    icon: Shield,
    title: "ユーザー別Zoom設定",
    description: "各ユーザーが自分のZoom API認証情報を設定。チームメンバーそれぞれのアカウントで発行可能。",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20">機能紹介</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">Zoom URL発行に必要なすべてを。</h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            スクリーンショット解析から定期ミーティング管理まで、ワンストップで対応。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-white/[0.02] border-white/5 hover:border-[#2D8CFF]/30 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#2D8CFF]/10 flex items-center justify-center mb-4 group-hover:bg-[#2D8CFF]/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#2D8CFF]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== How It Works Section =====
function HowItWorksSection() {
  const steps = [
    { step: "01", title: "スクショをアップロード", description: "LINEグループチャットのスクリーンショットをドラッグ&ドロップ" },
    { step: "02", title: "AIが情報を抽出", description: "グループ名・日時をAI OCRが自動認識して入力フォームに反映" },
    { step: "03", title: "確認してURL発行", description: "タイトルと日時を確認し、ワンクリックでZoom URLを生成" },
    { step: "04", title: "コピー＆共有", description: "招待文テンプレートでURL・パスワードを整形し、そのまま送信" },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(45,140,255,0.05)_0%,_transparent_50%)]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/20">使い方</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">4ステップでZoom URL発行</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-4 p-6 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="text-3xl font-bold text-[#2D8CFF]/30 shrink-0">{s.step}</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FAQ Section =====
const faqs = [
  {
    q: "Zoom APIの設定は必要ですか？",
    a: "はい。Zoom MarketplaceでServer-to-Server OAuthアプリを作成し、Account ID・Client ID・Client Secretをアプリ内の設定画面に入力してください。",
  },
  {
    q: "Zoom APIが未設定でも使えますか？",
    a: "未設定の場合はモックURL（テスト用）が生成されます。実際のZoom URLを発行するにはAPI設定が必要です。",
  },
  {
    q: "定期ミーティングはどのように管理されますか？",
    a: "毎週・隔週・毎月の繰り返しパターンで一括発行でき、後から追加発行や設定変更も可能です。",
  },
  {
    q: "複数ユーザーで利用できますか？",
    a: "はい。各ユーザーが自分のZoom API認証情報を設定でき、それぞれのZoomアカウントでURL発行が可能です。",
  },
  {
    q: "対応しているスクリーンショットは？",
    a: "LINEグループチャットのスクリーンショットに最適化されていますが、日時情報が含まれる画像であれば解析可能です。",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(45,140,255,0.05)_0%,_transparent_50%)]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20">FAQ</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">よくあるご質問</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                <ChevronRight className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openIndex === i ? "rotate-90" : ""}`} />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 pt-0">
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Footer =====
function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2D8CFF] flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Zoom URL 自動発行</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">機能</a>
            <a href="#how-it-works" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">使い方</a>
            <a href="#faq" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">FAQ</a>
          </nav>
          <p className="text-xs text-gray-600">&copy; 2026 Zoom URL 自動発行. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ===== Main Landing Page =====
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FAQSection />
      </main>
      <LandingFooter />
    </div>
  );
}
