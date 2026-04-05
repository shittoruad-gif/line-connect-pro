import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video, Upload, Calendar, Copy, Image, Clock,
  ChevronRight, Check, ArrowRight, Menu, X, Zap, Mail, Shield,
} from "lucide-react";

function LandingHeader() {
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D8CFF] flex items-center justify-center"><Video className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-bold text-white">Zoom URL 自動発行</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">機能</a>
            <a href="#flow" className="text-sm text-gray-400 hover:text-white transition-colors">使い方</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">料金</a>
            <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-gray-300" onClick={() => navigate("/login")}>ログイン</Button>
            <Button className="bg-[#2D8CFF] hover:bg-[#1a7ae8] text-white" onClick={() => navigate("/register")}>無料で始める</Button>
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4">
            <nav className="flex flex-col gap-3">
              <a href="#features" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>機能</a>
              <a href="#flow" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>使い方</a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>料金</a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>FAQ</a>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" className="text-gray-300" onClick={() => navigate("/login")}>ログイン</Button>
                <Button size="sm" className="bg-[#2D8CFF] hover:bg-[#1a7ae8] text-white" onClick={() => navigate("/register")}>無料で始める</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function HeroSection() {
  const [, navigate] = useLocation();
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,140,255,0.15)_0%,_transparent_50%)]" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#2D8CFF]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#2D8CFF]/5 rounded-full blur-[150px]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="mb-6 bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20 hover:bg-[#2D8CFF]/15">
          <Zap className="w-3 h-3 mr-1" /> Zoom URL発行を完全自動化
        </Badge>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
          Zoom URL発行を、
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D8CFF] to-[#1a7ae8]">
            3秒で完了。
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          LINEグループのスクショをアップするだけ。
          <br className="hidden md:block" />
          AIがクライアント名・日時を自動認識し、Zoom URLを即座に発行します。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-[#2D8CFF] hover:bg-[#1a7ae8] text-white text-lg px-8 h-14 shadow-lg shadow-[#2D8CFF]/20" onClick={() => navigate("/register")}>
            無料で始める<ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-white/5 text-lg px-8 h-14" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
            機能を見る
          </Button>
        </div>
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500 flex-wrap">
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#2D8CFF]" />クレジットカード不要</div>
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#2D8CFF]" />初期費用0円</div>
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#2D8CFF]" />最短3分で設定完了</div>
        </div>
        <div className="mt-16 relative mx-auto max-w-4xl">
          <div className="rounded-xl border border-white/10 bg-[#111118] shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-yellow-500/60" /><div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-4 text-xs text-gray-500">Zoom URL 自動発行 - ダッシュボード</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-[#2D8CFF]/5 border border-[#2D8CFF]/20">
                <Video className="w-8 h-8 text-[#2D8CFF]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white">スクショからZoom URLを自動発行</p>
                  <p className="text-xs text-gray-400">AI OCRで名前・日時を認識、ワンクリックで発行</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "今月の発行数", value: "47", icon: Video },
                  { label: "OCR精度", value: "98%", icon: Image },
                  { label: "平均発行時間", value: "3秒", icon: Clock },
                  { label: "招待文生成", value: "42", icon: Mail },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                    <s.icon className="w-4 h-4 text-[#2D8CFF] mb-2" /><p className="text-xl font-bold text-white">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Image, title: "スクショOCR自動認識", description: "LINEグループのスクリーンショットをアップするだけ。AIがクライアント名と打ち合わせ日時を自動で読み取ります。" },
  { icon: Video, title: "ワンクリックZoom発行", description: "OCR結果を確認したら、ボタン一つでZoomミーティングURLを即座に発行。手入力は一切不要です。" },
  { icon: Mail, title: "招待文の自動生成", description: "日時・URL・パスワードを含む招待メッセージを自動生成。テンプレートのカスタマイズも可能です。" },
  { icon: Calendar, title: "Googleカレンダー連携", description: "発行したミーティングをワンクリックでGoogleカレンダーに追加。ダブルブッキングを防止します。" },
  { icon: Copy, title: "履歴管理・CSV出力", description: "過去のミーティングを検索・フィルタ。CSV出力で管理台帳としても活用できます。" },
  { icon: Shield, title: "セキュアなAPI管理", description: "Zoom APIキーはユーザーごとに管理。Server-to-Server OAuthで安全にミーティングを作成します。" },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20">機能紹介</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">Zoom URL発行に必要な機能がすべて揃う</h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">スクショOCRからURL発行、招待文生成まで、Zoom運用をワンストップで管理できます。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="bg-white/[0.02] border-white/5 hover:border-[#2D8CFF]/30 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#2D8CFF]/10 flex items-center justify-center mb-4 group-hover:bg-[#2D8CFF]/20 transition-colors"><f.icon className="w-6 h-6 text-[#2D8CFF]" /></div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { num: "01", title: "LINEスクショをアップロード", desc: "クライアントとの日程調整が入ったLINEグループのスクリーンショットをドラッグ&ドロップ。" },
  { num: "02", title: "AIが自動で解析", desc: "OpenAI Vision APIがクライアント名・日時・ミーティング内容を瞬時に認識します。" },
  { num: "03", title: "内容を確認してZoom発行", desc: "OCR結果を確認・編集し、「Zoomミーティングを作成」ボタンをクリックするだけ。" },
  { num: "04", title: "招待文をコピーして共有", desc: "URL・パスワード入りの招待文が自動生成。そのままLINEやメールに貼り付けて送信。" },
];

