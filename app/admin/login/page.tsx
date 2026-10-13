import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in · Marrow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// 新版后台把登录表单内联在 /admin 页面里，这个地址保留为跳转入口，
// 让此前收藏或记录过 /admin/login 的链接依然可用。
export default function AdminLoginPage() {
  redirect("/admin");
}
