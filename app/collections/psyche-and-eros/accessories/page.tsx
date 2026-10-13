import type { Metadata } from "next";
import { CollectionGallery } from "../../../components/CollectionGallery";

export const metadata: Metadata = {
  title: "Psyche and Eros — Accessories",
  description: "Discover the veils, hats and bridal accessories in Marrow's Psyche and Eros collection.",
};

export default function AccessoriesPage() {
  return <CollectionGallery category="accessories" />;
}
