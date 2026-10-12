import type { Metadata } from "next";
import { HomeCarousel } from "./components/HomeCarousel";
import { HomeEditorial } from "./components/HomeEditorial";
import { SiteFooter } from "./components/SiteFooter";
import { mediaUrl, readManifest } from "./media-store";

export const metadata: Metadata = {
  title: "Marrow Bridal",
  description:
    "Marrow is a Chengdu-based bridal design label founded by designer Marrow Tang.",
};
export const dynamic = "force-dynamic";

export default async function Home() {
  const manifest = await readManifest();
  return (
    <main className="home-page">
      <section className="home-hero" aria-label="Marrow bridal collection">
        <HomeCarousel slides={[mediaUrl("slide-1", manifest), mediaUrl("slide-2", manifest), mediaUrl("slide-3", manifest)]} />
      </section>
      <HomeEditorial manifest={manifest} />
      <SiteFooter />
    </main>
  );
}
