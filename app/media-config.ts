export const MEDIA_SLOTS = ["slide-1", "slide-2", "slide-3", "video-1-left", "video-2-left", "video-2-middle", "video-3-left"] as const;
export type MediaSlot = (typeof MEDIA_SLOTS)[number];
export type MediaItem = { type: "upload" | "external"; key?: string; url?: string; updatedAt: number };
export type MediaManifest = Partial<Record<MediaSlot, MediaItem>>;

export const defaults: Record<MediaSlot, string> = {
  "slide-1": "/home-01.png",
  "slide-2": "/home-02.png",
  "slide-3": "/design/home-03.jpg",
  "video-1-left": "/design/frame-1-left.jpg",
  "video-2-left": "/design/frame-2-left.jpg",
  "video-2-middle": "/design/frame-2-middle.jpg",
  "video-3-left": "/design/frame-3-left.jpg",
};

export function isMediaSlot(value: string): value is MediaSlot {
  return MEDIA_SLOTS.includes(value as MediaSlot);
}
