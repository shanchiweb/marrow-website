"use client";

import { useState } from "react";

export function RunwayFilm({ src, poster, className = "psyche-runway-film", label = "Psyche and Eros runway film", posterAlt = "A close-up of lace from the Psyche and Eros runway film" }: { src?: string; poster: string; className?: string; label?: string; posterAlt?: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const failed = Boolean(src && failedSrc === src);

  return <div className={className}>
    {src && !failed ? <video
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      aria-label={label}
      onError={() => setFailedSrc(src)}
    /> : <img src={poster} alt={posterAlt} />}
    {failed && <p className={`${className}__error`} role="status">The film is temporarily unavailable.</p>}
  </div>;
}
