import type { PublicEventData } from "./types";

const DEFAULT_API_BASE = "https://appapi.voxiverse.ink";

export function lureliaAPIBase() {
  return (import.meta.env.LURELIA_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, "");
}

export async function fetchPublicEventData(eventID: string): Promise<PublicEventData> {
  const url = `${lureliaAPIBase()}/api/lurelia/public/events/${encodeURIComponent(eventID)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`EVENT_FETCH_FAILED_${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.success || !payload.event) {
    throw new Error("EVENT_PAYLOAD_INVALID");
  }

  return {
    event: payload.event,
    artwork: payload.artwork || null,
    attendeesPreview: payload.attendeesPreview || [],
    rsvpSummary: payload.rsvpSummary || {
      going: 0,
      interested: 0,
      declined: 0,
      pending: 0,
      total: 0,
    },
    discussionPreview: payload.discussionPreview || [],
    postsPreview: payload.postsPreview || [],
    announcementsPreview: payload.announcementsPreview || [],
  };
}
