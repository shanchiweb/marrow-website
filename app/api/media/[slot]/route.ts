import { getBucket, isMediaSlot, readManifest } from "../../../media-store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  if (!isMediaSlot(slot)) return new Response("Not found", { status: 404 });
  const item = (await readManifest())[slot];
  if (!item || item.type !== "upload" || !item.key) return new Response("Not found", { status: 404 });
  const object = await getBucket()?.get(item.key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
}
