import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  adminSessionCookie,
  createAdminSession,
  hashAdminPassword,
  isAuthConfigured,
  isSameOrigin,
  verifyAdminPassword,
  verifyAdminSession,
} from "../app/admin-auth-crypto.ts";
import {
  LOGIN_ATTEMPTS,
  LOGIN_WINDOW_MS,
  reserveLoginAttempt,
} from "../app/admin-auth-limit.ts";

// Independent, generated fixtures: no production password or secret is used.
const password = `test-only-${randomBytes(24).toString("hex")}`;
const config = {
  passwordHash: await hashAdminPassword(password),
  sessionSecret: randomBytes(32).toString("hex"),
};
const changedPasswordHash = await hashAdminPassword(`changed-${randomBytes(24).toString("hex")}`);
const now = 1_800_000_000_000;

test("password authentication accepts only the configured password", async () => {
  assert.equal(isAuthConfigured(config), true);
  assert.equal(await verifyAdminPassword(password, config), true);
  assert.equal(await verifyAdminPassword(`${password}-wrong`, config), false);
  assert.equal(await verifyAdminPassword("", config), false);
  assert.equal(await verifyAdminPassword("x".repeat(257), config), false);
  assert.equal(config.passwordHash.includes(password), false);
});

test("missing or invalid authentication configuration fails closed", async () => {
  const token = await createAdminSession(config, now);
  const configurations = [
    { passwordHash: "", sessionSecret: "" },
    { ...config, passwordHash: "" },
    { ...config, sessionSecret: "" },
    { ...config, passwordHash: "not-a-password-hash" },
    { ...config, sessionSecret: "short-secret" },
  ];
  for (const invalid of configurations) {
    assert.equal(isAuthConfigured(invalid), false);
    assert.equal(await verifyAdminPassword(password, invalid), false);
    assert.equal(await verifyAdminSession(token, invalid, now), false);
    await assert.rejects(createAdminSession(invalid, now));
  }
});

test("sessions verify within their lifetime and reject absent, malformed, or tampered tokens", async () => {
  const token = await createAdminSession(config, now);
  assert.equal(await verifyAdminSession(token, config, now), true);
  assert.equal(await verifyAdminSession(token, config, now + ADMIN_SESSION_SECONDS * 1000 - 1), true);
  assert.equal(await verifyAdminSession(token, config, now + ADMIN_SESSION_SECONDS * 1000), false);
  assert.equal(await verifyAdminSession(token, config, now - 1000), false);
  assert.equal(await verifyAdminSession(undefined, config, now), false);
  assert.equal(await verifyAdminSession("", config, now), false);
  assert.equal(await verifyAdminSession("invalid.token", config, now), false);
  assert.equal(await verifyAdminSession(`${token}.extra`, config, now), false);

  const [payload, signature] = token.split(".");
  const tamperedPayload = Buffer.from(JSON.stringify({
    ...JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    exp: Math.floor(now / 1000) + ADMIN_SESSION_SECONDS + 3600,
  })).toString("base64url");
  const tamperedSignature = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  assert.equal(await verifyAdminSession(`${tamperedPayload}.${signature}`, config, now), false);
  assert.equal(await verifyAdminSession(`${payload}.${tamperedSignature}`, config, now), false);
});

test("rotating the session secret or password hash invalidates existing sessions", async () => {
  const token = await createAdminSession(config, now);
  const rotatedSecret = { ...config, sessionSecret: randomBytes(32).toString("hex") };
  const rotatedPassword = { ...config, passwordHash: changedPasswordHash };
  assert.equal(await verifyAdminSession(token, rotatedSecret, now), false);
  assert.equal(await verifyAdminSession(token, rotatedPassword, now), false);
  assert.equal(await verifyAdminSession(await createAdminSession(rotatedSecret, now), rotatedSecret, now), true);
  assert.equal(await verifyAdminSession(await createAdminSession(rotatedPassword, now), rotatedPassword, now), true);
});

