/* eslint-disable @next/next/no-img-element -- The reference Polaroid artwork is exported at its display ratio. */

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

const collectionRoot = "/collections/futur";

const accessories = [
  "波点花边头纱（长）",
  "波点花边头纱（短）",
  "Brigitte",
  "Brigitte",
  "Bubble",
  "Dreamy Daisy",
  "Mousse",
  "Perry",
  "Rosette Nebula",
  "Starry River",
  "Starry River",
  "Twiggy",
];

const weddingDresses = [
  "Twinkle",
  "Twiggy",
  "Starry River",
  "Silver Brigitte",
  "Rosycheek",
  "Rosy Whisper",
  "Rosette Nebula",
  "Red Daisy",
  "Polka",
  "Perry",
  "Nini",
  "Neural",
  "Nana",
  "Mousse",
  "Moon",
  "Lumina",
  "Lumina",
  "Fleur Step",
  "Dreamy Daisy",
  "Cyra",
  "Cranberry",
  "Bubble",
  "Brigitte",
  "Avaia",
];

export function FuturIntroduction({ subtitle }: { subtitle: string }) {
  return (
    <header className="futur-introduction">
      <h1 className="futur-title"><img src="/design/2026/futur-title.png" alt="Futur 2026" /></h1>
      <h2 className="futur-subtitle">{subtitle}</h2>
      <img className="futur-flower futur-flower--upper" src="/design/2026/daisy.png" alt="" aria-hidden="true" />
      <img className="futur-flower futur-flower--lower" src="/design/2026/daisy.png" alt="" aria-hidden="true" />
      <div className="futur-copy">
        <p>Marrow 2026 Collection draws its inspiration from encounters during travels. Standing within Kyoto&apos;s ICC—a 1960s futuristic structure designed by Yukio Ohtani—I suddenly lost all sense of time.</p>
        <p>From that moment, I began contemplating what Marrow&apos;s futurism truly means. &quot;At the Chengdu Art Museum, viewing artist Xu Bing&apos;s exhibition, I was profoundly moved by his words in &lt;Xu Bing Tianshu Rocket&gt;: Human civilization&apos;s progress relies on two kinds of people. Some, like scientists, organize and systematize, understanding the world through reason. Others, like artists, disrupt these systems. Only when order is loosened do opportunities for creation arise.&quot;</p>
        <p>Perhaps the sequencing of time is meaningless. Is there truly a clear boundary between retro and futuristic? As Wisława Szymborska once wrote in her poetry: &quot;When I pronounce the word Future, the first syllable already belongs to the past.&quot;</p>
        <p>This season, Marrow fuse classical and futuristic elements, shattering rigid boundaries. It is a blend—imbued with the spirit of romanticism, yet revealing new strength through this very loosening.</p>
      </div>
    </header>
  );
}

export function FuturGallery({ category }: { category: "accessories" | "lookbook" }) {
  const isAccessories = category === "accessories";
  const labels = isAccessories ? accessories : weddingDresses;
  const subtitle = isAccessories ? "Accessories" : "Wedding Dresses";
  const assetPrefix = isAccessories ? "accessory" : "dress";

  return (
    <main className={`futur-page futur-page--${category}`}>
      <section className={`futur-stage futur-stage--${category}`}>
        <SiteHeader active="wedding" />
        <FuturIntroduction subtitle={subtitle} />
        <div className="futur-gallery" aria-label={`Futur 2026 ${subtitle}`}>
          {labels.map((label, index) => (
            <figure className="futur-card" key={`${assetPrefix}-${index}`}>
              <img
                src={`/design/2026/${assetPrefix}-${String(index + 1).padStart(2, "0")}.jpg`}
                alt={`${label} from the Futur 2026 collection`}
                width={746}
                height={1076}
                loading={index < 4 ? "eager" : "lazy"}
                decoding="async"
              />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
        <a className="futur-explore" href={`${collectionRoot}/${isAccessories ? "lookbook" : "accessories"}`}>
          {isAccessories ? "Explore Wedding Dresses" : "Explore Accessories"}
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}
