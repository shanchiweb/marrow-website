"use client";

import { useEffect, useRef } from "react";

/**
 * About 页的「肖像 + 手写签名」组合。
 *
 * 签名原本是烤在 about-portrait.png 里的，无法单独动；
 * 现在拆成两层：底层是抹掉签名后的肖像，上层是独立签名图层，
 * 滚动到可见区域时，肖像先浮现、签名随后一笔一笔「写」出来。
 */
export function SignatureReveal({
  baseSrc,
  signatureSrc,
  alt,
}: {
  baseSrc: string;
  signatureSrc: string;
  alt: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    // 用户系统设了「减少动态效果」——直接显示，不做动画
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("play");
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("play");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("play");
            io.disconnect();
          }
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={host} className="about-portrait">
      <img className="about-portrait__base" src={baseSrc} alt={alt} />
      <img
        className="about-portrait__signature"
        src={signatureSrc}
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}
