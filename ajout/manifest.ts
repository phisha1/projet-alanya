// app/manifest.ts — Next.js 14 Web App Manifest
// Place ce fichier dans app/manifest.ts
// Next.js le sert automatiquement sur /manifest.webmanifest

import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "Alanya — Messagerie ENSPY",
    short_name:       "Alanya",
    description:      "Application de messagerie instantanée développée dans le cadre du cours Projet BD — ENSPY 2025–2026.",
    start_url:        "/dashboard",
    display:          "standalone",
    background_color: "#080C14",
    theme_color:      "#E8B84B",
    orientation:      "portrait-primary",
    lang:             "fr",
    icons: [
      { src:"/icons/icon-72.png",   sizes:"72x72",   type:"image/png" },
      { src:"/icons/icon-96.png",   sizes:"96x96",   type:"image/png" },
      { src:"/icons/icon-128.png",  sizes:"128x128", type:"image/png" },
      { src:"/icons/icon-144.png",  sizes:"144x144", type:"image/png", purpose:"maskable" },
      { src:"/icons/icon-192.png",  sizes:"192x192", type:"image/png", purpose:"any maskable" },
      { src:"/icons/icon-512.png",  sizes:"512x512", type:"image/png", purpose:"any maskable" },
    ],
    shortcuts: [
      {
        name:       "Messages",
        short_name: "Chats",
        url:        "/chats",
        icons:      [{ src:"/icons/shortcut-chat.png", sizes:"96x96" }],
      },
      {
        name:       "Appels",
        short_name: "Appels",
        url:        "/calls",
        icons:      [{ src:"/icons/shortcut-calls.png", sizes:"96x96" }],
      },
    ],
    screenshots: [
      { src:"/screenshots/dashboard.png", sizes:"1280x800", type:"image/png", label:"Tableau de bord Alanya" },
      { src:"/screenshots/chat.png",      sizes:"1280x800", type:"image/png", label:"Interface de messagerie" },
    ],
  }
}

// ─────────────────────────────────────────────────────────────────
// app/layout.tsx — Métadonnées globales (à fusionner dans ton layout)
// ─────────────────────────────────────────────────────────────────
//
// import type { Metadata, Viewport } from "next"
//
// export const viewport: Viewport = {
//   themeColor:        "#E8B84B",
//   width:             "device-width",
//   initialScale:      1,
//   maximumScale:      1,
//   userScalable:      false,
// }
//
// export const metadata: Metadata = {
//   title:       { default:"Alanya", template:"%s | Alanya" },
//   description: "Messagerie instantanée — Projet BD ENSPY 2025–2026",
//   manifest:    "/manifest.webmanifest",
//   appleWebApp: {
//     capable:           true,
//     title:             "Alanya",
//     statusBarStyle:    "black-translucent",
//   },
//   icons: {
//     icon:    [{ url:"/icons/icon-32.png", sizes:"32x32" }, { url:"/icons/icon-192.png", sizes:"192x192" }],
//     apple:   [{ url:"/icons/apple-touch-icon.png", sizes:"180x180" }],
//   },
//   openGraph: {
//     title:       "Alanya",
//     description: "Messagerie instantanée ENSPY",
//     type:        "website",
//     locale:      "fr_FR",
//   },
// }
