import { env } from "cloudflare:workers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { subscribers } from "../../../db/schema";

export const dynamic = "force-dynamic";

// 收到订阅通知的邮箱（已在 Cloudflare Email Routing 中验证）
const NOTIFY_TO = "chenyi9705@gmail.com";
// 发件地址，必须属于已接入 Cloudflare 邮件服务的域名
const FROM_ADDRESS = "notify@marrowbridal.com";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type EmailBinding = {
  send(message: {
    to: string;
    from: string;
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
  }): Promise<{ messageId: string }>;
};

function getBindings() {
  const bindings = env as unknown as {
    DB?: unknown;
    EMAIL?: EmailBinding;
  };
  return { db: bindings.DB, email: bindings.EMAIL };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  let payload: { email?: unknown; source?: unknown };
  try {
    payload = (await request.json()) as { email?: unknown; source?: unknown };
  } catch {
    return json({ error: "请求格式不正确。" }, 400);
  }

  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const source =
    typeof payload.source === "string" ? payload.source.slice(0, 120) : null;

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return json({ error: "请输入有效的邮箱地址。" }, 400);
  }

  const { db, email: mailer } = getBindings();

  if (!db && !mailer) {
    return json({ error: "订阅功能暂时不可用，请稍后再试。" }, 503);
  }

  // 访客国家代码（Cloudflare 提供，仅作统计）
  const country = request.headers.get("cf-ipcountry") ?? null;

  // 1) 写入数据库
  let stored = false;
  let storeFailed = false;
  if (db) {
    try {
      const result = await getDb()
        .insert(subscribers)
        .values({ email, source, country })
        .onConflictDoNothing({ target: subscribers.email });
      const changes = (result as unknown as { meta?: { changes?: number } })?.meta
        ?.changes;
      stored = changes === undefined ? true : changes > 0;
    } catch (error) {
      storeFailed = true;
      console.error("订阅写入数据库失败:", error);
    }
  }

  // 重复提交：不重复发通知，直接返回成功
  if (db && !stored && !storeFailed) {
    return json({ ok: true, duplicate: true }, 200);
  }

  // 2) 发送通知邮件（数据库写失败时也发，保证不丢线索）
  let notified = false;
  if (mailer) {
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    const safeEmail = escapeHtml(email);
    try {
      await mailer.send({
        to: NOTIFY_TO,
        from: FROM_ADDRESS,
        replyTo: email,
        subject: `Marrow 官网新订阅：${email}`,
        text: [
          "Marrow 官网收到一条新的邮箱订阅。",
          "",
          `邮箱：${email}`,
          `时间：${now} UTC`,
          `来源：${source ?? "未知"}`,
          `地区：${country ?? "未知"}`,
          "",
          "（直接回复这封邮件即可联系对方）",
        ].join("\n"),
        html: `
          <div style="font-family:-apple-system,'PingFang SC',Helvetica,sans-serif;line-height:1.7;color:#1c1a17">
            <p style="margin:0 0 18px">Marrow 官网收到一条新的邮箱订阅。</p>
            <table style="border-collapse:collapse;font-size:14px">
              <tr><td style="padding:4px 14px 4px 0;color:#8a8378">邮箱</td><td style="padding:4px 0"><strong>${safeEmail}</strong></td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#8a8378">时间</td><td style="padding:4px 0">${now} UTC</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#8a8378">来源</td><td style="padding:4px 0">${escapeHtml(source ?? "未知")}</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#8a8378">地区</td><td style="padding:4px 0">${escapeHtml(country ?? "未知")}</td></tr>
            </table>
            <p style="margin:20px 0 0;color:#8a8378;font-size:13px">直接回复这封邮件即可联系对方。</p>
          </div>
        `,
      });
      notified = true;
      // 记录通知已成功发出，便于日后排查漏发
      if (db) {
        try {
          await getDb()
            .update(subscribers)
            .set({ notifiedAt: sql`(datetime('now'))` })
            .where(eq(subscribers.email, email));
        } catch (error) {
          console.error("记录通知状态失败:", error);
        }
      }
    } catch (error) {
      console.error("订阅通知邮件发送失败:", error);
    }
  }

  // 既没存下也没发出去，才算真的失败
  if (!stored && !notified) {
    return json({ error: "订阅功能暂时不可用，请稍后再试。" }, 503);
  }

  return json({ ok: true, duplicate: false }, 200);
}
