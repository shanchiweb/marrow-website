"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useRef, useState } from "react";

type Page = "home" | "wedding" | "about" | "boutique" | "retailers";

const rightLinks: { page: Page; label: string; href: string }[] = [
  { page: "about", label: "About", href: "/about" },
  { page: "boutique", label: "Our Boutique", href: "/boutique" },
  { page: "retailers", label: "Retailers", href: "/retailers" },
];

const collections = ["Puella Aeterna.", "Futur.", "Psyche and Eros."];
const collectionRoots = ["/collections/puella-aeterna", "/collections/futur", "/collections/psyche-and-eros"];
const collectionEntries = [
  { kind: "runway", label: "Runway" },
  { kind: "lookbook", label: "LookBook" },
  { kind: "accessories", label: "Accessories" },
];

export function SiteHeader({ active, light = false }: { active: Page; light?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);

  const focusFirstCollection = () => {
    requestAnimationFrame(() => header.current?.querySelector<HTMLAnchorElement>(".wedding-mega-menu__entry[href]")?.focus());
  };

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuTrigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header ref={header} className={`site-header${light ? " site-header--light" : ""}${menuOpen ? " is-menu-open" : ""}`} onMouseLeave={() => setMenuOpen(false)}>
      <div id="wedding-collections-menu" className={`wedding-mega-menu${menuOpen ? " is-open" : ""}`} role="group" aria-label="Wedding Dresses collections" aria-hidden={!menuOpen}>
        {collections.map((collection, index) => (
          <div className={`wedding-mega-menu__column wedding-mega-menu__column--${index + 1}`} key={collection}>
            <h2 className="wedding-mega-menu__name">{collection}</h2>
            {collectionEntries.map((entry) => index !== 0 || entry.kind === "runway" ? (
              <a key={entry.kind} className={`wedding-mega-menu__entry wedding-mega-menu__entry--${entry.kind}`} href={`${collectionRoots[index]}/${entry.kind}`} onClick={() => setMenuOpen(false)}>{entry.label}</a>
            ) : (
              <span key={entry.kind} className={`wedding-mega-menu__entry wedding-mega-menu__entry--${entry.kind}`}>{entry.label}</span>
            ))}
          </div>
        ))}
        <button type="button" className="wedding-mega-menu__close" aria-label="Close collection menu" onClick={() => { setMenuOpen(false); menuTrigger.current?.focus(); }}>Close ×</button>
      </div>
      <nav className="site-header__nav" aria-label="Main navigation">
        <a className={`site-nav site-nav--home${active === "home" ? " is-active" : ""}`} href="/" aria-current={active === "home" ? "page" : undefined} onMouseEnter={() => setMenuOpen(false)} onFocus={() => setMenuOpen(false)}>Home</a>
        <button ref={menuTrigger} className={`site-nav site-nav--wedding${active === "wedding" ? " is-active" : ""}${menuOpen ? " is-menu-open" : ""}`} type="button" aria-expanded={menuOpen} aria-controls="wedding-collections-menu" aria-haspopup="true" onMouseEnter={() => setMenuOpen(true)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setMenuOpen(true); focusFirstCollection(); } }} onClick={(event) => { setMenuOpen(true); if (event.detail === 0) focusFirstCollection(); }}>Wedding Dresses</button>
        <a className="site-wordmark" href="/" aria-label="Marrow home" onMouseEnter={() => setMenuOpen(false)} onFocus={() => setMenuOpen(false)}><img src="/marrow-wordmark.png" alt="Marrow" /></a>
        {rightLinks.map((link) => (
          <a key={link.page} className={`site-nav site-nav--${link.page}${active === link.page ? " is-active" : ""}`} href={link.href} aria-current={active === link.page ? "page" : undefined} onMouseEnter={() => setMenuOpen(false)} onFocus={() => setMenuOpen(false)}>{link.label}</a>
        ))}
      </nav>
    </header>
  );
}
