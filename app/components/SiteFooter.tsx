/* eslint-disable @next/next/no-html-link-for-pages */

export function SiteFooter({ contacts = false }: { contacts?: boolean } = {}) {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="site-footer__column"><a href="/#puella-aeterna">Puella Aeterna</a><a href="/#futur">Futur</a><a href="/#psyche-and-eros">Psyche and Eros</a></div>
        <div className="site-footer__column"><a href="/about">About</a><a href="/boutique">Our Boutique</a><a href="/retailers">Stockists</a></div>
        {contacts && <div className="site-footer__column"><a href="/boutique">Rednote</a><a href="https://www.instagram.com/marrowbridal/">Instagram</a><a href="mailto:marrowbridal@126.com">Email</a><a href="tel:+8615281064451">Tel</a><a href="/boutique">Address</a></div>}
        <div className="site-footer__email"><label className="sr-only" htmlFor="footer-email">Email address</label><input id="footer-email" type="email" placeholder="name@email.com" autoComplete="email" /><p>Submit your email address so we can get in touch with you.</p></div>
      </div>
      <div className="site-footer__bottom"><p>© 2026 - Marrow</p><img src="/marrow-wordmark.png" alt="Marrow" /></div>
    </footer>
  );
}
