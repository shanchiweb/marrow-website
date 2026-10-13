import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import { defaults, isMediaSlot, MEDIA_SLOTS } from "../app/media-config.ts";

const runwaySlot = "video-psyche-runway-left";
const futurRunwaySlot = "video-futur-runway-left";
const puellaRunwaySlot = "video-puella-runway-left";
const collectionRunwaySlots = [runwaySlot, futurRunwaySlot, puellaRunwaySlot];
const fixture = {
  manifest: {},
  bucket: null,
};

// Keep the real HTTP route logic, substituting only the Cloudflare storage binding.
const routeSource = await readFile(new URL("../app/api/media/[slot]/route.ts", import.meta.url), "utf8");
globalThis.__runwayMediaTestHooks = {
  getBucket: () => fixture.bucket,
  readManifest: async () => fixture.manifest,
  isMediaSlot,
};
const isolatedSource = routeSource.replace(
  /^import \{ getBucket, isMediaSlot, readManifest \} from "\.\.\/\.\.\/\.\.\/media-store";$/m,
  "const { getBucket, isMediaSlot, readManifest } = globalThis.__runwayMediaTestHooks;",
);
assert.notEqual(isolatedSource, routeSource, "Storage import shim was not applied");
const { GET, HEAD } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(isolatedSource)).toString("base64")}`);
delete globalThis.__runwayMediaTestHooks;

function installUpload(bytes = "0123456789", slot = runwaySlot) {
  const reads = [];
  const metadata = {
    size: Buffer.byteLength(bytes),
    etag: "test-media-etag",
    httpEtag: '"test-media-etag"',
    uploaded: new Date("2026-10-13T00:00:00Z"),
    httpMetadata: { contentType: "video/mp4" },
  };
  fixture.manifest = { [slot]: { type: "upload", key: "test/runway.mp4", updatedAt: 1 } };
  fixture.bucket = {
    async head(key) {
      reads.push({ method: "head", key });
      return metadata;
    },
    async get(key, options) {
      reads.push({ method: "get", key, range: options?.range });
      const range = options?.range;
      const body = range ? bytes.slice(range.offset, range.offset + range.length) : bytes;
      return { ...metadata, body: new Response(body).body };
    },
  };
  return reads;
}

const request = (headers = {}, method = "GET", slot = runwaySlot) => new Request(`https://marrow.example.test/api/media/${slot}?v=1`, { method, headers });
const context = (slot = runwaySlot) => ({ params: Promise.resolve({ slot }) });

test("all three collection runway slots are accepted alongside all seven homepage media slots", () => {
  assert.equal(MEDIA_SLOTS.length, 10);
  for (const slot of ["slide-1", "slide-2", "slide-3", "video-1-left", "video-2-left", "video-2-middle", "video-3-left", ...collectionRunwaySlots]) {
    assert.equal(isMediaSlot(slot), true);
  }
  assert.equal(defaults[runwaySlot], "/design/2025/runway-video-poster.jpg");
  assert.equal(defaults[futurRunwaySlot], "/design/2026/runway-video-poster.jpg");
  assert.equal(defaults[puellaRunwaySlot], "/design/2027/runway-video-poster.jpg");
  assert.equal(isMediaSlot("video-unknown"), false);
});

for (const slot of collectionRunwaySlots) {
test(`${slot} supports upload playback, seeking and an independent reset`, async () => {
  installUpload("0123456789", slot);
  const full = await GET(request({}, "GET", slot), context(slot));
  assert.equal(full.status, 200);
  assert.equal(await full.text(), "0123456789");
  const reads = installUpload("0123456789", slot);
  const response = await GET(request({ Range: "bytes=2-5" }, "GET", slot), context(slot));
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("Content-Range"), "bytes 2-5/10");
  assert.equal(await response.text(), "2345");
  assert.deepEqual(reads, [
    { method: "head", key: "test/runway.mp4" },
    { method: "get", key: "test/runway.mp4", range: { offset: 2, length: 4 } },
  ]);
  for (const sibling of collectionRunwaySlots.filter((value) => value !== slot)) {
    assert.equal((await GET(request({}, "GET", sibling), context(sibling))).status, 404);
    fixture.manifest[sibling] = { type: "upload", key: `test/${sibling}.mp4`, updatedAt: 2 };
  }
  const head = await HEAD(request({}, "HEAD", slot), context(slot));
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), "10");
  assert.equal(await head.text(), "");
  delete fixture.manifest[slot];
  assert.equal((await GET(request({}, "GET", slot), context(slot))).status, 404);
  for (const sibling of collectionRunwaySlots.filter((value) => value !== slot)) {
    const preserved = await GET(request({}, "GET", sibling), context(sibling));
    assert.equal(preserved.status, 200);
    assert.equal(await preserved.text(), "0123456789");
    assert.equal(reads.at(-1).key, `test/${sibling}.mp4`);
  }
});
}

