import { env } from "cloudflare:workers";
import { headers } from "next/headers";

/**
 * 后台管理登录。
 *
 * 密码从 Cloudflare 环境变量 ADMIN_PASSWORD 读取（本地可写在 .dev.vars 里）。
 * 登录成功后下发一个 HMAC 签名的 cookie，无需数据库或会话存储。
 *
 * 安全特性：
 * - 未设置 ADMIN_PASSWORD 时一律拒绝（fail-safe，不会裸奔）
 * - cookie 里带过期时间，默认 30 天
 * - 改密码即让所有已登录会话失效（签名密钥就是密码本身）
 * - 密码比较用定长比较，避免时序侧信道
 */

export const SESSION_COOKIE = "marrow_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getAdminPassword(): string | null {
  const value = (env as unknown as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** 是否已经配置了后台密码。没配的话后台完全不可用。 */
export function isAdminConfigured(): boolean {
  return getAdminPassword() !== null;
}

async function hmacHex(payload: string, password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

/** 校验用户输入的密码。 */
export async function verifyAdminPassword(input: string): Promise<boolean> {
  const password = getAdminPassword();
  if (!password) return false;
  return constantTimeEqual(input, password);
}

/** 生成一个新的会话令牌，形如 `<过期时间戳>.<签名>`。 */
export async function createSessionToken(): Promise<string | null> {
  const password = getAdminPassword();
  if (!password) return null;
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  return `${payload}.${await hmacHex(payload, password)}`;
}

/** 校验当前请求携带的会话 cookie 是否有效。 */
async function hasValidSession(): Promise<boolean> {
  const password = getAdminPassword();
  if (!password) return false;

  const token = readCookie((await headers()).get("cookie"), SESSION_COOKIE);
  if (!token) return false;

  const separator = token.indexOf(".");
  if (separator === -1) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return constantTimeEqual(signature, await hmacHex(payload, password));
}

/** 当前请求是否可以访问后台。 */
export async function isMediaAdmin(): Promise<boolean> {
  if (await hasValidSession()) return true;

  // 设 ADMIN_REQUIRE_LOGIN=1 可强制走登录流程，
  // 用来在本地预演「部署到线上之后」的后台行为。
  if (process.env.ADMIN_REQUIRE_LOGIN === "1") return false;

  // 本地开发便利：localhost / 127.0.0.1 免登录（与改造前保持一致）
  if (process.env.NODE_ENV !== "development") return false;
  const host = (await headers()).get("host") ?? "";
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}

/** 构造 Set-Cookie 头。 */
export function sessionCookie(token: string, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

/** 构造清除 cookie 的 Set-Cookie 头。 */
export function clearedSessionCookie(secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

/** 请求是否走 HTTPS（决定 cookie 是否加 Secure）。 */
export function isSecureRequest(request: Request): boolean {
  if (new URL(request.url).protocol === "https:") return true;
  return request.headers.get("x-forwarded-proto") === "https";
}
