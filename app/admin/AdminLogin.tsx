"use client";

/* eslint-disable @next/next/no-html-link-for-pages */
import { useState } from "react";

export function AdminLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error ?? "登录失败，请稍后重试。");
      }
      setPassword("");
      window.location.replace("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "登录失败，请稍后重试。");
      setBusy(false);
    }
  }

  return <main className="admin-page admin-login-page">
    <header className="admin-header">
      <a href="/" aria-label="Back to Marrow home"><img src="/marrow-wordmark.png" alt="Marrow" /></a>
      <a href="/">查看网站 ↗</a>
    </header>
    <section className="admin-login-panel" aria-labelledby="admin-login-title">
      <p className="admin-login-overline">MARROW · CONTENT MANAGEMENT</p>
      <h1 id="admin-login-title">素材管理后台</h1>
      {configured ? <>
        <p className="admin-login-copy">请输入后台密码，登录后可替换首页轮播图和视频素材。</p>
        <form onSubmit={(event) => { event.preventDefault(); void login(); }}>
          <label htmlFor="admin-password">后台密码</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" maxLength={256} required value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} aria-describedby="admin-login-error" />
          <button type="submit" disabled={busy}>{busy ? "正在登录…" : "登录后台"}</button>
          <p id="admin-login-error" className="admin-login-error" role="alert">{error}</p>
        </form>
      </> : <p className="admin-login-copy" role="status">后台密码尚未配置，请联系网站管理员完成配置后再登录。</p>}
    </section>
  </main>;
}
