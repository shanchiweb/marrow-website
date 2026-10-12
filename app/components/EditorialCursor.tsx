"use client";

import { useEffect } from "react";

export function EditorialCursor() {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>(".editorial-stage");
    if (!stage) return;

    const cursor = document.createElement("span");
    cursor.className = "editorial-custom-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.hidden = true;
    document.body.append(cursor);

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const hide = () => { cursor.hidden = true; };
    const move = (event: PointerEvent) => {
      const frame = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-editorial-cursor]")
        : null;
      if (!finePointer.matches || !frame || !stage.contains(frame)) {
        hide();
        return;
      }

      cursor.textContent = frame.dataset.editorialCursor ?? "";
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.hidden = false;
    };

    stage.addEventListener("pointerover", move);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", hide);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("blur", hide);

    return () => {
      stage.removeEventListener("pointerover", move);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", hide);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("blur", hide);
      cursor.remove();
    };
  }, []);

  return null;
}
