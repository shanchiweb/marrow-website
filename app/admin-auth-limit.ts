export type LoginAttemptStore = {
  get(key: string): Promise<{ body: ReadableStream; etag: string } | null>;
  put(key: string, value: string, options: { httpMetadata: { contentType: string }; onlyIf: Headers | { etagMatches: string } }): Promise<unknown | null>;
};

export const LOGIN_WINDOW_MS = 10 * 60 * 1000;
export const LOGIN_ATTEMPTS = 5;

export async function reserveLoginAttempt(store: LoginAttemptStore, key: string, now = Date.now()): Promise<{ allowed: boolean; retryAfter: number }> {
  for (let retry = 0; retry < 5; retry++) {
    const object = await store.get(key);
    let state = { attempts: 0, expiresAt: now + LOGIN_WINDOW_MS };
    if (object) {
      const previous = JSON.parse(await new Response(object.body).text());
      if (!Number.isSafeInteger(previous.attempts) || previous.attempts < 0 || !Number.isSafeInteger(previous.expiresAt)) throw new Error("Invalid login limit state");
      if (previous.expiresAt > now) state = previous;
    }
    const retryAfter = Math.max(1, Math.ceil((state.expiresAt - now) / 1000));
    if (state.attempts >= LOGIN_ATTEMPTS) return { allowed: false, retryAfter };
    const stored = await store.put(key, JSON.stringify({ ...state, attempts: state.attempts + 1 }), {
      httpMetadata: { contentType: "application/json" },
      // Conditional R2 writes keep concurrent attempts from losing increments.
      onlyIf: object ? { etagMatches: object.etag } : new Headers({ "If-None-Match": "*" }),
    });
    if (stored !== null) return { allowed: true, retryAfter: 0 };
  }
  return { allowed: false, retryAfter: 10 };
}
