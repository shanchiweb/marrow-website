import { adminSessionCookie, isSameOrigin } from "../../../admin-auth-crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  const url = new URL(request.url);
  const local = process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1"].includes(url.hostname);
  return Response.json({ ok: true }, { headers: { ...headers, "Set-Cookie": adminSessionCookie("", !local, 0) } });
}
