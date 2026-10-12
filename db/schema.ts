import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 页脚邮箱订阅：客户提交的邮箱会存到这里，同时发一封通知邮件给品牌方。
export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  // 提交来源页面路径，便于日后区分
  source: text("source"),
  // Cloudflare 提供的访客国家代码（如 CN / US），仅作统计参考
  country: text("country"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  // 通知邮件成功发出的时间；为空表示发送失败或尚未发送
  notifiedAt: text("notified_at"),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
