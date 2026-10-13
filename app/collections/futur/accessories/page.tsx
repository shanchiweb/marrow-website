import type { Metadata } from "next";
import { FuturGallery } from "../../../components/FuturGallery";

export const metadata: Metadata = {
  title: "Futur 2026 — Accessories",
  description: "Discover twelve bridal accessories from Marrow's Futur 2026 collection.",
};

export default function FuturAccessoriesPage() {
  return <FuturGallery category="accessories" />;
}
