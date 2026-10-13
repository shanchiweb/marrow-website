import { env } from "cloudflare:workers";
import { defaults, type MediaManifest, type MediaSlot } from "./media-config";
export { defaults, MEDIA_SLOTS, isMediaSlot } from "./media-config";
export type { MediaManifest, MediaSlot } from "./media-config";
export { isMediaAdmin } from "./admin-auth";

type StoredObject = { body: ReadableStream; etag: string; httpMetadata?: { contentType?: string } };
type Bucket = {
  get(key: string): Promise<StoredObject | null>;
  put(key: string, value: ReadableStream | string, options?: { httpMetadata?: { contentType: string }; onlyIf?: Headers | { etagMatches: string } }): Promise<{ etag: string } | null>;
};

export function getBucket(): Bucket | null {
  return (env as unknown as { BUCKET?: Bucket }).BUCKET ?? null;
}

export async function readManifest(): Promise<MediaManifest> {
  const bucket = getBucket();
  if (!bucket) return {};
  const object = await bucket.get("site-media/manifest.json");
  if (!object) return {};
  try {
    const text = await new Response(object.body).text();
    return JSON.parse(text) as MediaManifest;
  } catch {
    return {};
  }
}

export async function writeManifest(manifest: MediaManifest) {
  const bucket = getBucket();
  if (!bucket) throw new Error("Media storage is unavailable");
  await bucket.put("site-media/manifest.json", JSON.stringify(manifest), { httpMetadata: { contentType: "application/json" } });
}

export function mediaUrl(slot: MediaSlot, manifest: MediaManifest): string {
  const item = manifest[slot];
  if (item?.type === "external" && item.url) return item.url;
  if (item?.type === "upload" && item.key) return `/api/media/${slot}?v=${item.updatedAt}`;
  return defaults[slot];
}
