import { timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
export const ADMIN_COOKIE = "__Host-marrow_admin_session";
export const LOCAL_ADMIN_COOKIE = "marrow_admin_session";
const PASSWORD_ITERATIONS = 100_000;
const encoder = new TextEncoder();

export type AdminAuthConfig = { passwordHash: string; sessionSecret: string };

export function isAuthConfigured(config: AdminAuthConfig): boolean {
  return /^pbkdf2-sha256\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(config.passwordHash)
    && /^[a-f0-9]{64}$/.test(config.sessionSecret);
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function unhex(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(value.match(/../g) ?? [], (pair) => parseInt(pair, 16));
}

async function derivePassword(password: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS }, key, 256));
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${hex(salt)}$${hex(await derivePassword(password, salt))}`;
}

export async function verifyAdminPassword(password: string, config: AdminAuthConfig): Promise<boolean> {
  if (!isAuthConfigured(config) || !password || password.length > 256) return false;
  const [, , salt, expected] = config.passwordHash.split("$");
  return timingSafeEqual(await derivePassword(password, unhex(salt)), unhex(expected));
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unbase64url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid encoding");
  const text = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(text, (character) => character.charCodeAt(0));
}

async function signingKey(config: AdminAuthConfig) {
  // Password changes invalidate existing sessions as well as secret rotation.
  return crypto.subtle.importKey("raw", encoder.encode(`${config.sessionSecret}:${config.passwordHash}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createAdminSession(config: AdminAuthConfig, now = Date.now()): Promise<string> {
  if (!isAuthConfigured(config)) throw new Error("Admin authentication unavailable");
  const issuedAt = Math.floor(now / 1000);
  const payload = base64url(encoder.encode(JSON.stringify({ v: 1, iat: issuedAt, exp: issuedAt + ADMIN_SESSION_SECONDS, nonce: crypto.randomUUID() })));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(config), encoder.encode(payload));
  return `${payload}.${base64url(new Uint8Array(signature))}`;
}

export async function verifyAdminSession(token: string | undefined, config: AdminAuthConfig, now = Date.now()): Promise<boolean> {
  if (!token || token.length > 1024 || !isAuthConfigured(config)) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payload, encodedSignature] = parts;
    const signature = unbase64url(encodedSignature);
    if (signature.length !== 32 || base64url(signature) !== encodedSignature) return false;
    if (!(await crypto.subtle.verify("HMAC", await signingKey(config), signature, encoder.encode(payload)))) return false;
    const session = JSON.parse(new TextDecoder().decode(unbase64url(payload)));
    const seconds = Math.floor(now / 1000);
    return session.v === 1 && typeof session.nonce === "string"
      && Number.isSafeInteger(session.iat) && Number.isSafeInteger(session.exp)
      && session.iat <= seconds && session.exp > seconds
      && session.exp === session.iat + ADMIN_SESSION_SECONDS;
  } catch {
    return false;
  }
}

export function isSameOrigin(request: Request): boolean {
  try {
    const origin = request.headers.get("origin");
    return Boolean(origin) && new URL(origin!).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function adminSessionCookie(token: string, secure: boolean, maxAge = ADMIN_SESSION_SECONDS): string {
  return `${secure ? ADMIN_COOKIE : LOCAL_ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export async function throttleKey(ip: string, config: AdminAuthConfig): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await signingKey(config), encoder.encode(`login-rate:${ip}`));
  return `admin-auth/rate/${hex(new Uint8Array(signature))}.json`;
}
