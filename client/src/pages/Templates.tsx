import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { industryLabels } from "@/components/ClientSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Palette, Dumbbell, Scissors, Heart, Activity, Sparkles, ChevronRight } from "lucide-react";

const industryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  personal_training: Dumbbell,
  beauty_salon: Scissors,
  seitai: Heart,
  pilates: Activity,
  yoga: Sparkles,
};

type TemplateData = {
  industry: string;
  name: string;
  description: string;
  greeting: string;
  autoReplies: { keyword: string; reply: string }[];
  stepMessages: { delay: string; content: string }[];
};

const templates: TemplateData[] = [
  {
    industry: "personal_training",
    name: "パーソナルトレーニング基本セット",
    description: "体験予約・料金案内・トレーニング情報の自動応答とステップ配信",
    greeting: "友だち追加ありがとうございます！\n\n当ジムでは、あなたの目標に合わせたオーダーメイドのトレーニングプランをご提供しています。\n\nまずは無料体験からお気軽にどうぞ！\n下のメニューから「予約する」をタップしてください。",
    autoReplies: [
      { keyword: "予約", reply: "ご予約ありがとうございます！\n\n以下のリンクから、ご希望の日時をお選びください。\nhttps://example.com/booking\n\nご不明な点はお気軽にお問い合わせください。" },
      { keyword: "料金", reply: "料金プランのご案内です。\n\n【月4回コース】¥32,000/月\n【月8回コース】¥56,000/月\n【通い放題】¥80,000/月\n\n※すべて税込み価格です\n※初回体験は無料！" },
      { keyword: "体験", reply: "無料体験のお申し込みありがとうございます！\n\n体験トレーニングは約60分です。\n動きやすい服装とタオル、お飲み物をご持参ください。\n\nご希望の日時をお知らせください。" },
    ],
    stepMessages: [
      { delay: "1日後", content: "改めまして、友だち追加ありがとうございます！\n\n当ジムのトレーナーは全員が有資格者。あなたの体質や目標に合わせた最適なプランをご提案します。\n\nまずはお気軽に体験にお越しください！" },
      { delay: "3日後", content: "トレーニングに関するお役立ち情報をお届けします！\n\n【自宅でできる簡単ストレッチ3選】\n1. 肩甲骨ストレッチ\n2. 股関節ストレッチ\n3. 体幹トレーニング\n\n詳しいやり方は、お気軽にお聞きください！" },
      { delay: "7日後", content: "今なら入会キャンペーン実施中！\n\n体験当日のご入会で\n入会金 ¥11,000 → 無料！\n\nこの機会にぜひお試しください。\nご予約はメニューの「予約する」から！" },
    ],
  },
  {
    industry: "beauty_salon",
    name: "美容サロン基本セット",
    description: "予約案内・メニュー紹介・キャンペーン配信",
    greeting: "友だち追加ありがとうございます！\n\n当サロンの最新メニューやお得なキャンペーン情報をお届けします。\n\nLINE限定クーポンもございますので、ぜひご活用ください！",
    autoReplies: [
      { keyword: "予約", reply: "ご予約はこちらから承ります。\nhttps://example.com/booking\n\nお電話でのご予約も承っております。\nTEL: 03-XXXX-XXXX" },
      { keyword: "メニュー", reply: "【人気メニュー】\n\nカット ¥5,500〜\nカラー ¥7,700〜\nパーマ ¥8,800〜\nトリートメント ¥3,300〜\n\n詳しくはメニューをご覧ください。" },
      { keyword: "クーポン", reply: "LINE限定クーポン！\n\n初回ご来店の方\n全メニュー20%OFF\n\nこのメッセージをご来店時にお見せください。" },
    ],
    stepMessages: [
      { delay: "1日後", content: "友だち追加ありがとうございます！\n\n当サロンでは、お客様一人ひとりに合ったスタイルをご提案しています。\n\n初回限定の特別クーポンをプレゼント！\n「クーポン」と送信してください。" },
      { delay: "5日後", content: "ヘアケアのワンポイントアドバイス！\n\nシャンプー後のトリートメントは、毛先を中心に塗布するのがポイントです。\n\n当サロンおすすめのホームケア商品もございます。お気軽にご相談ください！" },
    ],
  },
  {
    industry: "seitai",
    name: "整体院基本セット",
    description: "予約受付・施術メニュー・健康情報の配信",
    greeting: "友だち追加ありがとうございます！\n\n当院では、お体の不調やお悩みに合わせた施術をご提供しています。\n\n初回限定の特別価格もございますので、お気軽にご相談ください。",
    autoReplies: [
      { keyword: "予約", reply: "ご予約ありがとうございます！\n\n以下のリンクから空き状況をご確認いただけます。\nhttps://example.com/booking\n\nお電話でもご予約可能です。" },
      { keyword: "料金", reply: "施術メニューのご案内\n\n全身整体 60分 ¥6,600\n骨盤矯正 40分 ¥5,500\nヘッドスパ 30分 ¥3,300\n\n初回限定：全メニュー30%OFF" },
    ],
    stepMessages: [
      { delay: "1日後", content: "ご登録ありがとうございます！\n\n肩こり・腰痛・頭痛でお悩みではありませんか？\n\n当院では根本原因にアプローチする施術を行っています。まずはお気軽にご相談ください。" },
      { delay: "3日後", content: "デスクワークの方必見！\n\n【簡単セルフケア】\n1. 1時間に1回は立ち上がる\n2. 肩を大きく回す（前後10回ずつ）\n3. 深呼吸を3回\n\n小さな習慣が大きな変化を生みます！" },
    ],
  },
  {
    industry: "pilates",
    name: "ピラティススタジオ基本セット",
    description: "体験レッスン案内・クラス情報・健康Tips配信",
    greeting: "友だち追加ありがとうございます！\n\n当スタジオでは、初心者から上級者まで楽しめるピラティスレッスンをご用意しています。\n\n体験レッスン受付中！お気軽にお問い合わせください。",
    autoReplies: [
      { keyword: "体験", reply: "体験レッスンのご案内\n\n所要時間：約60分\n持ち物：動きやすい服装、タオル、お水\n料金：¥1,100（税込）\n\nご希望の日時をお知らせください！" },
      { keyword: "スケジュール", reply: "今週のレッスンスケジュール\n\n月・水・金 10:00〜 / 19:00〜\n火・木 11:00〜 / 20:00〜\n土 10:00〜 / 14:00〜\n\n詳細はWebサイトをご確認ください。" },
    ],
    stepMessages: [
      { delay: "1日後", content: "ピラティスに興味をお持ちいただきありがとうございます！\n\nピラティスは姿勢改善・体幹強化・柔軟性向上に効果的です。\n\n初めての方でも安心のマンツーマンレッスンもございます。" },
      { delay: "5日後", content: "ピラティスの効果を最大限に引き出すコツ！\n\n1. 呼吸を意識する\n2. ゆっくり丁寧に動く\n3. 週2〜3回の継続が理想的\n\n体験レッスンで基礎からお伝えします！" },
    ],
  },
];

