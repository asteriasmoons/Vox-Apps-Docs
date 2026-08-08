import type {
  LureliaAnnouncementPreview,
  LureliaPostPreview,
  LureliaSharedEvent,
} from "./types";

export function formatEventDate(event: LureliaSharedEvent) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const timeZone = event.timezoneIdentifier || "UTC";
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  });

  if (!end || sameDay(start, end, timeZone)) return formatter.format(start);
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function formatEventTime(event: LureliaSharedEvent) {
  if (event.isAllDay) return "All day";

  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const timeZone = event.timezoneIdentifier || "UTC";
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  if (!end) return formatter.format(start);
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function formatDuration(event: LureliaSharedEvent) {
  if (event.isAllDay) return "All day";
  if (!event.endDate) return "Duration not set";

  const minutes = Math.max(
    0,
    Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / 60000),
  );
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

export function formatRecurrence(event: LureliaSharedEvent) {
  const recurrence = event.recurrence as { frequency?: string; interval?: number } | undefined;
  if (!recurrence?.frequency) return "Does not repeat";

  const interval = recurrence.interval && recurrence.interval > 1 ? recurrence.interval : 1;
  const frequency = recurrence.frequency.toLowerCase();
  if (interval === 1) return `Repeats ${frequency}`;
  return `Repeats every ${interval} ${frequency}s`;
}

export function eventLocation(event: LureliaSharedEvent) {
  return [event.locationName, event.address].filter(Boolean).join(" - ") || "Location not set";
}

export function previewText(
  item: Pick<LureliaPostPreview | LureliaAnnouncementPreview, "bodyHTML" | "bodyMarkdown">,
  fallback = "",
) {
  const source = item.bodyHTML || item.bodyMarkdown || fallback;
  return source
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>~\-[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncated(value: string | undefined, max = 150) {
  const text = (value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}...`;
}

function sameDay(a: Date, b: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  });
  return fmt.format(a) === fmt.format(b);
}
