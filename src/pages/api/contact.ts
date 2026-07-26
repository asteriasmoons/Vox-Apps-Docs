import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

function requireEnv(name: string) {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

const MAX_MESSAGE_LENGTH = 5_000;
const MAX_ATTACHMENTS = Number(import.meta.env.MAX_UPLOAD_FILES || 3);

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

type ContactAttachment = {
  bytes?: number;
  format?: string;
  name: string;
  resourceType?: string;
  url: string;
};

function parseAttachments(value: FormDataEntryValue | null) {
  const raw = normalizeText(value);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Attachment data is invalid.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Attachment data is invalid.");
  }

  if (parsed.length > MAX_ATTACHMENTS) {
    throw new Error(`Please attach no more than ${MAX_ATTACHMENTS} files.`);
  }

  return parsed.map((entry): ContactAttachment => {
    if (!entry || typeof entry !== "object") {
      throw new Error("Attachment data is invalid.");
    }

    const attachment = entry as Record<string, unknown>;
    const name = typeof attachment.name === "string" ? attachment.name.trim() : "";
    const url = typeof attachment.url === "string" ? attachment.url.trim() : "";
    const resourceType =
      typeof attachment.resourceType === "string"
        ? attachment.resourceType.trim()
        : undefined;
    const format =
      typeof attachment.format === "string" ? attachment.format.trim() : undefined;
    const bytes = typeof attachment.bytes === "number" ? attachment.bytes : undefined;

    if (!name || name.length > 180) {
      throw new Error("Attachment name is invalid.");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("Attachment URL is invalid.");
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "res.cloudinary.com"
    ) {
      throw new Error("Attachment URL is invalid.");
    }

    const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
    if (cloudName && !parsedUrl.pathname.startsWith(`/${cloudName}/`)) {
      throw new Error("Attachment URL is invalid.");
    }

    return {
      bytes,
      format,
      name,
      resourceType,
      url: parsedUrl.toString(),
    };
  });
}

function formatAttachmentList(attachments: ContactAttachment[]) {
  if (attachments.length === 0) return "";

  const rows = attachments.map((attachment, index) => {
    const details = [
      attachment.resourceType,
      attachment.format,
      typeof attachment.bytes === "number"
        ? `${Math.round(attachment.bytes / 1024)} KB`
        : "",
    ].filter(Boolean);

    return `${index + 1}. ${attachment.name}${
      details.length ? ` (${details.join(", ")})` : ""
    }\n${attachment.url}`;
  });

  return `\n\nAttachments:\n${rows.join("\n\n")}\n`;
}

function hasSuspiciousMessageContent(message: string) {
  const lowered = message.toLowerCase();
  const blockedPatterns = [
    "http://",
    "https://",
    "[url=",
    "<a href=",
    "viagra",
    "casino",
    "crypto investment",
  ];

  return blockedPatterns.some((pattern) => lowered.includes(pattern));
}

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 5;

  const existing = hits.get(ip);
  if (!existing || existing.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= max) return { ok: false };

  existing.count += 1;
  hits.set(ip, existing);
  return { ok: true };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = clientAddress || "unknown";
    const rl = rateLimit(ip);
    if (!rl.ok) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Try again in a minute." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return new Response(JSON.stringify({ error: "Invalid form submission." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const name = normalizeText(formData.get("name"));
    const email = normalizeText(formData.get("email"));
    const message = normalizeText(formData.get("message"));
    const website = normalizeText(formData.get("website"));
    const attachments = parseAttachments(formData.get("attachments"));

    // Honeypot
    if (website) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (name.length > 120) {
      return new Response(
        JSON.stringify({ error: "Name is too long." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Message is too long." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (hasSuspiciousMessageContent(message)) {
      return new Response(
        JSON.stringify({ error: "Message could not be accepted." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const SMTP_HOST = requireEnv("SMTP_HOST");
    const SMTP_PORT = Number(requireEnv("SMTP_PORT"));
    const SMTP_USER = requireEnv("SMTP_USER");
    const SMTP_PASS = requireEnv("SMTP_PASS");
    const CONTACT_TO = requireEnv("CONTACT_TO");
    const CONTACT_FROM = requireEnv("CONTACT_FROM");

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `Lystaria Apps Support: ${name}`,
      text:
        `New message from Lystaria Apps Support\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}\n` +
        formatAttachmentList(attachments),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("contact api error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to send message." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
