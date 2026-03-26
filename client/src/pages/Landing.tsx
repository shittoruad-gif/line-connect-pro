import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Bot, Users, BarChart3, Zap,
  ChevronRight, Check, ArrowRight, Menu, X,
  Smartphone, Clock, Bell, Sparkles,
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

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">機能</a>
            <a href="#flow" className="text-sm text-gray-400 hover:text-white transition-colors">使い方</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">料金</a>
            <a href="#cases" className="text-sm text-gray-400 hover:text-white transition-colors">導入事例</a>
            <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-gray-300" onClick={() => navigate("/portal")}>ログイン</Button>
            <Button className="bg-[#06C755] hover:bg-[#05b34c] text-white" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
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
              <a href="#flow" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>使い方</a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>料金</a>
              <a href="#cases" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>導入事例</a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>FAQ</a>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" className="text-gray-300" onClick={() => navigate("/portal")}>ログイン</Button>
                <Button size="sm" className="bg-[#06C755] hover:bg-[#05b34c] text-white">無料で始める</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// ===== Hero =====
function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,199,85,0.15)_0%,_transparent_50%)]" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#06C755]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#06C755]/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="mb-6 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20 hover:bg-[#06C755]/15">
          <Zap className="w-3 h-3 mr-1" /> あなたのLINE公式アカウントを、アプリひとつで管理
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
          お店のLINEを、
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06C755] to-[#00e676]">
            もっとスマートに。
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          自動応答、AIチャットボット、ステップ配信、リッチメニュー。
          <br className="hidden md:block" />
          LINE公式アカウントの運用に必要なすべてを、この1つのアプリで。
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-[#06C755] hover:bg-[#05b34c] text-white text-lg px-8 h-14 shadow-lg shadow-[#06C755]/20" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
            14日間無料で試す
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-white/5 text-lg px-8 h-14" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
            機能を見る
          </Button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500 flex-wrap">
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#06C755]" />クレジットカード不要</div>
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#06C755]" />初期費用0円</div>
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#06C755]" />最短5分で設定完了</div>
        </div>

        {/* App preview */}
        <div className="mt-16 relative mx-auto max-w-5xl">
          <div className="rounded-xl border border-white/10 bg-[#111118] shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-4 text-xs text-gray-500">LINE Connect Pro - マイアカウント</span>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "友だち数", value: "1,284", icon: Users, change: "+32 今週" },
                { label: "自動応答", value: "24", icon: MessageSquare, change: "稼働中" },
                { label: "今月の配信", value: "4,523", icon: BarChart3, change: "+12%" },
                { label: "AIチャット", value: "891", icon: Bot, change: "会話数" },
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

// ===== Features =====
const features = [
  { icon: MessageSquare, title: "自動応答メッセージ", description: "お客様からのよくある質問に24時間自動で応答。営業時間外でも機会を逃しません。キーワード設定だけで簡単スタート。" },
  { icon: Bot, title: "AIチャットボット", description: "AIがお客様の質問を理解して自然に応答。予約受付、メニュー案内、FAQなど、接客をまるごと自動化できます。" },
  { icon: Clock, title: "ステップ配信", description: "友だち追加をきっかけに、最適なタイミングで自動メッセージ。初回クーポン → 来店フォロー → リピート促進を自動化。" },
  { icon: Smartphone, title: "リッチメニュー管理", description: "LINEの画面下部に表示されるメニューを簡単作成。予約、クーポン、お知らせなどへの導線をカスタマイズ。" },
  { icon: Users, title: "友だち（顧客）管理", description: "タグ付け・セグメント分けで顧客を整理。来店回数やステータスに応じた配信で、一人ひとりに最適なアプローチ。" },
  { icon: BarChart3, title: "配信レポート・分析", description: "配信数、開封状況、友だち増加推移をグラフで確認。どの施策が効果的か、データで判断できます。" },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">機能紹介</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">LINE運用に必要な機能が、全部入り。</h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">難しい設定は不要。画面に沿って進めるだけで、あなたのLINE公式アカウントがパワーアップします。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="bg-white/[0.02] border-white/5 hover:border-[#06C755]/30 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#06C755]/10 flex items-center justify-center mb-4 group-hover:bg-[#06C755]/20 transition-colors">
                  <f.icon className="w-6 h-6 text-[#06C755]" />
                </div>
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

// ===== How it works =====
function FlowSection() {
  const steps = [
    { num: "01", title: "アカウント登録", desc: "メールアドレスで簡単登録。LINE公式アカウントのチャネル情報を入力して連携します。" },
    { num: "02", title: "自動応答・メニューを設定", desc: "テンプレートから選ぶだけで、業種に合った自動応答やリッチメニューがすぐに完成。" },
    { num: "03", title: "AIチャットボットを作成", desc: "ビジュアルエディタでフローを組み立て。AIにお店の情報を教えるだけで接客を自動化。" },
    { num: "04", title: "配信・分析で改善", desc: "友だちの反応をレポートで確認。ステップ配信やセグメント配信で、リピート率アップ。" },
  ];

  return (
    <section id="flow" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,199,85,0.05)_0%,_transparent_50%)]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">使い方</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">4ステップで、LINE運用を自動化</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-4 p-6 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="text-3xl font-bold text-[#06C755]/30 shrink-0">{s.num}</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Pricing =====
const plans = [
  { name: "ベーシック", price: "9,800", description: "まずは試したい方に", features: ["友だち1,000人まで", "自動応答", "あいさつメッセージ", "友だち管理", "基本レポート", "メールサポート"], popular: false },
  { name: "プロ", price: "29,800", description: "本格的にLINE運用したい方に", features: ["友だち10,000人まで", "全ベーシック機能", "AIチャットボット", "ステップ配信", "リッチメニュー管理", "業種別テンプレート", "一斉配信", "優先サポート"], popular: true },
  { name: "エンタープライズ", price: "49,800", description: "大規模・複数店舗の運用に", features: ["友だち無制限", "全プロ機能", "カスタムAIプロンプト", "API連携", "複数スタッフ管理", "専属担当者", "SLA保証"], popular: false },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,199,85,0.05)_0%,_transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">料金プラン</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">あなたのビジネスに合ったプランを</h2>
          <p className="mt-4 text-gray-400">すべてのプランに14日間の無料トライアルが付きます。いつでも解約OK。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative bg-white/[0.02] border transition-all duration-300 hover:scale-[1.02] ${plan.popular ? "border-[#06C755]/50 shadow-lg shadow-[#06C755]/10" : "border-white/5"}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-[#06C755] text-white border-0">一番人気</Badge></div>}
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-6 mb-6"><span className="text-4xl font-bold text-white">¥{plan.price}</span><span className="text-gray-500 ml-1">/月（税別）</span></div>
                <Button className={`w-full ${plan.popular ? "bg-[#06C755] hover:bg-[#05b34c] text-white" : "bg-white/5 hover:bg-white/10 text-white"}`} onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
                  {plan.popular ? "無料で始める" : "プランを選択"}<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-gray-400"><Check className="w-4 h-4 text-[#06C755] mt-0.5 flex-shrink-0" />{f}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Cases =====
const cases = [
  {
    industry: "パーソナルトレーニングジム",
    company: "FIT BODY Studio",
    result: "友だち追加率が3倍、体験予約が月40件に",
    quote: "今まで電話やDMで対応していた体験予約がLINEで自動化できました。AIチャットボットが24時間対応してくれるので、営業時間外の予約も取りこぼしがなくなりました。",
    metrics: { friends: "2,400+", automation: "85%", satisfaction: "4.8/5" },
  },
  {
    industry: "美容サロン",
    company: "Beauty Bloom",
    result: "リピート率が40%改善、売上が月120万円アップ",
    quote: "来店後にステップ配信で次回予約を促すようにしたら、リピート率が劇的に上がりました。クーポン配信の開封率も高くて驚いています。",
    metrics: { friends: "5,200+", automation: "92%", satisfaction: "4.9/5" },
  },
  {
    industry: "歯科クリニック",
    company: "スマイル歯科",
    result: "予約キャンセル率を60%削減、受付業務を半減",
    quote: "予約リマインドの自動配信と、よくある質問への自動応答で受付スタッフの負担が大幅に減りました。患者さんの満足度も上がっています。",
    metrics: { friends: "3,800+", automation: "78%", satisfaction: "4.7/5" },
  },
];

function CasesSection() {
  return (
    <section id="cases" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">導入事例</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">実際に使っているお店の声</h2>
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
                  <div className="text-center"><p className="text-lg font-bold text-white">{c.metrics.friends}</p><p className="text-xs text-gray-500">友だち数</p></div>
                  <div className="text-center"><p className="text-lg font-bold text-white">{c.metrics.automation}</p><p className="text-xs text-gray-500">自動化率</p></div>
                  <div className="text-center"><p className="text-lg font-bold text-white">{c.metrics.satisfaction}</p><p className="text-xs text-gray-500">満足度</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FAQ =====
const faqs = [
  { q: "LINE公式アカウントを持っていなくても使えますか？", a: "LINE公式アカウント（無料で作成可能）が必要です。アカウントの作成方法もサポートしますので、お気軽にご相談ください。" },
  { q: "パソコンが苦手でも設定できますか？", a: "はい。画面の案内に沿って進めるだけで設定できます。業種別のテンプレートもあるので、最短5分で自動応答がスタートできます。" },
  { q: "今使っているLINE公式アカウントをそのまま使えますか？", a: "はい。既存のLINE公式アカウントとそのまま連携できます。友だちリストもそのまま引き継がれます。" },
  { q: "スタッフが複数人でも使えますか？", a: "プロプラン以上では複数スタッフでのログインに対応しています。スタッフごとに操作権限を設定できます。" },
  { q: "途中でプランを変更できますか？", a: "はい、いつでもプラン変更可能です。アップグレードは即時反映、ダウングレードは次の更新日から適用されます。" },
  { q: "解約はいつでもできますか？", a: "はい、いつでも解約可能です。解約手数料はかかりません。解約月の末日まではサービスをご利用いただけます。" },
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

// ===== Contact =====
function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section id="contact" className="py-20 md:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20">お問い合わせ</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">まずは無料で試してみませんか？</h2>
          <p className="mt-4 text-gray-400">14日間、プロプランの全機能を無料でお試しいただけます。</p>
        </div>
        {submitted ? (
          <Card className="bg-white/[0.02] border-[#06C755]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#06C755]/20 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-[#06C755]" /></div>
              <h3 className="text-xl font-semibold text-white mb-2">お申し込みありがとうございます</h3>
              <p className="text-gray-400">ご登録のメールアドレスにログイン情報をお送りします。</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-6 md:p-8">
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">店舗名・会社名</label><Input required placeholder="○○サロン" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]" /></div>
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">お名前</label><Input required placeholder="山田 太郎" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">メールアドレス</label><Input type="email" required placeholder="email@example.com" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]" /></div>
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">電話番号</label><Input type="tel" placeholder="03-1234-5678" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755]" /></div>
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
                <div><label className="block text-sm font-medium text-gray-300 mb-2">ご質問・ご要望（任意）</label><Textarea rows={3} placeholder="気になること、実現したいことなどお書きください" className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-[#06C755] resize-none" /></div>
                <Button type="submit" size="lg" className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white h-12">無料トライアルを始める<ArrowRight className="w-4 h-4 ml-2" /></Button>
                <p className="text-xs text-gray-500 text-center">クレジットカードの登録は不要です。14日間すべての機能をお試しいただけます。</p>
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
            <div className="w-7 h-7 rounded-lg bg-[#06C755] flex items-center justify-center"><MessageSquare className="w-4 h-4 text-white" /></div>
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

// ===== Main =====
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <FlowSection />
        <PricingSection />
        <CasesSection />
        <FAQSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}
