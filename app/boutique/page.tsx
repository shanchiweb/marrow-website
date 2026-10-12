import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = { title: "Our Boutique", description: "Visit the Marrow boutique in Chengdu, China." };

export default function Boutique() {
  return <main className="boutique-page">
    <section className="boutique-stage">
      <SiteHeader active="boutique" />
      <h1 className="page-script-title boutique-title">Boutique</h1>
      <h2 className="script-heading boutique-intro-title">Marrow Boutique Store in Chengdu, China.</h2>
      <div className="page-copy boutique-intro-copy"><p>The latest boutique opened in 2024, located near the Taikoo Li commercial center in Chengdu.</p><p>Its interior design draws inspiration from Marrow&apos;s design philosophy, conveying the brand&apos;s spirit and culture through its physical space.</p></div>
      <h2 className="script-heading boutique-address-title">Brand Boutique Address:</h2>
      <address className="page-copy boutique-address">1-2, Building 2, U37 Creative Park,<br />Jinjiang District, Chengdu, China</address>
      <img className="boutique-photo" src="/about-studio.png" alt="Marrow boutique entrance in Chengdu" />
      <address className="boutique-contacts"><p><span>Rednote :</span>蔓若Marrow</p><p><span>Instagram :</span><a href="https://www.instagram.com/marrowbridal/">marrowbridal</a></p><p><span>Email :</span><a href="mailto:marrowbridal@126.com">marrowbridal@126.com</a></p><p><span>Tel :</span><a href="tel:+8615281064451">+86 15281064451</a></p></address>
    </section>
    <SiteFooter />
  </main>;
}
