import { ImageResponse } from "next/og";

import { siteConfig } from "@/data/site";

export const alt = `${siteConfig.name}, ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * The image is rendered outside the page, where the CSS tokens do not exist,
 * so the colours are copied from app/globals.css: bg, fg, muted, and accent.
 */
const BG = "#09090b";
const FG = "#fafafa";
const MUTED = "#a1a1aa";
const ACCENT = "#ccff00";

/** Link preview card for chats and social posts, generated at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 80,
          background: BG,
          color: FG,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: MUTED, textTransform: "uppercase" }}>
          {siteConfig.availability.label}
        </div>
        <div style={{ marginTop: 20, fontSize: 84, lineHeight: 1.05 }}>{siteConfig.name}</div>
        <div style={{ marginTop: 12, fontSize: 56, color: ACCENT }}>{siteConfig.role}</div>
        <div
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, background: ACCENT }}
        />
      </div>
    ),
    size,
  );
}
