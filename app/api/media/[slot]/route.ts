import { getBucket, isMediaSlot, readManifest } from "../../../media-store";

export const dynamic = "force-dynamic";

type MediaMetadata = {
  size: number;
  etag: string;
  httpEtag?: string;
  uploaded?: Date;
  httpMetadata?: { contentType?: string };
};
type ByteRange = { offset: number; length: number };
type MediaBucket = {
  head(key: string): Promise<MediaMetadata | null>;
  get(key: string, options?: { range: ByteRange }): Promise<(MediaMetadata & { body: ReadableStream }) | null>;
};
type RouteContext = { params: Promise<{ slot: string }> };

// Unsupported range units and multipart ranges receive the complete response.
// A supported single range that cannot select any bytes receives HTTP 416.
function parseRange(value: string, size: number): ByteRange | null | undefined {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return undefined;
  if (size === 0) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }
  const offset = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(requestedEnd) || offset >= size || requestedEnd < offset) return null;
  const end = Math.min(requestedEnd, size - 1);
  return { offset, length: end - offset + 1 };
}

function allowsRange(request: Request, object: MediaMetadata) {
  const condition = request.headers.get("If-Range");
  if (!condition) return true;
  if (condition.startsWith('"')) return condition === (object.httpEtag ?? `"${object.etag}"`);
  if (condition.startsWith("W/")) return false;
  const timestamp = Date.parse(condition);
  return Boolean(object.uploaded && Number.isFinite(timestamp) && Math.floor(object.uploaded.getTime() / 1000) === Math.floor(timestamp / 1000));
}

async function serveMedia(request: Request, { params }: RouteContext, headOnly = false) {
  const { slot } = await params;
  const notFound = () => new Response(headOnly ? null : "Not found", { status: 404 });
  if (!isMediaSlot(slot)) return notFound();
  const item = (await readManifest())[slot];
  if (!item || item.type !== "upload" || !item.key) return notFound();
  const bucket = getBucket() as MediaBucket | null;
  if (!bucket) return notFound();
  const rangeHeader = headOnly ? null : request.headers.get("Range");
  const object = rangeHeader || headOnly ? await bucket.head(item.key) : await bucket.get(item.key);
  if (!object) return notFound();
  const headers = new Headers({
    "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "Content-Length": String(object.size),
    "ETag": object.httpEtag ?? `"${object.etag}"`,
  });
  if (object.uploaded) headers.set("Last-Modified", object.uploaded.toUTCString());
  if (headOnly) return new Response(null, { headers });

  if (rangeHeader && allowsRange(request, object)) {
    const range = parseRange(rangeHeader, object.size);
    if (range === null) {
      headers.set("Content-Range", `bytes */${object.size}`);
      headers.set("Content-Length", "0");
      return new Response(null, { status: 416, headers });
    }
    if (range) {
      const partial = await bucket.get(item.key, { range });
      if (!partial) return notFound();
      headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
      headers.set("Content-Length", String(range.length));
      return new Response(partial.body, { status: 206, headers });
    }
  }
  const complete = "body" in object ? object as MediaMetadata & { body: ReadableStream } : await bucket.get(item.key);
  if (!complete) return notFound();
  return new Response(complete.body, { headers });
}

export async function GET(request: Request, context: RouteContext) {
  return serveMedia(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return serveMedia(request, context, true);
}
