import type { Metadata } from "next";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { RunwayFilm } from "../../../components/RunwayFilm";
import { defaults, mediaUrl, readManifest } from "../../../media-store";

export const metadata: Metadata = {
  title: "Futur 2026 · Runway",
  description: "The Futur 2026 collection film by Marrow, inspired by encounters during travels and the meeting of classicism and futurism.",
};
export const dynamic = "force-dynamic";

export default async function FuturRunway() {
  const manifest = await readManifest();
  const slot = "video-futur-runway-left";

  return <main className="futur-runway-page">
    <section className="futur-runway-stage" aria-label="Futur 2026 runway">
      <SiteHeader active="wedding" />
      <h1 className="futur-runway-title"><span className="sr-only">Futur 2026</span><img src="/design/2026/futur-title.png" alt="" aria-hidden="true" /></h1>
      <img className="futur-runway-daisy futur-runway-daisy--one" src="/design/2026/daisy.png" alt="" aria-hidden="true" />
      <RunwayFilm src={manifest[slot] ? mediaUrl(slot, manifest) : undefined} poster={defaults[slot]} className="futur-runway-film" label="Futur 2026 runway film" posterAlt="A bride under a constellation of light in the Futur runway film" />
      <img className="futur-runway-middle" src="/design/2026/runway-middle.jpg" alt="A bride in a white Futur gown beside a sculptural floral installation" />
      <div className="futur-runway-copy futur-runway-copy--inspiration">
        <p>Marrow 2026 Collection draws its inspiration from encounters during travels. Standing within Kyoto&apos;s ICC—a 1960s futuristic structure designed by Yukio Ohtani—I suddenly lost all sense of time.</p>
        <p>From that moment, I began contemplating what Marrow&apos;s futurism truly means. &quot;At the Chengdu Art Museum, viewing artist Xu Bing&apos;s exhibition, I was profoundly moved by his words in &lt;Xu Bing Tianshu Rocket&gt;: Human civilization&apos;s progress relies on two kinds of people. Some, like scientists, organize and systematize, understanding the world through reason. Others, like artists, disrupt these systems. Only when order is loosened do opportunities for creation arise.&quot;</p>
      </div>
      <div className="futur-runway-copy futur-runway-copy--story">
        <p>Perhaps the sequencing of time is meaningless. Is there truly a clear boundary between retro and futuristic? As Wisława Szymborska once wrote in her poetry: &quot;When I pronounce the word Future, the first syllable already belongs to the past.&quot;</p>
        <p>This season, Marrow fuse classical and futuristic elements, shattering rigid boundaries. It is a blend—imbued with the spirit of romanticism, yet revealing new strength through this very loosening.</p>
      </div>
      <img className="futur-runway-daisy futur-runway-daisy--two" src="/design/2026/daisy.png" alt="" aria-hidden="true" />
      <img className="futur-runway-daisy futur-runway-daisy--three" src="/design/2026/daisy.png" alt="" aria-hidden="true" />
      <img className="futur-runway-detail" src="/design/2026/runway-detail.jpg" alt="An iridescent sculptural installation reflecting the Futur collection's inspiration" />
      <a className="futur-runway-explore" href="/collections/futur/lookbook">Explore Wedding Dresses</a>
    </section>
    <SiteFooter />
  </main>;
}
