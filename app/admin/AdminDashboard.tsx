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
  "video-psyche-runway-left": "Psyche and Eros · 秀场左侧视频",
  "video-futur-runway-left": "Futur · 秀场左侧视频",
  "video-puella-runway-left": "Puella Aeterna · 秀场左侧视频",
};

const runwaySlots: MediaSlot[] = ["video-psyche-runway-left", "video-futur-runway-left", "video-puella-runway-left"];
const mediaGroups = [
  {
    id: "home",
    title: "首页素材",
    description: "三张轮播图和四处展示视频；首页视频静音、自动循环播放。",
    href: "/",
    linkLabel: "查看首页",
    slots: MEDIA_SLOTS.filter((slot) => !runwaySlots.includes(slot)),
  },
  {
    id: "psyche-runway",
    title: "Psyche and Eros · 秀场视频",
    description: "替换秀场页面左侧视频。播放器支持播放、暂停、音量和进度控制。",
    href: "/collections/psyche-and-eros/runway",
    linkLabel: "查看秀场页",
    slots: ["video-psyche-runway-left" as MediaSlot],
  },
  {
    id: "futur-runway",
    title: "Futur · 秀场视频",
    description: "替换 2026 系列秀场页面左侧视频。播放器支持播放、暂停、音量和进度控制。",
    href: "/collections/futur/runway",
    linkLabel: "查看秀场页",
    slots: ["video-futur-runway-left" as MediaSlot],
  },
  {
    id: "puella-runway",
    title: "Puella Aeterna · 秀场视频",
    description: "替换 2027 系列秀场页面左侧视频。播放器支持播放、暂停、音量和进度控制。",
    href: "/collections/puella-aeterna/runway",
    linkLabel: "查看秀场页",
    slots: ["video-puella-runway-left" as MediaSlot],
  },
];

function currentUrl(slot: MediaSlot, manifest: MediaManifest) {
  const item = manifest[slot];
  if (item?.type === "upload") return `/api/media/${slot}?v=${item.updatedAt}`;
  if (item?.type === "external") return item.url ?? defaults[slot];
  return defaults[slot];
}

export function AdminDashboard({ initialManifest }: { initialManifest: MediaManifest }) {
  const [manifest, setManifest] = useState(initialManifest);
  const [busy, setBusy] = useState<MediaSlot | null>(null);
  const [messages, setMessages] = useState<Partial<Record<MediaSlot, { text: string; saved?: boolean }>>>({});
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error ?? "退出失败，请稍后重试。");
      }
      window.location.replace("/admin");
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "退出失败，请稍后重试。");
      setLoggingOut(false);
    }
  }

  async function submit(slot: MediaSlot, form: FormData) {
    setBusy(slot);
    setMessages((previous) => ({ ...previous, [slot]: { text: "正在保存…" } }));
    try {
      form.set("slot", slot);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await response.json() as { error?: string; manifest?: MediaManifest };
      if (!response.ok || !result.manifest) throw new Error(result.error ?? "保存失败");
      setManifest(result.manifest);
      setMessages((previous) => ({ ...previous, [slot]: { text: "已保存。", saved: true } }));
    } catch (error) {
      setMessages((previous) => ({ ...previous, [slot]: { text: error instanceof Error ? error.message : "保存失败" } }));
    } finally {
      setBusy(null);
    }
  }

  return <main className="admin-page">
    <header className="admin-header"><a href="/" aria-label="Back to Marrow home"><img src="/marrow-wordmark.png" alt="Marrow" /></a><div className="admin-header-actions"><a href="/">查看网站 ↗</a><button className="admin-logout" type="button" disabled={loggingOut || busy !== null} onClick={() => { void logout(); }}>{loggingOut ? "正在退出…" : "退出登录"}</button></div></header>
    {logoutError && <p className="admin-logout-error" role="alert">{logoutError}</p>}
    <div className="admin-intro"><p>MARROW · CONTENT MANAGEMENT</p><h1>网站素材管理</h1><p>管理首页和秀场页面的素材。上传的素材会保存在网站存储中，所有访客都会看到更新；也可填写 HTTPS 素材链接。</p></div>
    {mediaGroups.map((group) => <section className="admin-media-group" aria-labelledby={`admin-group-${group.id}`} key={group.id}>
      <div className="admin-group-heading"><div><h2 id={`admin-group-${group.id}`}>{group.title}</h2><p>{group.description}</p></div><a href={group.href} target="_blank" rel="noreferrer">{group.linkLabel} ↗</a></div>
      <div className="admin-grid">{group.slots.map((slot) => {
      const isVideo = slot.startsWith("video-");
      const isRunway = runwaySlots.includes(slot);
      const url = currentUrl(slot, manifest);
      const custom = Boolean(manifest[slot]);
      const message = messages[slot];
      const preview = !isVideo || !custom ? <img src={url} alt={labels[slot]} /> : isRunway ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- The uploaded-media preview has no separate captions attachment.
        <video src={url} poster={defaults[slot]} controls playsInline preload="metadata" aria-label={labels[slot]} />
      ) : <video src={url} poster={defaults[slot]} muted loop autoPlay playsInline />;
      return <section className="admin-card" key={slot}>
        <div className="admin-preview">{preview}</div>
        <div className="admin-card__body"><div className="admin-card__heading"><h3>{labels[slot]}</h3><span>{custom ? "已替换" : "设计稿默认素材"}</span></div>
          <form onSubmit={(event) => { event.preventDefault(); void submit(slot, new FormData(event.currentTarget)); }}>
            <label>上传{isVideo ? "视频" : "图片"}<input name="file" type="file" accept={isVideo ? "video/*" : "image/*"} /></label>
            <label>或填写 HTTPS 素材链接<input name="url" type="url" placeholder="https://…" /></label>
            <div className="admin-actions"><button type="submit" disabled={busy !== null}>{busy === slot ? "保存中…" : "保存替换"}</button><button type="button" disabled={busy !== null || !custom} onClick={() => { const form = new FormData(); form.set("reset", "true"); void submit(slot, form); }}>恢复默认</button></div>
          </form>
          <p className="admin-message" role="status">{message?.text ?? (isVideo ? "建议 MP4 / WebM，单文件不超过 90 MB。" : "建议横向大图，单文件不超过 90 MB。")}{message?.saved && <> <a href={group.href} target="_blank" rel="noreferrer">{group.linkLabel} ↗</a></>}</p>
        </div>
      </section>;
    })}</div>
    </section>)}
  </main>;
}
