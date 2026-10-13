import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("navigation keeps the requested pages and replaces the Wedding Dresses route with a menu", async () => {
  const header = await read("app/components/SiteHeader.tsx");
  for (const route of ["/about", "/boutique", "/retailers"]) {
    assert.ok(header.includes(`href: "${route}"`), `Missing ${route}`);
  }
  assert.match(header, /href="\/"/);
  assert.doesNotMatch(header, /href="\/wedding-dresses"/);
  assert.match(header, /<button[^>]+aria-controls="wedding-collections-menu"/);
  assert.match(header, /const collections = \["Puella Aeterna\.", "Futur\.", "Psyche and Eros\."\]/);
  for (const item of ["Runway", "LookBook", "Accessories"]) assert.match(header, new RegExp(`label: "${item}"`));
  assert.match(header, /const collectionRoots = \["\/collections\/puella-aeterna", "\/collections\/futur", "\/collections\/psyche-and-eros"\]/);
  assert.match(header, /href={`\$\{collectionRoots\[index\]\}\/\$\{entry.kind\}`}/);
  await Promise.all(["app/page.tsx", "app/about/page.tsx", "app/boutique/page.tsx", "app/retailers/page.tsx"].map((path) => access(new URL(path, root))));
  await assert.rejects(access(new URL("app/wedding-dresses/page.tsx", root)), { code: "ENOENT" });
});

test("original carousel images and new third image remain available", async () => {
  await Promise.all(["public/home-01.png", "public/home-02.png", "public/design/home-03.jpg"].map((path) => access(new URL(path, root))));
  const page = await read("app/page.tsx");
  assert.match(page, /slide-1.*slide-2.*slide-3/s);
});

test("all four confirmed video slots have default artwork", async () => {
  const config = await read("app/media-config.ts");
  for (const slot of ["video-1-left", "video-2-left", "video-2-middle", "video-3-left"]) {
    assert.match(config, new RegExp(`"${slot}": "/design/`));
  }
  const manifest = JSON.parse(await read(".openai/hosting.json"));
  // 本项目保留了「未连接 R2 也能上线」的降级配置，因此 r2 允许为 null。
  // 但一旦启用，绑定名必须是 BUCKET —— media-store 读的是 env.BUCKET。
  assert.ok(
    manifest.r2 === null || manifest.r2 === "BUCKET",
    `r2 必须是 null（未启用）或 "BUCKET"，当前为 ${JSON.stringify(manifest.r2)}`,
  );
});

test("editorial hover labels cover the four runway and three lookbook frames", async () => {
  const editorial = await read("app/components/HomeEditorial.tsx");
  assert.match(editorial, /className={`editorial-frame \$\{className\}`} data-editorial-cursor="RUNWAY"/);
  assert.equal((editorial.match(/<VideoFrame /g) ?? []).length, 4);
  for (const frame of ["one-right", "two-right", "three-middle"]) {
    assert.match(editorial, new RegExp(`editorial-frame--${frame}[^>]*data-editorial-cursor="LOOKBOOK"`));
  }
});
