"use client";

import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "./SiteHeader";

const descriptions = [
  "A bride in a lace-framed oval wearing a white Marrow dress",
  "A bride in white seated above a vivid red floor",
  "A bride seen from behind wearing the Marrow 2027 collection",
];

export function HomeCarousel({ slides }: { slides: string[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const showPrevious = () => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setActive((current) => (current + 1) % slides.length);
  };

  return (
    <div
      className="home-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const end = event.changedTouches[0]?.clientX ?? touchStart.current;
        const distance = end - touchStart.current;
        touchStart.current = null;
        if (Math.abs(distance) < 48) return;
        if (distance > 0) showPrevious();
        else showNext();
      }}
    >
      <SiteHeader active="home" light={active === 2} />
      {slides.map((slide, index) => (
        <figure
          className={`home-slide home-slide--${index + 1}${index === active ? " is-active" : ""}`}
          key={index}
          aria-hidden={index !== active}
        >
          <img className="home-slide__art" src={slide} alt={index === active ? descriptions[index] : ""} />
        </figure>
      ))}

      <button className="carousel-control carousel-control--previous" type="button" onClick={showPrevious}>
        <span>Previous image</span>
      </button>
      <button className="carousel-control carousel-control--next" type="button" onClick={showNext}>
        <span>Next image</span>
      </button>

      <p className="sr-only" aria-live="polite">
        Image {active + 1} of {slides.length}
      </p>
    </div>
  );
}
