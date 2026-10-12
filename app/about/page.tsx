import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "About",
  description:
    "Designer introduction, studio information, press recognition and contact details for Marrow Bridal.",
};

export default function About() {
  return (
    <main className="about-page">
      <section className="about-stage">
        <SiteHeader active="about" />

        <h1 className="about-title">About</h1>

        <section className="designer-introduction" aria-labelledby="designer-title">
          <h2 id="designer-title">Designer introduction</h2>
          <div className="designer-copy">
            <p>
              Marrow Tang, 90s designer,She earned her Master&apos;s degree in Fashion Design from Beijing Institute
              of Fashion Technology. Her evening gown design was shortlisted for the 2014 ARTS OF FASHION Prize by
              the American Fashion Arts Foundation. In 2016, she founded the bridal design brand Marrow in Chengdu.
            </p>
            <p>
              In 2019, Marrow was selected for the bridal wear segment of Shanghai International Fashion Week. At the
              same year, Marrow received the Annual Craftsmanship Brand Award in China&apos;s wedding fashion industry
              from COSMO BRIDE magazine. She loves vintage and modren multiculture at the same time, Combining retro
              culture and fashion design with her imagination . Each series unfolds like a vivid and charming movie
              story.
            </p>
            <p>
              In 2025, Marrow was recognized by THE WED, the world-renowned wedding magazine website, as one of the 20
              Next-Gen Bridal Designers You Need on Your Radar.n 2026, Marrow was named one of Asia&apos;s 14 Best Bridal
              Designer by THE WED.
            </p>
          </div>
        </section>

        <img
          className="about-portrait"
          src="/about-portrait.png"
          alt="Portrait of Marrow designer Marrow Tang in an ornate oval frame"
        />

        <section className="press-introduction" aria-labelledby="press-title">
          <h2 id="press-title">
            <span className="press-number">14</span>
            <span>Best Bridal Designers in Asia</span>
          </h2>
          <div className="press-copy">
            <p>
              Marrow Tang has always been drawn to the space where past and present blur. Since launching her
              Chengdu-based namesake label in 2016, the designer has built a bridal world shaped by multicultural
              references, retro sensibility, and a quietly modern eye — collections that evoke another era without
              being costumed by it. With an emphasis on natural comfort, impeccable tailoring, and luxurious fabrics,
              each piece by Marrow feels thoughtfully composed yet effortlessly wearable.
            </p>
            <p className="press-source">From THE WED</p>
          </div>
        </section>

      </section>

      <SiteFooter />
    </main>
  );
}
