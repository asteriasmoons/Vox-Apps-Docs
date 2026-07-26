import type { APIRoute } from "astro";
import { createHash } from "node:crypto";

function requireEnv(name: string) {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function signParams(params: Record<string, string | number>, apiSecret: string) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${serialized}${apiSecret}`)
    .digest("hex");
}

export const POST: APIRoute = async () => {
  try {
    const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = requireEnv("CLOUDINARY_API_KEY");
    const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
    const assetFolder = requireEnv("CLOUDINARY_UPLOAD_FOLDER");
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      asset_folder: assetFolder,
      public_id_prefix: assetFolder,
      timestamp,
    };

    return new Response(
      JSON.stringify({
        apiKey,
        assetFolder,
        cloudName,
        publicIdPrefix: assetFolder,
        signature: signParams(params, apiSecret),
        timestamp,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("cloudinary signature error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to prepare upload." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
