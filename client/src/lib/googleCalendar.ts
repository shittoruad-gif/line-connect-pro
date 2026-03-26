/**
 * Googleカレンダーへの追加URLを生成する（OAuth不要）
 * https://calendar.google.com/calendar/render?action=TEMPLATE&...
 */
export function buildGoogleCalendarUrl(params: {
  title: string;
  startMs: number;
  durationMinutes: number;
  description?: string;
  location?: string;
}): string {
  const start = new Date(params.startMs);
  const end = new Date(params.startMs + params.durationMinutes * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ...(params.description ? { details: params.description } : {}),
    ...(params.location ? { location: params.location } : {}),
  });

  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}