test("session cookies have secure browser flags and do not expose credentials", async () => {
  const token = await createAdminSession(config, now);
  const cookie = adminSessionCookie(token, true);
  const attributes = new Set(cookie.split("; "));
  assert.equal(attributes.has(`${ADMIN_COOKIE}=${token}`), true);
  for (const flag of ["Path=/", "HttpOnly", "SameSite=Strict", "Secure", `Max-Age=${ADMIN_SESSION_SECONDS}`]) {
    assert.equal(attributes.has(flag), true, `Missing cookie attribute ${flag}`);
  }
  const decodedPayload = Buffer.from(token.split(".")[0], "base64url").toString("utf8");
  for (const sensitive of [password, config.passwordHash, config.sessionSecret]) {
    assert.equal(cookie.includes(sensitive), false);
    assert.equal(decodedPayload.includes(sensitive), false);
  }
  const localCookie = new Set(adminSessionCookie(token, false).split("; "));
  assert.equal(localCookie.has("Secure"), false);
  assert.equal(localCookie.has("HttpOnly"), true);
  assert.equal(new Set(adminSessionCookie("", true, 0).split("; ")).has("Max-Age=0"), true);
});

test("write requests require an explicit matching origin", () => {
  const url = "https://marrow.example.test/api/admin/login";
  const request = (origin) => new Request(url, {
    method: "POST",
    headers: origin === undefined ? {} : { origin },
  });
  assert.equal(isSameOrigin(request("https://marrow.example.test")), true);
  for (const origin of [
    undefined,
    "",
    "null",
    "not-a-url",
    "https://other.example.test",
    "http://marrow.example.test",
    "https://marrow.example.test:444",
    "https://marrow.example.test.attacker.test",
  ]) {
    assert.equal(isSameOrigin(request(origin)), false, `Unexpectedly accepted ${origin}`);
  }
});

// Simulates R2 compare-and-swap semantics. Reads capture an ETag snapshot;
// conditional writes compare and commit atomically after asynchronous latency.
class AtomicMemoryStore {
  objects = new Map();
  version = 0;

  async get(key) {
    const snapshot = this.objects.get(key);
    await new Promise((resolve) => setImmediate(resolve));
    return snapshot ? { body: new Response(snapshot.value).body, etag: snapshot.etag } : null;
  }

  async put(key, value, options) {
    assert.equal(options.httpMetadata.contentType, "application/json");
    await new Promise((resolve) => setImmediate(resolve));
    const current = this.objects.get(key);
    if (options.onlyIf instanceof Headers) {
      assert.equal(options.onlyIf.get("If-None-Match"), "*");
      if (current) return null;
    } else if (!current || current.etag !== options.onlyIf.etagMatches) {
      return null;
    }
    const stored = { value, etag: `version-${++this.version}` };
    this.objects.set(key, stored);
    return { etag: stored.etag };
  }

  state(key) {
    return JSON.parse(this.objects.get(key).value);
  }
}

test("login limit permits five reservations and denies the sixth without incrementing", async () => {
  const store = new AtomicMemoryStore();
  const key = "test-login-limit";
  assert.equal(LOGIN_ATTEMPTS, 5);
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.deepEqual(await reserveLoginAttempt(store, key, now), { allowed: true, retryAfter: 0 });
    assert.equal(store.state(key).attempts, attempt + 1);
  }
  assert.deepEqual(await reserveLoginAttempt(store, key, now), {
    allowed: false,
    retryAfter: LOGIN_WINDOW_MS / 1000,
  });
  assert.equal(store.state(key).attempts, 5);
  assert.equal((await reserveLoginAttempt(store, "different-key", now)).allowed, true);
});

test("login limit resets exactly at the end of its window", async () => {
  const store = new AtomicMemoryStore();
  const key = "test-window";
  for (let attempt = 0; attempt < LOGIN_ATTEMPTS; attempt++) {
    await reserveLoginAttempt(store, key, now);
  }
  assert.deepEqual(await reserveLoginAttempt(store, key, now + LOGIN_WINDOW_MS - 1), {
    allowed: false,
    retryAfter: 1,
  });
  assert.deepEqual(await reserveLoginAttempt(store, key, now + LOGIN_WINDOW_MS), {
    allowed: true,
    retryAfter: 0,
  });
  assert.deepEqual(store.state(key), { attempts: 1, expiresAt: now + 2 * LOGIN_WINDOW_MS });
});

test("concurrent login reservations do not lose increments or exceed the limit", async () => {
  const store = new AtomicMemoryStore();
  const key = "test-concurrent";
  const results = await Promise.all(Array.from({ length: 24 }, () => reserveLoginAttempt(store, key, now)));
  const accepted = results.filter((result) => result.allowed).length;
  assert.equal(accepted, LOGIN_ATTEMPTS);
  assert.equal(store.state(key).attempts, accepted);
  assert.equal(results.length - accepted, 19);
  assert.equal((await reserveLoginAttempt(store, key, now)).allowed, false);
  assert.equal(store.state(key).attempts, LOGIN_ATTEMPTS);
});
