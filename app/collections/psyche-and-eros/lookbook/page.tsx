import type { Metadata } from "next";
import { CollectionGallery } from "../../../components/CollectionGallery";

export const metadata: Metadata = {
  title: "Psyche and Eros — Wedding Dresses",
  description: "Explore nineteen wedding dresses from Marrow's Psyche and Eros bridal collection.",
};

export default function LookbookPage() {
  return <CollectionGallery category="lookbook" />;
}
