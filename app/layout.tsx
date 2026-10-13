import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./collections.css";
import "./runway.css";
import "./futur-gallery.css";
import "./futur-runway.css";
import "./puella-runway.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host") || "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : isLocalHost
        ? "http"
        : "https";
  const origin = `${protocol}://${host}`;
  const socialImage = new URL("/og.png", origin).toString();

  return {
    title: {
      default: "Marrow Bridal",
      template: "%s | Marrow",
    },
    description:
      "Marrow is a Chengdu-based bridal design label founded by designer Marrow Tang.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      title: "Marrow Bridal",
      description:
        "A Chengdu-based bridal design label founded by designer Marrow Tang.",
      images: [{ url: socialImage, width: 1536, height: 896, alt: "Marrow Bridal" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Marrow Bridal",
      description:
        "A Chengdu-based bridal design label founded by designer Marrow Tang.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
