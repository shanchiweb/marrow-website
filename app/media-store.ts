import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getChatGPTUser } from "./chatgpt-auth";
import { defaults, type MediaManifest, type MediaSlot } from "./media-config";
export { defaults, MEDIA_SLOTS, isMediaSlot } from "./media-config";
export type { MediaManifest, MediaSlot } from "./media-config";

type StoredObject = { body: ReadableStream; httpMetadata?: { contentType?: string } };
type Bucket = {
  get(key: string): Promise<StoredObject | null>;
  put(key: string, value: ReadableStream | string, options?: { httpMetadata?: { contentType: string } }): Promise<unknown>;
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

const OWNER_USER_ID = "3f675b26-26ba-45a7-b4c8-f17fc48a8b04";

export async function isMediaAdmin(): Promise<boolean> {
  const user = await getChatGPTUser();
  if (user) return user.userId === OWNER_USER_ID;
  if (process.env.NODE_ENV !== "development") return false;
  const host = (await headers()).get("host") ?? "";
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}
