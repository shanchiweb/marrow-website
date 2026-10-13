import type { Metadata } from "next";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { RunwayFilm } from "../../../components/RunwayFilm";
import { defaults, mediaUrl, readManifest } from "../../../media-store";

export const metadata: Metadata = {
  title: "Puella Aeterna 2027 · Runway",
  description: "The Puella Aeterna collection film by Marrow, inspired by innocence, idealism and dreamlike memories of girlhood.",
};
export const dynamic = "force-dynamic";

export default async function PuellaRunway() {
  const manifest = await readManifest();
  const slot = "video-puella-runway-left";

  return <main className="puella-runway-page">
    <section className="puella-runway-stage" aria-label="Puella Aeterna 2027 runway">
      <SiteHeader active="wedding" light />
      <h1 className="puella-runway-title"><span className="sr-only">Puella Aeterna</span><img src="/design/2027/puella-title.png" alt="" aria-hidden="true" /></h1>
      <RunwayFilm src={manifest[slot] ? mediaUrl(slot, manifest) : undefined} poster={defaults[slot]} className="puella-runway-film" label="Puella Aeterna 2027 runway film" posterAlt="A constellation of paper stars from the Puella Aeterna runway film" />
      <img className="puella-runway-middle" src="/design/2027/runway-middle.jpg" alt="White sculpted flowers and a pastel pink cake, the inspiration for Puella Aeterna" />
      <div className="puella-runway-copy">
        <p>Inspiration for the Marrow 2027 Collection.</p>
        <p>Draws from Carl Gustav Jung’s archetype of the “Puella Aeterna”. She dwells deep within every woman’s heart, the embodiment of innocence and idealism.</p>
        <p>When we reconnect with the “Puella Aeterna” within, it is not a rejection of maturity, but rather a way to let our light, pure imagination and vitality help us become more whole. With a gentle and free embrace, we unlock the dreamlike memories of our girlhood.</p>
      </div>
      <img className="puella-runway-heart" src="/design/2027/runway-heart.png" alt="Two models in Puella Aeterna bridal gowns, framed by a heart" />
    </section>
    <SiteFooter contacts />
  </main>;
}
