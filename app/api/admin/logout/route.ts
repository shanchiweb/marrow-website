import { clearedSessionCookie, isSecureRequest } from "../../../admin-auth";

export const dynamic = "force-dynamic";

function redirectToLogin(request: Request): Response {
  const headers = new Headers({
    Location: new URL("/admin/login", request.url).toString(),
  });
  headers.append("Set-Cookie", clearedSessionCookie(isSecureRequest(request)));
  return new Response(null, { status: 303, headers });
}

export async function POST(request: Request) {
  return redirectToLogin(request);
}

export async function GET(request: Request) {
  return redirectToLogin(request);
}
