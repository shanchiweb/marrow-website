import type { Metadata } from "next";
import { AdminDashboard } from "./AdminDashboard";
import { AdminLogin } from "./AdminLogin";
import { isAdminLoginConfigured } from "../admin-auth";
import { isMediaAdmin, readManifest } from "../media-store";

export const metadata: Metadata = { title: "Media Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isMediaAdmin())) return <AdminLogin configured={isAdminLoginConfigured()} />;
  const manifest = await readManifest();
  return <AdminDashboard initialManifest={manifest} />;
}
