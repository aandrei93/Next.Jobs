import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(circle at 18% 18%, #67e8f9 0%, rgba(103,232,249,0) 30%), radial-gradient(circle at 82% 82%, #f59e0b 0%, rgba(245,158,11,0) 34%), linear-gradient(135deg, #0f172a 0%, #1e293b 58%, #334155 100%)",
          color: "#f8fafc",
          padding: "64px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 64,
            top: 64,
            width: 160,
            height: 160,
            borderRadius: 32,
            border: "6px solid rgba(248,250,252,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 84,
            fontWeight: 800,
            background: "rgba(15,23,42,0.45)",
          }}
        >
          NJ
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 860 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(248,250,252,0.35)",
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 26,
              color: "#e2e8f0",
            }}
          >
            NextJobs
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.03 }}>Build teams faster with a modern jobs marketplace.</div>
          <div style={{ fontSize: 34, color: "#cbd5e1" }}>Posting, applications, profiles and full management in one platform.</div>
        </div>
      </div>
    ),
    size
  );
}
