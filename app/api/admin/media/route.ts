import { getBucket, isMediaAdmin, isMediaSlot, readManifest, writeManifest } from "../../../media-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isMediaAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await readManifest(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await isMediaAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== new URL(request.url).host) return Response.json({ error: "Invalid origin" }, { status: 403 });
  } catch {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const form = await request.formData();
  const slot = form.get("slot");
  if (typeof slot !== "string" || !isMediaSlot(slot)) return Response.json({ error: "Invalid slot" }, { status: 400 });
  if (!getBucket()) {
    return Response.json(
      { error: "此部署未连接存储（R2），暂时无法保存素材。请在 Cloudflare 后台启用 R2 后重新部署。" },
      { status: 503 },
    );
  }
  const manifest = await readManifest();
  const file = form.get("file");
  const external = form.get("url");
  const reset = form.get("reset") === "true";
  if (reset) {
    delete manifest[slot];
  } else if (file instanceof File && file.size > 0) {
    const isVideo = slot.startsWith("video-");
    if (isVideo ? !file.type.startsWith("video/") : !file.type.startsWith("image/")) return Response.json({ error: "Wrong file type for this slot" }, { status: 400 });
    if (file.size > 90 * 1024 * 1024) return Response.json({ error: "File must be under 90 MB" }, { status: 413 });
    const bucket = getBucket();
    if (!bucket) return Response.json({ error: "Media storage is unavailable" }, { status: 503 });
    const ext = (file.name.split(".").pop() ?? "bin").replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
    const key = `site-media/${slot}/${crypto.randomUUID()}.${ext}`;
    await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    manifest[slot] = { type: "upload", key, updatedAt: Date.now() };
  } else if (typeof external === "string" && external.trim()) {
    let url: URL;
    try { url = new URL(external.trim()); } catch { return Response.json({ error: "Invalid URL" }, { status: 400 }); }
    if (url.protocol !== "https:") return Response.json({ error: "Use an HTTPS URL" }, { status: 400 });
    manifest[slot] = { type: "external", url: url.toString(), updatedAt: Date.now() };
  } else {
    return Response.json({ error: "Choose a file or enter a URL" }, { status: 400 });
  }
  await writeManifest(manifest);
  return Response.json({ ok: true, manifest });
}
