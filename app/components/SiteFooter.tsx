/* eslint-disable @next/next/no-html-link-for-pages */

import { FooterSubscribe } from "./FooterSubscribe";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="site-footer__column"><a href="/#puella-aeterna">Puella Aeterna</a><a href="/#futur">Futur</a><a href="/#psyche-and-eros">Psyche and Eros</a></div>
        <div className="site-footer__column"><a href="/about">About</a><a href="/boutique">Our Boutique</a><a href="/retailers">Stockists</a></div>
        <FooterSubscribe />
      </div>
      <div className="site-footer__bottom"><p>© 2026 - Marrow</p><img src="/marrow-wordmark.png" alt="Marrow" /></div>
    </footer>
  );
}
