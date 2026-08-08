import type { APIRoute } from "astro";

import { fetchPublicEventData } from "../../../lib/events/api";
import { renderEventShareImage } from "../../../lib/events/share-image";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const eventID = params.eventID || "";
    const data = await fetchPublicEventData(eventID);
    const png = await renderEventShareImage(data);

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch {
    return new Response("Event share image not found", { status: 404 });
  }
};
