import type { MediaManifest, MediaSlot } from "../media-store";
import { mediaUrl } from "../media-store";
import { EditorialCursor } from "./EditorialCursor";
import { HomeEffects } from "./HomeEffects";

function VideoFrame({ slot, fallback, className, manifest }: { slot: MediaSlot; fallback: string; className: string; manifest: MediaManifest }) {
  const item = manifest[slot];
  return <div className={`editorial-frame ${className}`} data-editorial-cursor="RUNWAY">
    {item ? <video src={mediaUrl(slot, manifest)} poster={fallback} autoPlay muted loop playsInline preload="metadata" aria-label="Marrow collection film" /> : <img src={fallback} alt="Marrow bridal collection" />}
    {slot === "video-3-left" && <a className="editorial-frame__link" href="/collections/psyche-and-eros/runway" aria-label="Explore Psyche and Eros runway" />}
    {(slot === "video-2-left" || slot === "video-2-middle") && <a className="editorial-frame__link" href="/collections/futur/runway" aria-label="Explore Futur runway" />}
    {slot === "video-1-left" && <a className="editorial-frame__link" href="/collections/puella-aeterna/runway" aria-label="Explore Puella Aeterna runway" />}
  </div>;
}

export function HomeEditorial({ manifest }: { manifest: MediaManifest }) {
  return (
    <section className="editorial-stage" aria-label="Marrow collections">
      <div id="puella-aeterna" className="editorial-anchor editorial-anchor--one" />
      <div id="futur" className="editorial-anchor editorial-anchor--two" />
      <div id="psyche-and-eros" className="editorial-anchor editorial-anchor--three" />
      <HomeEffects />
      <EditorialCursor />

      <h2 className="editorial-heading editorial-heading--one">Puella Aeterna</h2>
      <div className="editorial-copy editorial-copy--one">
        <p>Inspiration for the Marrow 2027 Collection.</p>
        <p>Draws from Carl Gustav Jung’s archetype of the “Puella Aeterna”. She dwells deep within every woman’s heart, the embodiment of innocence and idealism.</p>
        <p>When we reconnect with the “Puella Aeterna” within, it is not a rejection of maturity, but rather a way to let our light, pure imagination and vitality help us become more whole. With a gentle and free embrace, we unlock the dreamlike memories of our girlhood.</p>
      </div>
      <VideoFrame slot="video-1-left" fallback="/design/frame-1-left.jpg" className="editorial-frame--one-left" manifest={manifest} />
      <img className="editorial-frame editorial-frame--one-right" data-editorial-cursor="LOOKBOOK" src="/design/frame-1-right.jpg" alt="Pink Marrow bridal gown" />
      <p className="editorial-note editorial-note--one">Inspiration for the Marrow 2027 Collection.</p>

      <h2 className="editorial-heading editorial-heading--two">Futur.</h2>
      <p className="editorial-overline">INSPIRATION FOR THE<br />MARROW 2026<br />COLLECTION.</p>
      <VideoFrame slot="video-2-left" fallback="/design/frame-2-left.jpg" className="editorial-frame--two-left" manifest={manifest} />
      <VideoFrame slot="video-2-middle" fallback="/design/frame-2-middle.jpg" className="editorial-frame--two-middle" manifest={manifest} />
      <a className="editorial-frame editorial-frame--two-right" data-editorial-cursor="LOOKBOOK" href="/collections/futur/lookbook" aria-label="Explore Futur wedding dresses"><img src="/design/collection-2-right.jpg" alt="Bride in white Marrow gown" /></a>
      <p className="editorial-copy editorial-copy--two">Marrow 2026 Collection draws its inspiration from encounters during travels. Standing within Kyoto&apos;s ICC—a 1960s futuristic structure designed by Yukio Ohtani—I suddenly lost all sense of time.</p>

      <h2 className="editorial-heading editorial-heading--three">Psyche and Eros.</h2>
      <div className="editorial-copy editorial-copy--three"><p>The inspiration of Marrow 2024 wedding dress collection is inspired by the Greek mythology Psyche and Eros.</p><p>In the Louvre Museum in Paris, sculptor Antonio Canova&apos;s “Psyche Revived by Cupid&apos;s Kiss” uses delicate techniques to create a classicist dreamlike feel.</p></div>
      <VideoFrame slot="video-3-left" fallback="/design/frame-3-left.jpg" className="editorial-frame--three-left" manifest={manifest} />
      <a className="editorial-frame editorial-frame--three-middle" data-editorial-cursor="LOOKBOOK" href="/collections/psyche-and-eros/lookbook" aria-label="Explore Psyche and Eros wedding dresses"><img src="/design/frame-3-middle.jpg" alt="Girl in a Marrow bridal design" /></a>
      <img className="editorial-frame editorial-frame--three-right" src="/design/frame-3-right.jpg" alt="A Marrow bridal dress detail on red" />
      <p className="editorial-copy editorial-copy--three-last">The Marrow2024 collection uses bow elements to represent the soul goddess Psyche, and small roses, Marrow&apos;s classic element, represent the God of Love.<br />The romantic story of Cupid, the god of love, and Psyche, the goddess of soul, is the union and sublimation of love and soul.</p>
    </section>
  );
}
