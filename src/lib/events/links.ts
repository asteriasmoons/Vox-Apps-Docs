import type { LureliaSharedEvent } from "./types";

export function siteOrigin(url: URL) {
  return import.meta.env.PUBLIC_SITE_URL || url.origin;
}

export function eventShareURL(eventID: string, currentUrl: URL) {
  return new URL(`/events/${encodeURIComponent(eventID)}`, siteOrigin(currentUrl)).toString();
}

export function eventQRURL(eventID: string, currentUrl: URL) {
  return new URL(`/events/${encodeURIComponent(eventID)}/qr`, siteOrigin(currentUrl)).toString();
}

export function eventShareImageURL(eventID: string, currentUrl: URL) {
  return new URL(`/events/${encodeURIComponent(eventID)}/share.png`, siteOrigin(currentUrl)).toString();
}

export function lureliaDeepLink(event: LureliaSharedEvent) {
  const scheme = import.meta.env.PUBLIC_LURELIA_APP_SCHEME || "lurelia";
  const eventID = event._id || event.localID || "";
  const url = new URL(`${scheme}://events/${encodeURIComponent(eventID)}`);
  if (event.inviteToken) url.searchParams.set("invite", event.inviteToken);
  return url.toString();
}

export function lureliaUniversalLink(event: LureliaSharedEvent) {
  const base =
    import.meta.env.PUBLIC_LURELIA_UNIVERSAL_LINK_BASE ||
    "https://appapi.voxiverse.ink/lurelia/events";
  const eventID = event._id || event.localID || "";
  const url = new URL(`${base.replace(/\/$/, "")}/${encodeURIComponent(eventID)}`);
  if (event.inviteToken) url.searchParams.set("invite", event.inviteToken);
  return url.toString();
}

export function lureliaDownloadURL() {
  return import.meta.env.PUBLIC_LURELIA_DOWNLOAD_URL || "/apps/lurelia";
}
