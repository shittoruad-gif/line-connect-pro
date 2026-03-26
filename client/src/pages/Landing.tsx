import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Bot, Users, BarChart3, Zap, Shield,
  ChevronRight, Check, Star, ArrowRight, Menu, X,
  Smartphone, Layers, Clock, Settings,
} from "lucide-react";

// ===== Header =====
function LandingHeader() {
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#06C755] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LINE Connect Pro</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">機能</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">料金</a>
            <a href="#cases" className="text-sm text-gray-400 hover:text-white transition-colors">導入事例</a>
            <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a>
            <a href="#contact" className="text-sm text-gray-400 hover:text-white transition-colors">お問い合わせ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-gray-300" onClick={() => navigate("/dashboard")}>
              ログイン
            </Button>
            <Button className="bg-[#06C755] hover:bg-[#05b34c] text-white" onClick={() => {
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
            }}>
              無料で始める
            </Button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-400" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4">
            <nav className="flex flex-col gap-3">
              <a href="#features" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>機能</a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>料金</a>
              <a href="#cases" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>導入事例</a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>FAQ</a>
              <a href="#contact" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>お問い合わせ</a>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" className="text-gray-300" onClick={() => navigate("/dashboard")}>ログイン</Button>
                <Button size="sm" className="bg-[#06C755] hover:bg-[#05b34c] text-white">無料で始める</Button>
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
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,199,85,0.15)_0%,_transparent_50%)]" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#06C755]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#06C755]/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="mb-6 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20 hover:bg-[#06C755]/15">
          <Zap className="w-3 h-3 mr-1" /> LINE公式アカウント運用を自動化
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
          LINE運用を、
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06C755] to-[#00e676]">
            もっとスマートに。
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          AIチャットボット、自動応答、ステップ配信、リッチメニュー管理。
          <br className="hidden md:block" />
          50社以上のクライアントを一括管理できるマルチテナントSaaS。
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-[#06C755] hover:bg-[#05b34c] text-white text-lg px-8 h-14 shadow-lg shadow-[#06C755]/20" onClick={() => {
            document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
          }}>
            14日間無料トライアル
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-white/5 text-lg px-8 h-14" onClick={() => {
            document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
          }}>
            機能を見る
          </Button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#06C755]" />
            クレジットカード不要
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#06C755]" />
            初期費用0円
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#06C755]" />
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
              <span className="ml-4 text-xs text-gray-500">LINE Connect Pro - ダッシュボード</span>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "友だち数", value: "12,847", icon: Users, change: "+324" },
                { label: "自動応答", value: "156", icon: MessageSquare, change: "稼働中" },
                { label: "配信数", value: "45,230", icon: BarChart3, change: "今月" },
                { label: "AIチャット", value: "8,912", icon: Bot, change: "会話数" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-4 h-4 text-[#06C755]" />
                    <span className="text-xs text-[#06C755]">{stat.change}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

// ===== Features Section =====
const features = [
  {
    icon: Bot,
    title: "AIチャットボット",
    description: "ビジュアルフローエディタでノーコードでチャットボットを構築。LLM連携で自然な会話を自動化。",
  },
  {
    icon: MessageSquare,
    title: "自動応答メッセージ",
    description: "キーワードベースの自動応答ルールを設定。完全一致・部分一致で柔軟に対応。優先度制御も可能。",
  },
  {
    icon: Clock,
    title: "ステップ配信",
    description: "友だち追加やキーワードをトリガーに、日数・時間ベースの自動シナリオ配信を実現。",
  },
  {
    icon: Smartphone,
    title: "リッチメニュー管理",
    description: "画像アップロード・エリア設定・プレビューまで。LINE APIと連携して直接反映。",
  },
  {
    icon: Layers,
    title: "マルチテナント対応",
    description: "50社以上のクライアントを一括管理。業種別テンプレートで素早くセットアップ。",
  },
  {
    icon: BarChart3,
    title: "配信レポート",
    description: "配信履歴・送信数・失敗数をリアルタイムで確認。クライアントごとの統計ダッシュボード。",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">機能紹介</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">LINE運用に必要な全てを、ワンストップで。</h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            チャットボットから配信管理まで、LINE公式アカウント運用に必要な機能をすべて搭載。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-white/[0.02] border-white/5 hover:border-[#06C755]/30 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#06C755]/10 flex items-center justify-center mb-4 group-hover:bg-[#06C755]/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#06C755]" />
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

// ===== Pricing Section =====
const plans = [
  {
    name: "ベーシック",
    price: "9,800",
    description: "小規模ビジネス向け",
    features: ["クライアント5社まで", "自動応答", "あいさつメッセージ", "友だち管理", "基本レポート", "メールサポート"],
    popular: false,
  },
  {
    name: "プロ",
    price: "29,800",
    description: "成長中のビジネスに最適",
    features: ["クライアント20社まで", "全ベーシック機能", "AIチャットボット", "ステップ配信", "リッチメニュー管理", "業種別テンプレート", "優先サポート"],
    popular: true,
  },
  {
    name: "エンタープライズ",
    price: "49,800",
    description: "大規模運用向け",
    features: ["クライアント無制限", "全プロ機能", "カスタムAIプロンプト", "API連携", "専属担当者", "SLA保証", "オンボーディング支援"],
    popular: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,199,85,0.05)_0%,_transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">料金プラン</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">シンプルで透明な料金体系</h2>
          <p className="mt-4 text-gray-400">すべてのプランに14日間の無料トライアルが付きます。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative bg-white/[0.02] border transition-all duration-300 hover:scale-[1.02] ${plan.popular ? "border-[#06C755]/50 shadow-lg shadow-[#06C755]/10" : "border-white/5"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#06C755] text-white border-0">一番人気</Badge>
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-bold text-white">¥{plan.price}</span>
                  <span className="text-gray-500 ml-1">/月</span>
                </div>
                <Button className={`w-full ${plan.popular ? "bg-[#06C755] hover:bg-[#05b34c] text-white" : "bg-white/5 hover:bg-white/10 text-white"}`} onClick={() => {
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  {plan.popular ? "無料で始める" : "プランを選択"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-[#06C755] mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Cases Section =====
const cases = [
  {
    industry: "パーソナルトレーニングジム",
    company: "FIT BODY Studio",
    result: "友だち追加率が3倍に向上",
    quote: "AIチャットボットで体験予約の自動化ができ、スタッフの負担が大幅に減りました。",
    metrics: { friends: "2,400+", automation: "85%", satisfaction: "4.8/5" },
  },
  {
    industry: "美容サロン",
    company: "Beauty Bloom",
    result: "リピート率が40%改善",
    quote: "ステップ配信で来店後のフォローアップを自動化。お客様との関係性が深まりました。",
    metrics: { friends: "5,200+", automation: "92%", satisfaction: "4.9/5" },
  },
  {
    industry: "歯科クリニック",
    company: "スマイル歯科",
    result: "予約キャンセル率を60%削減",
    quote: "リマインド配信と自動応答で、予約管理の手間が激減。患者満足度も向上しています。",
    metrics: { friends: "3,800+", automation: "78%", satisfaction: "4.7/5" },
  },
];

function CasesSection() {
  return (
    <section id="cases" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">導入事例</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">導入企業の声</h2>
          <p className="mt-4 text-gray-400">様々な業種でLINE Connect Proが活用されています。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <Card key={c.company} className="bg-white/[0.02] border-white/5 hover:border-[#06C755]/20 transition-all duration-300">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-4 text-[#06C755] border-[#06C755]/30">{c.industry}</Badge>
                <h3 className="text-lg font-semibold text-white mb-1">{c.company}</h3>
                <p className="text-[#06C755] font-medium text-sm mb-4">{c.result}</p>
                <p className="text-sm text-gray-400 italic leading-relaxed mb-6">「{c.quote}」</p>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{c.metrics.friends}</p>
                    <p className="text-xs text-gray-500">友だち数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{c.metrics.automation}</p>
                    <p className="text-xs text-gray-500">自動化率</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{c.metrics.satisfaction}</p>
                    <p className="text-xs text-gray-500">満足度</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FAQ Section =====
const faqs = [
  {
    q: "LINE公式アカウントが必要ですか？",
    a: "はい。LINE Connect Proを利用するには、LINE公式アカウントとMessaging APIのチャネルが必要です。無料プランのアカウントでもご利用いただけます。",
  },
  {
    q: "無料トライアル中に機能制限はありますか？",
    a: "トライアル期間中はプロプランの全機能をご利用いただけます。トライアル終了後、プランを選択してください。",
  },
  {
    q: "クライアント数の上限を超えた場合は？",
    a: "プランのクライアント上限に達した場合、上位プランへのアップグレードをご案内します。エンタープライズプランでは無制限にご利用いただけます。",
  },
  {
    q: "データのセキュリティは？",
    a: "すべてのデータはSSL/TLSで暗号化され、セキュアなクラウド環境で管理されています。アクセストークン等の機密情報も暗号化して保存しています。",
  },
  {
    q: "既存のLINE公式アカウントからの移行は可能ですか？",
    a: "はい。既存のアカウント設定をLINE Connect Proに移行できます。リッチメニューや自動応答ルールのインポート機能をご用意しています。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "はい、いつでも解約可能です。解約月の末日まではサービスをご利用いただけます。解約時にデータのエクスポートも可能です。",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(6,199,85,0.05)_0%,_transparent_50%)]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">FAQ</Badge>
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

// ===== Contact Section =====
function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" className="py-20 md:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">お問い合わせ</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">まずはお気軽にご相談ください</h2>
          <p className="mt-4 text-gray-400">14日間無料でお試しいただけます。</p>
        </div>

        {submitted ? (
          <Card className="bg-white/[0.02] border-[#06C755]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#06C755]/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#06C755]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">お問い合わせありがとうございます</h3>
              <p className="text-gray-400">担当者より1営業日以内にご連絡いたします。</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-6 md:p-8">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">会社名</label>
                    <Input
                      required
                      placeholder="株式会社○○"
                      className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">お名前</label>
                    <Input
                      required
                      placeholder="山田 太郎"
                      className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">メールアドレス</label>
                    <Input
                      type="email"
                      required
                      placeholder="email@example.com"
                      className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">電話番号</label>
                    <Input
                      type="tel"
                      placeholder="03-1234-5678"
                      className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">業種</label>
                  <select className="w-full h-10 rounded-md bg-white/[0.03] border border-white/10 text-white px-3 text-sm focus:border-[#06C755] focus:outline-none">
                    <option value="">選択してください</option>
                    <option value="personal_training">パーソナルトレーニング</option>
                    <option value="beauty_salon">美容サロン</option>
                    <option value="seitai">整体院</option>
                    <option value="pilates">ピラティス</option>
                    <option value="yoga">ヨガ</option>
                    <option value="dental">歯科</option>
                    <option value="clinic">クリニック</option>
                    <option value="restaurant">飲食店</option>
                    <option value="retail">小売</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">お問い合わせ内容</label>
                  <Textarea
                    rows={4}
                    placeholder="ご相談内容をお書きください"
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755] resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white h-12">
                  送信する
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
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
            <div className="w-7 h-7 rounded-lg bg-[#06C755] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">LINE Connect Pro</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">機能</a>
            <a href="#pricing" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">料金</a>
            <a href="#cases" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">導入事例</a>
            <a href="#faq" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">FAQ</a>
            <a href="#contact" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">お問い合わせ</a>
          </nav>
          <p className="text-xs text-gray-600">&copy; 2025 LINE Connect Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ===== Main Landing Page =====
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CasesSection />
        <FAQSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}
