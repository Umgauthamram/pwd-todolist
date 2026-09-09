import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Beginning — Google Keep Notes & Private Space",
    short_name: "Beginning",
    description:
      "A modern Google Keep-inspired productivity suite with public workspace, monochrome black and white aesthetics, and an isolated 4-digit PIN Private Space.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait",
    categories: ["productivity", "utilities", "notes"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "New Note",
        url: "/?action=new",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Private Space",
        url: "/?tab=private",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
