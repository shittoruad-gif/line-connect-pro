import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Mail, Loader2, Info } from "lucide-react";

const VARIABLES = [
  { key: "{{title}}", desc: "ミーティングタイトル（例：田中商事様広告MTG）" },
  { key: "{{clientName}}", desc: "クライアント名（例：田中商事）" },
  { key: "{{scheduledAt}}", desc: "開始日時（例：2026年3月15日(日) 14:00）" },
  { key: "{{duration}}", desc: "所要時間（分）" },
  { key: "{{joinUrl}}", desc: "Zoom参加URL" },
  { key: "{{password}}", desc: "ミーティングパスワード" },
];

export default function InvitationTemplatePage() {
  const [name, setName] = useState("デフォルト");
  const [template, setTemplate] = useState("");
  const [templateId, setTemplateId] = useState<number | undefined>(undefined);
  const [isDirty, setIsDirty] = useState(false);

  const { data: templates, isLoading, refetch } = trpc.invitationTemplates.list.useQuery();
  const saveMutation = trpc.invitationTemplates.save.useMutation({
    onSuccess: (res) => {
      toast.success("テンプレートを保存しました");
      setTemplateId(res.id);
      setIsDirty(false);
      refetch();
    },
    onError: (err) => toast.error("保存に失敗しました: " + err.message),
  });

  useEffect(() => {
    if (templates && templates.length > 0) {
      const t = templates[0];
      setTemplateId(t.id > 0 ? t.id : undefined);
      setName(t.name);
      setTemplate(t.template);
    }
  }, [templates]);

  const insertVariable = (v: string) => {
    setTemplate(prev => prev + v);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!template.trim()) { toast.error("テンプレートを入力してください"); return; }
    saveMutation.mutate({ id: templateId, name, template, isDefault: true });
  };

  // Live preview with dummy data
  const preview = template
    .replace(/{{title}}/g, "田中商事様広告MTG")
    .replace(/{{clientName}}/g, "田中商事")
    .replace(/{{scheduledAt}}/g, "2026年3月15日(日) 14:00")
    .replace(/{{duration}}/g, "60")
    .replace(/{{joinUrl}}/g, "https://zoom.us/j/123456789?pwd=XXXXXX")
    .replace(/{{password}}/g, "Abc12345");

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-muted-foreground" />
            招待文テンプレート
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ミーティング作成後に自動生成される招待文のテンプレートを設定します
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-4">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">テンプレート編集</CardTitle>
                  <CardDescription>変数を使って動的な招待文を作成できます</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">テンプレート名</Label>
                    <Input
                      value={name}
                      onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                      placeholder="デフォルト"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">本文</Label>
                    <Textarea
                      value={template}
                      onChange={(e) => { setTemplate(e.target.value); setIsDirty(true); }}
                      placeholder="招待文を入力してください..."
                      className="min-h-[280px] font-mono text-sm resize-none"
                    />
                  </div>

                  {/* Variable buttons */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Info className="w-3 h-3" />
                      クリックで挿入
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {VARIABLES.map(v => (
                        <button
                          key={v.key}
                          onClick={() => insertVariable(v.key)}
                          title={v.desc}
                          className="px-2 py-1 rounded-md text-xs font-mono bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors"
                        >
                          {v.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full h-10 font-semibold gap-2"
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !isDirty}
                  >
                    {saveMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />保存中...</>
                    ) : "テンプレートを保存"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    プレビュー
                    <Badge variant="outline" className="text-xs">サンプルデータ</Badge>
                  </CardTitle>
                  <CardDescription>実際の送信時のイメージ</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border min-h-[320px]">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {preview || <span className="text-muted-foreground italic">テンプレートを入力するとプレビューが表示されます</span>}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Variable reference */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">使用可能な変数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {VARIABLES.map(v => (
                      <div key={v.key} className="flex items-start gap-2 text-sm">
                        <code className="shrink-0 px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-primary">{v.key}</code>
                        <span className="text-muted-foreground text-xs mt-0.5">{v.desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
