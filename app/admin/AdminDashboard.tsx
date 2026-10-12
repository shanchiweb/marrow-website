"use client";

import { useState } from "react";
/* eslint-disable @next/next/no-html-link-for-pages */
import { defaults, MEDIA_SLOTS, type MediaManifest, type MediaSlot } from "../media-config";

const labels: Record<MediaSlot, string> = {
  "slide-1": "首页轮播 · 原图 1",
  "slide-2": "首页轮播 · 原图 2",
  "slide-3": "首页轮播 · 新图 3",
  "video-1-left": "第一组 · 最左视频框",
  "video-2-left": "第二组 · 左视频框",
  "video-2-middle": "第二组 · 中视频框",
  "video-3-left": "第三组 · 左视频框",
};

function currentUrl(slot: MediaSlot, manifest: MediaManifest) {
  const item = manifest[slot];
  if (item?.type === "upload") return `/api/media/${slot}?v=${item.updatedAt}`;
  if (item?.type === "external") return item.url ?? defaults[slot];
  return defaults[slot];
}

export function AdminDashboard({ initialManifest }: { initialManifest: MediaManifest }) {
  const [manifest, setManifest] = useState(initialManifest);
  const [busy, setBusy] = useState<MediaSlot | null>(null);
  const [messages, setMessages] = useState<Partial<Record<MediaSlot, string>>>({});

  async function submit(slot: MediaSlot, form: FormData) {
    setBusy(slot);
    setMessages((previous) => ({ ...previous, [slot]: "正在保存…" }));
    try {
      form.set("slot", slot);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await response.json() as { error?: string; manifest?: MediaManifest };
      if (!response.ok || !result.manifest) throw new Error(result.error ?? "保存失败");
      setManifest(result.manifest);
      setMessages((previous) => ({ ...previous, [slot]: "已保存，刷新首页即可查看。" }));
    } catch (error) {
      setMessages((previous) => ({ ...previous, [slot]: error instanceof Error ? error.message : "保存失败" }));
    } finally {
      setBusy(null);
    }
  }

  return <main className="admin-page">
    <header className="admin-header"><a href="/" aria-label="Back to Marrow home"><img src="/marrow-wordmark.png" alt="Marrow" /></a><a href="/">查看网站 ↗</a></header>
    <div className="admin-intro"><p>MARROW · CONTENT MANAGEMENT</p><h1>首页素材管理</h1><p>替换轮播图和四处展示视频。上传的素材会保存在网站存储中，所有访客都会看到更新；也可填写 HTTPS 素材链接。视频静音、自动循环播放。</p></div>
    <div className="admin-grid">{MEDIA_SLOTS.map((slot) => {
      const isVideo = slot.startsWith("video-");
      const url = currentUrl(slot, manifest);
      const custom = Boolean(manifest[slot]);
      return <section className="admin-card" key={slot}>
        <div className="admin-preview">{isVideo && custom ? <video src={url} poster={defaults[slot]} muted loop autoPlay playsInline /> : <img src={url} alt={labels[slot]} />}</div>
        <div className="admin-card__body"><div className="admin-card__heading"><h2>{labels[slot]}</h2><span>{custom ? "已替换" : "设计稿默认素材"}</span></div>
          <form onSubmit={(event) => { event.preventDefault(); void submit(slot, new FormData(event.currentTarget)); }}>
            <label>上传{isVideo ? "视频" : "图片"}<input name="file" type="file" accept={isVideo ? "video/*" : "image/*"} /></label>
            <label>或填写 HTTPS 素材链接<input name="url" type="url" placeholder="https://…" /></label>
            <div className="admin-actions"><button type="submit" disabled={busy !== null}>{busy === slot ? "保存中…" : "保存替换"}</button><button type="button" disabled={busy !== null || !custom} onClick={() => { const form = new FormData(); form.set("reset", "true"); void submit(slot, form); }}>恢复默认</button></div>
          </form>
          <p className="admin-message" role="status">{messages[slot] ?? (isVideo ? "建议 MP4 / WebM，单文件不超过 90 MB。" : "建议横向大图，单文件不超过 90 MB。")}</p>
        </div>
      </section>;
    })}</div>
  </main>;
}