test("full uploaded videos advertise their size and byte-range support", async () => {
  const reads = installUpload();
  const response = await GET(request(), context());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "video/mp4");
  assert.equal(response.headers.get("Content-Length"), "10");
  assert.equal(response.headers.get("Accept-Ranges"), "bytes");
  assert.equal(response.headers.get("ETag"), '"test-media-etag"');
  assert.equal(await response.text(), "0123456789");
  assert.deepEqual(reads, [{ method: "get", key: "test/runway.mp4", range: undefined }]);
});

test("video seeking serves only requested closed, open-ended and suffix bytes", async () => {
  for (const [value, expected, contentRange, range] of [
    ["bytes=2-5", "2345", "bytes 2-5/10", { offset: 2, length: 4 }],
    ["bytes=6-", "6789", "bytes 6-9/10", { offset: 6, length: 4 }],
    ["bytes=-3", "789", "bytes 7-9/10", { offset: 7, length: 3 }],
    ["bytes=8-99", "89", "bytes 8-9/10", { offset: 8, length: 2 }],
    ["bytes=-99", "0123456789", "bytes 0-9/10", { offset: 0, length: 10 }],
  ]) {
    const reads = installUpload();
    const response = await GET(request({ Range: value }), context());
    assert.equal(response.status, 206, value);
    assert.equal(response.headers.get("Content-Range"), contentRange);
    assert.equal(response.headers.get("Content-Length"), String(expected.length));
    assert.equal(await response.text(), expected);
    assert.deepEqual(reads, [
      { method: "head", key: "test/runway.mp4" },
      { method: "get", key: "test/runway.mp4", range },
    ]);
  }
});

test("unsatisfiable ranges return 416 without reading video bytes", async () => {
  for (const value of ["bytes=10-", "bytes=7-4", "bytes=-0", "bytes=9007199254740992-"]) {
    const reads = installUpload();
    const response = await GET(request({ Range: value }), context());
    assert.equal(response.status, 416, value);
    assert.equal(response.headers.get("Content-Range"), "bytes */10");
    assert.equal(await response.text(), "");
    assert.deepEqual(reads, [{ method: "head", key: "test/runway.mp4" }]);
  }
  installUpload("");
  const empty = await GET(request({ Range: "bytes=0-1" }), context());
  assert.equal(empty.status, 416);
  assert.equal(empty.headers.get("Content-Range"), "bytes */0");
});

test("unsupported or malformed range syntax safely receives the full video", async () => {
  for (const value of ["items=0-2", "bytes=0-1,4-5", "bytes=-", "bytes=invalid"]) {
    installUpload();
    const response = await GET(request({ Range: value }), context());
    assert.equal(response.status, 200, value);
    assert.equal(response.headers.has("Content-Range"), false);
    assert.equal(await response.text(), "0123456789");
  }
});

test("If-Range requires an unchanged strong ETag or exact modification time", async () => {
  for (const condition of ['"test-media-etag"', "Tue, 13 Oct 2026 00:00:00 GMT"]) {
    installUpload();
    const response = await GET(request({ Range: "bytes=1-2", "If-Range": condition }), context());
    assert.equal(response.status, 206);
    assert.equal(await response.text(), "12");
  }
  for (const condition of ['"previous-etag"', 'W/"test-media-etag"', "Tue, 13 Oct 2026 00:00:01 GMT", "invalid-date"]) {
    installUpload();
    const response = await GET(request({ Range: "bytes=1-2", "If-Range": condition }), context());
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "0123456789");
  }
});

test("HEAD returns metadata without reading or sending the video body", async () => {
  const reads = installUpload();
  const response = await HEAD(request({ Range: "bytes=1-2" }, "HEAD"), context());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Length"), "10");
  assert.equal(await response.text(), "");
  assert.deepEqual(reads, [{ method: "head", key: "test/runway.mp4" }]);
});

test("missing and external video slots have no uploaded-media response", async () => {
  fixture.manifest = {};
  fixture.bucket = null;
  assert.equal((await GET(request(), context())).status, 404);
  fixture.manifest = { [runwaySlot]: { type: "external", url: "https://example.test/runway.mp4", updatedAt: 1 } };
  assert.equal((await GET(request(), context())).status, 404);
  assert.equal((await GET(request(), context("video-unknown"))).status, 404);
});
