import { useClient } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

const industryLabels: Record<string, string> = {
  personal_training: "パーソナルトレーニング",
  beauty_salon: "美容サロン",
  seitai: "整体院",
  pilates: "ピラティス",
  yoga: "ヨガ",
  dental: "歯科",
  clinic: "クリニック",
  restaurant: "飲食店",
  retail: "小売",
  other: "その他",
};

export default function ClientSelector() {
  const { selectedClientId, setSelectedClientId } = useClient();
  const { data: clients, isLoading } = trpc.clients.list.useQuery({});

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 animate-pulse">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">読み込み中...</span>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">クライアント未登録</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={selectedClientId?.toString() ?? ""}
        onValueChange={(val) => setSelectedClientId(parseInt(val, 10))}
      >
        <SelectTrigger className="w-[240px] bg-secondary/50 border-border">
          <SelectValue placeholder="クライアントを選択" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id.toString()}>
              <div className="flex items-center gap-2">
                <span>{client.name}</span>
                <span className="text-xs text-muted-foreground">
                  {industryLabels[client.industry] ?? client.industry}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { industryLabels };
