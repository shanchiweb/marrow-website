# Marrow Bridal website

Vinext/React website based on the supplied `首页-门店-经销商.pdf`, `2025.pdf`, `2026.pdf` and `2027.pdf` designs. The desktop layouts preserve the artwork proportions and scale with viewport width; smaller screens use a stacked layout.

## Pages

- `/` — original two carousel images, followed by the new third image and three editorial collections.
- `/about`, `/boutique`, `/retailers` — pages based on the PDF.
- `/collections/psyche-and-eros/accessories` — accessories page from page 1 of `2025.pdf`.
- `/collections/psyche-and-eros/lookbook` — wedding dress showcase from page 2 of `2025.pdf`.
- `/collections/psyche-and-eros/runway` — runway page from page 3 of `2025.pdf`, with a replaceable video in the left frame.
- `/collections/futur/accessories` — 2026 Futur accessories page from page 1 of `2026.pdf`.
- `/collections/futur/lookbook` — 2026 Futur wedding dress showcase from page 2 of `2026.pdf`.
- `/collections/futur/runway` — 2026 Futur runway page from page 3 of `2026.pdf`, with a replaceable video in the left frame.
- `/collections/puella-aeterna/runway` — 2027 Puella Aeterna runway page from `2027.pdf`, with a replaceable video in the left frame. Its accessories and wedding dress showcase pages await further supplied designs and are not present.
- Wedding Dresses is a navigation hover menu; no `/wedding-dresses` page remains.
- `/admin` — password-protected media manager.

## Updating website media

Open `/admin` and enter the configured admin password. “首页素材” keeps the original seven slots: three carousel images and four looping videos (first group left, second group left and middle, third group left). “Psyche and Eros · 秀场视频” manages `video-psyche-runway-left`; “Futur · 秀场视频” manages `video-futur-runway-left`; “Puella Aeterna · 秀场视频” manages `video-puella-runway-left`. Each collection's slot replaces its own runway page's left frame independently. Upload an image/video or enter an HTTPS media URL, then press “保存替换”. “恢复默认” removes the override. Each saved slot links to its relevant public page for review.

Video slots show the PDF artwork until a video is supplied. Homepage videos remain muted and loop automatically. All collection runway players have native playback, volume and seeking controls, and start when the visitor presses play. MP4 and WebM are recommended; HTTPS URLs must point directly to a browser-playable media file rather than a video platform's watch page. Uploaded media responses support byte ranges so the runway players can seek without downloading the entire video first.

Uploads are stored in the Site's R2 bucket, not the browser, and are available across devices. Individual uploads are limited to 90 MB. A local `/admin` upload updates only the local development bucket; deploy the updated source and replace media through the hosted site's `/admin` to update the public website.

The page and media API require a signed, HttpOnly session cookie with an eight-hour server-side expiry. The public website's audience is unchanged. Login, logout and media writes require a same-origin request; login is limited to five attempts per IP per ten minutes, with atomic counters in R2. Old account-ID and localhost authentication bypasses have been removed.

Server-only secret bindings `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` are required. The former stores a salted PBKDF2-SHA256 hash; the latter is an independently generated 32-byte secret encoded as 64 lowercase hexadecimal characters. Set them as Sites runtime secrets and redeploy to apply them. Never put a plaintext password or either secret in source, browser code or a handoff ZIP. Local development can provide test secrets through an ignored `.dev.vars` file. Rotating either value invalidates existing sessions. Signing out clears the current browser cookie.

## Development

Requires Node.js 22.13+ and pnpm. Run `pnpm install`, `pnpm dev`, and `pnpm build`. `.openai/hosting.json` enables the `BUCKET` R2 binding for local and hosted media storage.

The first two carousel images and prior design assets are retained in `public/`. Earlier assets under `public/design/` were extracted from the supplied Illustrator PDF with `scripts/extract-design.py`; that script accepts the absolute PDF path as its argument. The `2025.pdf` artwork assets are stored under `public/design/2025/`; the `2026.pdf` artwork assets are stored under `public/design/2026/`; the `2027.pdf` runway artwork is stored under `public/design/2027/`. Each directory includes its runway video's default poster. The original PDFs are not bundled into the site. The added Futur pages and Puella Aeterna runway page are local source changes; publishing requires a separate authorized deployment.
