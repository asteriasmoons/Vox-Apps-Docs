import type { PublicEventData } from "./types";
import { eventLocation, formatEventDate, formatEventTime, truncated } from "./format";
import { eventShareImageURL, eventShareURL } from "./links";

export function buildEventSEO(data: PublicEventData, currentUrl: URL) {
  const event = data.event;
  const eventID = event._id || event.localID || "";
  const title = `${event.title} | Lurelia Event`;
  const description =
    truncated(event.description, 180) ||
    `Join ${event.hostDisplayName || "the host"} for ${event.title} on ${formatEventDate(event)}.`;
  const url = eventShareURL(eventID, currentUrl);
  const image = eventShareImageURL(eventID, currentUrl);

  return {
    title,
    description,
    url,
    image,
    siteName: "Lurelia",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description,
      startDate: event.startDate,
      endDate: event.endDate || event.startDate,
      eventStatus: event.cancelledAt
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: [image],
      url,
      location: {
        "@type": "Place",
        name: event.locationName || eventLocation(event),
        address: event.address || undefined,
      },
      organizer: {
        "@type": "Person",
        name: event.hostDisplayName || "Lurelia host",
      },
      offers: {
        "@type": "Offer",
        url,
        availability: event.registrationClosed
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
        price: "0",
        priceCurrency: "USD",
      },
      performer: {
        "@type": "Person",
        name: event.hostDisplayName || "Lurelia host",
      },
      doorTime: formatEventTime(event),
    },
  };
}
