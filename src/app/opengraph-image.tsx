import { ImageResponse } from "next/og";
import { SITE_TITLE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a3d37 0%, #0b7d70 100%)",
          color: "white",
          fontSize: 56,
          fontWeight: 700,
          padding: "0 80px",
          textAlign: "center",
        }}
      >
        {SITE_TITLE}
      </div>
    ),
    { ...size }
  );
}
