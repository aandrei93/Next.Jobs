import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobOpenGraphImage({ params }: OgImageProps) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: {
      title: true,
      location: true,
      company: { select: { name: true } },
    },
  });

  const title = job?.title || "NextJobs";
  const company = job?.company.name || "Jobs Marketplace";
  const location = job?.location || "Remote";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(circle at 14% 16%, #67e8f9 0%, rgba(103,232,249,0) 28%), radial-gradient(circle at 82% 78%, #f59e0b 0%, rgba(245,158,11,0) 36%), linear-gradient(135deg, #0f172a 0%, #1e293b 58%, #334155 100%)",
          color: "#f8fafc",
          padding: "60px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 980 }}>
          <div
            style={{
              display: "inline-flex",
              borderRadius: 999,
              border: "1px solid rgba(248,250,252,0.35)",
              padding: "8px 16px",
              fontSize: 24,
              color: "#e2e8f0",
            }}
          >
            {company}
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 32, color: "#cbd5e1" }}>{location}</div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 56,
            top: 56,
            borderRadius: 24,
            padding: "12px 18px",
            background: "rgba(2,6,23,0.45)",
            border: "1px solid rgba(248,250,252,0.22)",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          nextjobs
        </div>
      </div>
    ),
    size
  );
}
