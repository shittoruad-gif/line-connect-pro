import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import ClientSelector from "@/components/ClientSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, FileText, Pencil, Trash2, Eye, GripVertical, X } from "lucide-react";

type FieldType = "text" | "number" | "email" | "tel" | "select" | "textarea" | "date" | "checkbox";

type FormField = {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options: string[];
};

type FormData = {
  name: string;
  description: string;
  fields: FormField[];
  thankYouMessage: string;
  autoTag: string;
  liffId: string;
};

const emptyField = (): FormField => ({
  id: crypto.randomUUID(),
  type: "text",
  label: "",
  required: false,
  options: [],
});

const emptyForm: FormData = {
  name: "",
  description: "",
  fields: [],
  thankYouMessage: "ご回答ありがとうございました。",
  autoTag: "",
  liffId: "",
};

const fieldTypeLabels: Record<FieldType, string> = {
  text: "テキスト",
  number: "数値",
  email: "メール",
  tel: "電話番号",
  select: "選択肢",
  textarea: "テキストエリア",
  date: "日付",
  checkbox: "チェックボックス",
};

export default function LiffFormsPage() {
  const { selectedClientId } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [viewingFormId, setViewingFormId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: forms, isLoading } = trpc.liffForms.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: submissions } = trpc.liffForms.submissions.useQuery(
    { formId: viewingFormId! },
    { enabled: !!viewingFormId && submissionsOpen }
  );
  const createMut = trpc.liffForms.create.useMutation({
    onSuccess: () => { utils.liffForms.list.invalidate(); setDialogOpen(false); toast.success("フォームを作成しました"); },
  });
  const updateMut = trpc.liffForms.update.useMutation({
    onSuccess: () => { utils.liffForms.list.invalidate(); setDialogOpen(false); toast.success("フォームを更新しました"); },
  });
  const deleteMut = trpc.liffForms.delete.useMutation({
    onSuccess: () => { utils.liffForms.list.invalidate(); toast.success("削除しました"); },
  });
  const toggleMut = trpc.liffForms.update.useMutation({
    onSuccess: () => utils.liffForms.list.invalidate(),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (f: any) => {
    setEditingId(f.id);
    setForm({
      name: f.name,
      description: f.description ?? "",
      fields: f.fields ?? [],
      thankYouMessage: f.thankYouMessage ?? "",
      autoTag: f.autoTag ?? "",
      liffId: f.liffId ?? "",
    });
    setDialogOpen(true);
  };

  const openSubmissions = (formId: number) => {
    setViewingFormId(formId);
    setSubmissionsOpen(true);
  };

  const addField = () => {
    setForm({ ...form, fields: [...form.fields, emptyField()] });
  };

  const removeField = (id: string) => {
    setForm({ ...form, fields: form.fields.filter((f) => f.id !== id) });
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setForm({
      ...form,
      fields: form.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("フォーム名は必須です");
      return;
    }
    if (form.fields.length === 0) {
      toast.error("フィールドを1つ以上追加してください");
      return;
    }
    for (const field of form.fields) {
      if (!field.label.trim()) {
        toast.error("すべてのフィールドにラベルを設定してください");
        return;
      }
      if (field.type === "select" && field.options.length === 0) {
        toast.error(`「${field.label}」の選択肢を設定してください`);
        return;
      }
    }
    const payload = {
      ...form,
      fields: form.fields.map(({ id, ...rest }) => rest),
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, ...payload });
    } else {
      createMut.mutate({ clientId: selectedClientId!, ...payload });
    }
  };

  if (!selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LIFFフォーム管理</h1>
            <p className="text-sm text-muted-foreground mt-1">LIFFアプリ用カスタムフォームの作成・管理</p>
          </div>
          <ClientSelector />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">クライアントを選択してください</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LIFFフォーム管理</h1>
          <p className="text-sm text-muted-foreground mt-1">LIFFアプリ用カスタムフォームの作成・管理</p>
        </div>
        <div className="flex items-center gap-3">
          <ClientSelector />
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> 新規作成
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-48" /></Card>
      ) : !forms || forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">フォームが作成されていません</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>フォーム名</TableHead>
                <TableHead>説明</TableHead>
                <TableHead>フィールド数</TableHead>
                <TableHead>回答数</TableHead>
                <TableHead>有効</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{f.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{f.fields?.length ?? 0} 項目</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{f.submissionCount ?? 0} 件</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={f.isActive}
                      onCheckedChange={(v) => toggleMut.mutate({ id: f.id, isActive: v })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openSubmissions(f.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(f)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => { if (confirm("削除しますか？")) deleteMut.mutate({ id: f.id }); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "フォーム編集" : "新規フォーム作成"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>フォーム名 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例: 体験予約フォーム"
                />
              </div>
              <div>
                <Label>説明</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="フォームの説明..."
                />
              </div>
            </div>

            {/* Fields Builder */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">フィールド設定</Label>
                <Button variant="outline" size="sm" onClick={addField} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> フィールド追加
                </Button>
              </div>
              {form.fields.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
                  フィールドを追加してフォームを作成してください
                </div>
              ) : (
                <div className="space-y-3">
                  {form.fields.map((field, idx) => (
                    <div key={field.id} className="rounded-lg border bg-secondary/30 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground font-medium">#{idx + 1}</span>
                        <div className="flex-1" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeField(field.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">ラベル *</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="例: お名前"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">タイプ</Label>
                          <Select
                            value={field.type}
                            onValueChange={(v) => updateField(field.id, { type: v as FieldType })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(fieldTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(v) => updateField(field.id, { required: v })}
                          />
                          <Label className="text-xs text-muted-foreground">必須</Label>
                        </div>
                      </div>
                      {field.type === "select" && (
                        <div>
                          <Label className="text-xs">選択肢（カンマ区切り）</Label>
                          <Input
                            value={field.options.join(", ")}
                            onChange={(e) =>
                              updateField(field.id, {
                                options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                              })
                            }
                            placeholder="例: 男性, 女性, その他"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <div>
                <Label>完了メッセージ</Label>
                <Textarea
                  value={form.thankYouMessage}
                  onChange={(e) => setForm({ ...form, thankYouMessage: e.target.value })}
                  placeholder="フォーム送信後に表示するメッセージ..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>自動タグ</Label>
                  <Input
                    value={form.autoTag}
                    onChange={(e) => setForm({ ...form, autoTag: e.target.value })}
                    placeholder="例: フォーム回答済み"
                  />
                </div>
                <div>
                  <Label>LIFF ID</Label>
                  <Input
                    value={form.liffId}
                    onChange={(e) => setForm({ ...form, liffId: e.target.value })}
                    placeholder="例: 1234567890-abcdefgh"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editingId ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Modal */}
      <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>回答一覧</DialogTitle>
          </DialogHeader>
          {!submissions || submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">回答がまだありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>回答日時</TableHead>
                    <TableHead>友だち</TableHead>
                    {submissions[0]?.data
                      ? Object.keys(submissions[0].data as Record<string, unknown>).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))
                      : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(sub.createdAt).toLocaleString("ja-JP")}
                      </TableCell>
                      <TableCell className="font-medium">{sub.friendName ?? "-"}</TableCell>
                      {sub.data &&
                        Object.values(sub.data as Record<string, unknown>).map((val: unknown, i: number) => (
                          <TableCell key={i} className="text-sm">{String(val)}</TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmissionsOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
