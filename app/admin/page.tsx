import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDashboard } from "./AdminDashboard";
import { isMediaAdmin, readManifest } from "../media-store";

export const metadata: Metadata = { title: "Media Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isMediaAdmin())) notFound();
  const manifest = await readManifest();
  return <AdminDashboard initialManifest={manifest} />;
}
