import {
  createSessionToken,
  isSecureRequest,
  sessionCookie,
  verifyAdminPassword,
} from "../../../admin-auth";

export const dynamic = "force-dynamic";

function redirect(location: string, setCookie?: string): Response {
  const headers = new Headers({ Location: location });
  if (setCookie) headers.append("Set-Cookie", setCookie);
  return new Response(null, { status: 303, headers });
}

/** 只接受同源表单提交，避免被其他站点代为提交。 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const loginUrl = new URL("/admin/login", request.url);

  if (!isSameOrigin(request)) {
    return redirect(loginUrl.toString());
  }

  const form = await request.formData();
  const password = form.get("password");

  if (typeof password !== "string" || !(await verifyAdminPassword(password))) {
    loginUrl.searchParams.set("error", "1");
    return redirect(loginUrl.toString());
  }

  const token = await createSessionToken();
  if (!token) {
    // 没有配置 ADMIN_PASSWORD，后台不可用
    loginUrl.searchParams.set("error", "1");
    return redirect(loginUrl.toString());
  }

  return redirect(
    new URL("/admin", request.url).toString(),
    sessionCookie(token, isSecureRequest(request)),
  );
}
