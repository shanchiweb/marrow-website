import type { Metadata } from "next";
import { FuturGallery } from "../../../components/FuturGallery";

export const metadata: Metadata = {
  title: "Futur 2026 — Wedding Dresses",
  description: "Explore twenty-four wedding dresses from Marrow's Futur 2026 collection.",
};

export default function FuturLookbookPage() {
  return <FuturGallery category="lookbook" />;
}
