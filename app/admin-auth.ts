import { env } from "cloudflare:workers";
import { cookies, headers } from "next/headers";
import { ADMIN_COOKIE, LOCAL_ADMIN_COOKIE, isAuthConfigured, verifyAdminSession, type AdminAuthConfig } from "./admin-auth-crypto";

export function getAdminAuthConfig(): AdminAuthConfig {
  const bindings = env as unknown as { ADMIN_PASSWORD_HASH?: string; ADMIN_SESSION_SECRET?: string };
  return { passwordHash: bindings.ADMIN_PASSWORD_HASH ?? "", sessionSecret: bindings.ADMIN_SESSION_SECRET ?? "" };
}

export function isAdminLoginConfigured(): boolean {
  return isAuthConfigured(getAdminAuthConfig());
}

export async function isMediaAdmin(): Promise<boolean> {
  const host = (await headers()).get("host") ?? "";
  const local = process.env.NODE_ENV === "development" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const token = (await cookies()).get(local ? LOCAL_ADMIN_COOKIE : ADMIN_COOKIE)?.value;
  return verifyAdminSession(token, getAdminAuthConfig());
}
