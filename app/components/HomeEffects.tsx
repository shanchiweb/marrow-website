"use client";

import { useEffect, useRef, useState } from "react";

const HEART_DEPTH_LAYERS = Array.from({ length: 11 }, (_, index) => index - 5);

export function HomeEffects() {
  const heart = useRef<HTMLButtonElement>(null);
  const heartAngle = useRef(0);
  const flower = useRef<HTMLButtonElement>(null);
  const bowArt = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragActive = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const frame = useRef<number>(0);

  function spin(element: HTMLElement | null) {
    if (!element) return;
    element.classList.remove("has-spun");
    // Restart the CSS animation even if the element was clicked while visible.
    void element.offsetWidth;
    element.classList.add("has-spun");
  }

  function spinHeart() {
    const element = heart.current;
    if (!element) return;
    const from = heartAngle.current;
    const to = from + 180;
    element.classList.remove("has-spun");
    element.style.transform = `perspective(800px) rotateY(${from}deg)`;
    element.style.setProperty("--heart-from", `${from}deg`);
    element.style.setProperty("--heart-to", `${to}deg`);
    heartAngle.current = to;
    void element.offsetWidth;
    element.classList.add("has-spun");
  }

  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= 0.3) {
          if (!visible.has(entry.target)) {
            if (entry.target === heart.current) spinHeart();
            else spin(entry.target as HTMLElement);
          }
          visible.add(entry.target);
        } else if (!entry.isIntersecting) {
          visible.delete(entry.target);
          if (entry.target === heart.current) {
            (entry.target as HTMLElement).style.transform = `perspective(800px) rotateY(${heartAngle.current}deg)`;
          }
          entry.target.classList.remove("has-spun");
        }
      }
    }, { threshold: [0, 0.3], rootMargin: "-10% 0px -10% 0px" });
    if (heart.current) observer.observe(heart.current);
    if (flower.current) observer.observe(flower.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function paintBow() {
    if (!bowArt.current) return;
    const { x, y, vx, vy } = motion.current;
    const stretch = Math.min(0.16, Math.hypot(vx, vy) / 65);
    bowArt.current.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.24}deg) skew(${x * 0.13}deg, ${y * 0.08}deg) scale(${1 + stretch}, ${1 - stretch * 0.55})`;
  }

  function settleBow() {
    const m = motion.current;
    m.vx = (m.vx - m.x * 0.14) * 0.74;
    m.vy = (m.vy - m.y * 0.14) * 0.74;
    m.x += m.vx;
    m.y += m.vy;
    paintBow();
    if (Math.abs(m.x) + Math.abs(m.y) + Math.abs(m.vx) + Math.abs(m.vy) > 0.4) {
      frame.current = requestAnimationFrame(settleBow);
    } else {
      motion.current = { x: 0, y: 0, vx: 0, vy: 0 };
      if (bowArt.current) bowArt.current.style.transform = "";
    }
  }

  function endDrag() {
    if (!dragActive.current) return;
    dragActive.current = false;
    setDragging(false);
    frame.current = requestAnimationFrame(settleBow);
  }

  return (
    <>
      <button ref={heart} className="editorial-heart scroll-spin" type="button" aria-label="Rotate the pink heart" onClick={spinHeart} onAnimationEnd={(event) => {
        if (event.animationName !== "heart-turn") return;
        event.currentTarget.style.transform = `perspective(800px) rotateY(${heartAngle.current}deg)`;
        event.currentTarget.classList.remove("has-spun");
      }}>
        {HEART_DEPTH_LAYERS.map((layer) => <span className="editorial-heart__depth" style={{ transform: `translateZ(${layer * 3}px)` }} key={layer} aria-hidden="true" />)}
        <img className="editorial-heart__front" src="/design/heart.png" alt="" />
        <img className="editorial-heart__back" src="/design/heart.png" alt="" />
      </button>
      <button ref={flower} className="editorial-flower scroll-spin" type="button" aria-label="Rotate the white flower" onClick={() => spin(flower.current)}>
        <img src="/design/flower.png" alt="" />
      </button>
      <button
        className={`editorial-bow${dragging ? " is-dragging" : ""}`}
        type="button"
        aria-label="Drag the decorative bow"
        onPointerDown={(event) => {
          cancelAnimationFrame(frame.current);
          origin.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
          dragActive.current = true;
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (!dragActive.current) return;
          const nextX = Math.max(-22, Math.min(22, (event.clientX - origin.current.x) * 0.18));
          const nextY = Math.max(-22, Math.min(22, (event.clientY - origin.current.y) * 0.18));
          motion.current.vx = nextX - motion.current.x;
          motion.current.vy = nextY - motion.current.y;
          motion.current.x = nextX;
          motion.current.y = nextY;
          paintBow();
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      ><img ref={bowArt} src="/design/bow.png" alt="" /></button>
    </>
  );
}
