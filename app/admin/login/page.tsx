import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in · Marrow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminLoginPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await props.searchParams) ?? {};
  const failed = params.error === "1";

  return (
    <main className="admin-login">
      <div className="admin-login__card">
        <img className="admin-login__brand" src="/marrow-wordmark.png" alt="Marrow" />
        <p className="admin-login__eyebrow">MARROW · CONTENT MANAGEMENT</p>
        <h1 className="admin-login__title">Sign in</h1>
        <p className="admin-login__hint">
          请输入后台密码，进入后可替换首页轮播图与四处视频素材。
        </p>
        <form method="POST" action="/api/admin/login">
          {failed ? <p className="admin-login__error">密码不正确，请重新输入。</p> : null}
          <label>
            后台密码
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              autoFocus
            />
          </label>
          <button type="submit">进入后台</button>
        </form>
        <p className="admin-login__foot">
          忘记密码？在 Cloudflare 后台修改 ADMIN_PASSWORD 环境变量即可，改完所有已登录设备会同时失效。
        </p>
      </div>
    </main>
  );
}
