import { getAdminAuthConfig } from "../../../admin-auth";
import { adminSessionCookie, createAdminSession, isAuthConfigured, isSameOrigin, throttleKey, verifyAdminPassword } from "../../../admin-auth-crypto";
import { reserveLoginAttempt } from "../../../admin-auth-limit";
import { getBucket } from "../../../media-store";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const error = (message: string, status: number, extra: Record<string, string> = {}) => Response.json({ error: message }, { status, headers: { ...noStore, ...extra } });

async function readPassword(request: Request): Promise<string | null> {
  if (!request.headers.get("content-type")?.startsWith("application/json") || !request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    length += chunk.value.length;
    if (length > 2048) { await reader.cancel(); return null; }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return typeof data.password === "string" && data.password.length > 0 && data.password.length <= 256 ? data.password : null;
  } catch { return null; }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return error("请从本网站的后台登录页面操作。", 403);
  const url = new URL(request.url);
  const localDevelopment = process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localDevelopment) return error("后台登录需要 HTTPS。", 403);
  const config = getAdminAuthConfig();
  const bucket = getBucket();
  // R2 未连接时仍允许登录：只校验密码，跳过基于 R2 的限流（见下方 attempt）。
  if (!isAuthConfigured(config)) return error("后台登录配置暂不可用，请联系网站管理员。", 503);
  try {
    const password = await readPassword(request);
    if (!password) return error("请输入有效的后台密码。", 400);
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const attempt = bucket
      ? await reserveLoginAttempt(bucket, await throttleKey(ip, config))
      : { allowed: true, retryAfter: 0 };
    if (!attempt.allowed) return error("登录尝试过多，请稍后再试。", 429, { "Retry-After": String(attempt.retryAfter) });
    if (!(await verifyAdminPassword(password, config))) return error("密码不正确，请重新输入。", 401);
    return Response.json({ ok: true }, { headers: { ...noStore, "Set-Cookie": adminSessionCookie(await createAdminSession(config), !localDevelopment) } });
  } catch {
    return error("后台登录暂时不可用，请稍后重试。", 503);
  }
}