export default function TemplatesPage() {
  const { selectedClientId } = useClient();
  const [previewTemplate, setPreviewTemplate] = useState<TemplateData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const utils = trpc.useUtils();
  const applyGreeting = trpc.greeting.upsert.useMutation();
  const createAutoReply = trpc.autoReply.create.useMutation();
  const createScenario = trpc.stepScenario.create.useMutation();
  const createStepMessage = trpc.stepMessage.create.useMutation();

  const handleApply = async (template: TemplateData) => {
    if (!selectedClientId) { toast.error("クライアントを選択してください"); return; }
    try {
      await applyGreeting.mutateAsync({ clientId: selectedClientId, messageContent: template.greeting, isActive: true });
      for (const ar of template.autoReplies) {
        await createAutoReply.mutateAsync({ clientId: selectedClientId, keyword: ar.keyword, matchType: "partial", replyType: "text", replyContent: ar.reply, priority: 0 });
      }
      const scenario = await createScenario.mutateAsync({ clientId: selectedClientId, name: `${template.name} シナリオ`, triggerType: "friend_add" });
      for (let i = 0; i < template.stepMessages.length; i++) {
        const sm = template.stepMessages[i];
        const days = parseInt(sm.delay) || (i + 1);
        await createStepMessage.mutateAsync({ scenarioId: scenario.id, stepOrder: i + 1, delayDays: days, delayHours: 0, messageContent: sm.content });
      }
      utils.greeting.get.invalidate();
      utils.autoReply.list.invalidate();
      utils.stepScenario.list.invalidate();
      toast.success(`「${template.name}」を適用しました`);
    } catch (e: any) {
      toast.error(e.message ?? "テンプレートの適用に失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">テンプレート</h1><p className="text-sm text-muted-foreground mt-1">業種別のプリセットテンプレート</p></div>
        <ClientSelector />
      </div>

      {!selectedClientId && (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Palette className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-lg font-medium text-muted-foreground">クライアントを選択してテンプレートを適用</p></CardContent></Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t, i) => {
          const Icon = industryIcons[t.industry] ?? Palette;
          return (
            <Card key={i} className="hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <CardDescription className="mt-1">{t.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">あいさつ</Badge>
                  <Badge variant="secondary">自動応答 x{t.autoReplies.length}</Badge>
                  <Badge variant="secondary">ステップ x{t.stepMessages.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setPreviewTemplate(t); setPreviewOpen(true); }} className="gap-1">
                    <ChevronRight className="h-3 w-3" /> プレビュー
                  </Button>
                  <Button size="sm" onClick={() => handleApply(t)} disabled={!selectedClientId}>
                    適用する
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewTemplate?.name}</DialogTitle></DialogHeader>
          {previewTemplate && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">あいさつメッセージ</h3>
                <div className="rounded-lg bg-secondary/50 p-3"><p className="text-sm whitespace-pre-wrap">{previewTemplate.greeting}</p></div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">自動応答</h3>
                <div className="space-y-2">
                  {previewTemplate.autoReplies.map((ar, i) => (
                    <div key={i} className="rounded-lg bg-secondary/50 p-3">
                      <Badge variant="outline" className="mb-2">{ar.keyword}</Badge>
                      <p className="text-sm whitespace-pre-wrap">{ar.reply}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">ステップ配信</h3>
                <div className="space-y-2">
                  {previewTemplate.stepMessages.map((sm, i) => (
                    <div key={i} className="rounded-lg bg-secondary/50 p-3">
                      <Badge variant="outline" className="mb-2">{sm.delay}</Badge>
                      <p className="text-sm whitespace-pre-wrap">{sm.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>閉じる</Button>
            <Button onClick={() => { if (previewTemplate) handleApply(previewTemplate); setPreviewOpen(false); }} disabled={!selectedClientId}>適用する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
