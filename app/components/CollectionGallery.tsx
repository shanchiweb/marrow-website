/* eslint-disable @next/next/no-img-element -- PDF assets are exported at their final display sizes. */

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

const collectionRoot = "/collections/psyche-and-eros";

const accessories = [
  "Bowknot Gloves",
  "Bowknot Soft Veil",
  "Little Lace Veil",
  "Flower Hat",
  "Flower Song Veil",
  "Little Flower Veil",
  "Bowknot",
  "Pink Bowknot Veil",
  "Navy Hat",
];

const weddingDresses = [
  "Aurora",
  "Blue Psyche",
  "Blue Rose",
  "Eastern Rose",
  "Floral Song",
  "Isabella",
  "Little Cake",
  "Little Cloud",
  "Madeleine",
  "Natalia",
  "Ophelia",
  "Psyche",
  "Rosa Rosa",
  "Rose Poem",
  "Ruby",
  "Silver Bowknot",
  "Sissie",
  "Stardust",
  "Yuriko",
];

export function CollectionIntroduction({ subtitle }: { subtitle: string }) {
  return (
    <header className="collection-introduction">
      <h1 className="collection-title">Psyche and Eros.</h1>
      <h2 className="collection-subtitle">{subtitle}</h2>
      <img className="collection-rose collection-rose--left" src="/design/2025/rose-left.png" alt="" aria-hidden="true" />
      <img className="collection-rose collection-rose--right" src="/design/2025/rose-right.png" alt="" aria-hidden="true" />
      <div className="collection-copy">
        <p>The inspiration of Marrow 2024 wedding dress collection is inspired by the Greek mythology <a href={`${collectionRoot}/runway`}>Psyche and Eros</a>.</p>
        <p>In the Louvre Museum in Paris, sculptor Antonio Canova&apos;s &quot;Psyche Revived by Cupid&apos;s Kiss&quot; uses delicate techniques to create a classicist dreamlike feel.</p>
        <p>The Marrow2024 collection uses bow elements to represent the soul goddess Psyche, and small roses, Marrow&apos;s classic element, represent the God of Love. The romantic story of Cupid, the god of love, and Psyche, the goddess of soul, is the union and sublimation of love and soul.</p>
      </div>
    </header>
  );
}

export function CollectionGallery({ category }: { category: "accessories" | "lookbook" }) {
  const isAccessories = category === "accessories";
  const labels = isAccessories ? accessories : weddingDresses;
  const subtitle = isAccessories ? "Accessories" : "Wedding Dresses";
  const assetPrefix = isAccessories ? "accessory" : "dress";

  return (
    <main className={`collection-page collection-page--${category}`}>
      <section className={`collection-stage collection-stage--${category}`}>
        <SiteHeader active="wedding" />
        <CollectionIntroduction subtitle={subtitle} />
        <div className="collection-gallery" aria-label={`Psyche and Eros ${subtitle}`}>
          {labels.map((label, index) => (
            <figure className="collection-card" key={label}>
              <img
                src={`/design/2025/${assetPrefix}-${String(index + 1).padStart(2, "0")}.jpg`}
                alt={`${label} from the Psyche and Eros collection`}
                width={746}
                height={1076}
                loading={index < 4 ? "eager" : "lazy"}
                decoding="async"
              />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
        <a className="collection-explore" href={`${collectionRoot}/${isAccessories ? "lookbook" : "accessories"}`}>
          {isAccessories ? "Explore Wedding Dresses" : "Explore Accessories"}
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}
