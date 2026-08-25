import { Resvg } from "@resvg/resvg-js";

import type { PublicEventData } from "./types";
import { eventLocation, formatEventDate, formatEventTime, truncated } from "./format";

export async function renderEventShareImage(data: PublicEventData) {
  const event = data.event;
  const artURL = data.artwork?.bannerURL || data.artwork?.url || "";
  const artDataURI = artURL ? await imageDataURI(artURL) : "";
  const titleLines = wrapText(event.title, 27, 3);
  const detail = `${formatEventDate(event)} • ${formatEventTime(event)}`;
  const location = eventLocation(event);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="artClip"><rect x="694" y="80" width="410" height="410" rx="52"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="#0E0D12"/>
  <rect x="54" y="52" width="1092" height="526" rx="58" fill="#19171F" stroke="rgba(242,239,231,0.16)" stroke-width="4"/>
  ${
    artDataURI
      ? `<image href="${artDataURI}" x="694" y="80" width="410" height="410" preserveAspectRatio="xMidYMid slice" clip-path="url(#artClip)"/>`
      : `<rect x="694" y="80" width="410" height="410" rx="52" fill="#22202A" stroke="rgba(242,239,231,0.18)" stroke-width="2"/>
         <text x="899" y="292" fill="#80C6A5" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="800">Lurelia</text>`
  }
  <rect x="92" y="98" width="108" height="108" rx="36" fill="#22202A" stroke="rgba(242,239,231,0.18)" stroke-width="2"/>
  <text x="146" y="162" fill="#80C6A5" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800">${escapeXML((event.iconName || "event").slice(0, 2).toUpperCase())}</text>
  <text x="92" y="260" fill="#8B82F6" font-family="Arial, sans-serif" font-size="66" font-weight="900">
    ${titleLines.map((line, index) => `<tspan x="92" dy="${index === 0 ? 0 : 76}">${escapeXML(line)}</tspan>`).join("")}
  </text>
  <text x="92" y="470" fill="#F2EFE7" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeXML(detail)}</text>
  <text x="92" y="522" fill="#AAA5B4" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeXML(truncated(location, 56))}</text>
  <text x="694" y="548" fill="#F2EFE7" font-family="Arial, sans-serif" font-size="30" font-weight="800">Hosted by ${escapeXML(event.hostDisplayName || "Lurelia")}</text>
  <text x="1030" y="548" fill="#73C6E8" font-family="Arial, sans-serif" font-size="34" font-weight="900" text-anchor="end">Lurelia</text>
</svg>`;

  return new Resvg(svg).render().asPng();
}

function wrapText(text: string, lineLength: number, maxLines: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > lineLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\.*$/, "")}...`;
  }
  return lines.length ? lines : ["Lurelia Event"];
}

function escapeXML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function imageDataURI(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}
