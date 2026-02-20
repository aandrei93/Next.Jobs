import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "56px 72px",
          background: "linear-gradient(120deg, #0f172a 0%, #111827 48%, #1f2937 100%)",
          color: "#f8fafc",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 760 }}>
          <div style={{ fontSize: 28, color: "#67e8f9", fontWeight: 700 }}>NextJobs</div>
          <div style={{ fontSize: 70, lineHeight: 1.05, fontWeight: 800 }}>Find talent. Grow careers. Ship faster.</div>
          <div style={{ fontSize: 30, color: "#cbd5e1" }}>Jobs listing platform with candidate workflow and admin control.</div>
        </div>
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: 40,
            border: "6px solid rgba(103,232,249,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 94,
            fontWeight: 800,
            color: "#67e8f9",
          }}
        >
          NJ
        </div>
      </div>
    ),
    size
  );
}
