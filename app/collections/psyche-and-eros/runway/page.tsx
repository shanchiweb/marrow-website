import type { Metadata } from "next";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { RunwayFilm } from "../../../components/RunwayFilm";
import { defaults, mediaUrl, readManifest } from "../../../media-store";

export const metadata: Metadata = {
  title: "Psyche and Eros · Runway",
  description: "The Psyche and Eros collection film by Marrow, inspired by the union of love and soul.",
};
export const dynamic = "force-dynamic";

export default async function PsycheRunway() {
  const manifest = await readManifest();
  const slot = "video-psyche-runway-left";

  return <main className="psyche-runway-page">
    <section className="psyche-runway-stage" aria-label="Psyche and Eros runway">
      <SiteHeader active="wedding" />
      <h1 className="psyche-runway-title">Psyche and Eros.</h1>
      <RunwayFilm src={manifest[slot] ? mediaUrl(slot, manifest) : undefined} poster={defaults[slot]} />
      <img className="psyche-runway-middle" src="/design/2025/runway-middle.jpg" alt="A bride ties a bow on her Marrow gown" />
      <div className="psyche-runway-copy psyche-runway-copy--inspiration">
        <p>The inspiration of Marrow 2024 wedding dress collection is inspired by the Greek mythology Psyche and Eros.</p>
        <p>In the Louvre Museum in Paris, sculptor Antonio Canova&apos;s &quot;Psyche Revived by Cupid&apos;s Kiss&quot; uses delicate techniques to create a classicist dreamlike feel.</p>
      </div>
      <img className="psyche-runway-rose psyche-runway-rose--garland" src="/design/2025/rose-garland.png" alt="" aria-hidden="true" />
      <p className="psyche-runway-copy psyche-runway-copy--story">The Marrow2024 collection uses bow elements to represent the soul goddess Psyche, and small roses, Marrow&apos;s classic element, represent the God of Love. The romantic story of Cupid, the god of love, and Psyche, the goddess of soul, is the union and sublimation of love and soul.</p>
      <img className="psyche-runway-rose psyche-runway-rose--single" src="/design/2025/rose-single.png" alt="" aria-hidden="true" />
      <img className="psyche-runway-detail" src="/design/2025/runway-detail.jpg" alt="A bow and delicate lace on a Psyche and Eros wedding dress" />
      <a className="psyche-runway-explore" href="/collections/psyche-and-eros/lookbook">Explore Wedding Dresses</a>
    </section>
    <SiteFooter />
  </main>;
}