function FlowSection() {
  return (
    <section id="flow" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(45,140,255,0.05)_0%,_transparent_50%)]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20">使い方</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">たった4ステップでZoom URL発行</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-4 p-6 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="text-3xl font-bold text-[#2D8CFF]/30 shrink-0">{s.num}</div>
              <div><h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3><p className="text-sm text-gray-400">{s.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const plans = [
  { name: "フリー", price: "0", description: "まずは試してみたい方に", features: ["月10件までのZoom URL発行", "スクショOCR自動認識", "招待文テンプレート", "ミーティング履歴管理"], popular: false },
  { name: "スタンダード", price: "2,980", description: "本格的にZoom運用を効率化", features: ["無制限のZoom URL発行", "スクショOCR自動認識", "招待文テンプレート（カスタム）", "ミーティング履歴・CSV出力", "Googleカレンダー連携", "優先サポート"], popular: true },
];

function PricingSection() {
  const [, navigate] = useLocation();
  return (
    <section id="pricing" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(45,140,255,0.05)_0%,_transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20">料金プラン</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">シンプルな料金体系</h2>
          <p className="mt-4 text-gray-400">無料プランで今すぐ始められます。</p>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative bg-white/[0.02] transition-all duration-300 ${plan.popular ? "border-[#2D8CFF]/50 shadow-lg shadow-[#2D8CFF]/10" : "border-white/10"}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-[#2D8CFF] text-white border-0">おすすめ</Badge></div>}
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-6 mb-6"><span className="text-4xl font-bold text-white">{plan.price === "0" ? "無料" : `¥${plan.price}`}</span>{plan.price !== "0" && <span className="text-gray-500 ml-1">/月</span>}</div>
                <Button className={`w-full ${plan.popular ? "bg-[#2D8CFF] hover:bg-[#1a7ae8] text-white" : "bg-white/10 hover:bg-white/15 text-white"}`} onClick={() => navigate("/register")}>
                  {plan.price === "0" ? "無料で始める" : "プランを選択"}<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-gray-400"><Check className="w-4 h-4 text-[#2D8CFF] mt-0.5 flex-shrink-0" />{f}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "Zoom APIの設定は難しいですか？", a: "Zoom Marketplaceで「Server-to-Server OAuth」アプリを作成し、アカウントID・クライアントID・シークレットの3つを設定画面に入力するだけです。アプリ内にガイドがあります。" },
  { q: "LINEのスクショ以外からも作成できますか？", a: "はい、手動入力モードがあります。クライアント名・日時を手入力してZoom URLを発行することもできます。" },
  { q: "発行したURLの管理はできますか？", a: "はい、全てのミーティング履歴が保存されます。検索・フィルタ・CSV出力にも対応しています。" },
  { q: "データはどこに保存されますか？", a: "すべてのデータはクラウドDBに安全に保存されます。Zoom APIキーなどの認証情報も暗号化して管理しています。" },
  { q: "途中で解約できますか？", a: "いつでも解約可能です。無料プランに戻すだけで追加料金は発生しません。" },
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
              <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                <ChevronRight className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openIndex === i ? "rotate-90" : ""}`} />
              </button>
              {openIndex === i && <div className="px-5 pb-5 pt-0"><p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2D8CFF] flex items-center justify-center"><Video className="w-4 h-4 text-white" /></div>
            <span className="text-sm font-semibold text-white">Zoom URL 自動発行</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">機能</a>
            <a href="#pricing" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">料金</a>
            <a href="#faq" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">FAQ</a>
          </nav>
          <p className="text-xs text-gray-600">&copy; 2025 Zoom URL 自動発行. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <FlowSection />
        <PricingSection />
        <FAQSection />
      </main>
      <LandingFooter />
    </div>
  );
}
