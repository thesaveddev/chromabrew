import { ImageResponse } from "next/og";

export const alt = "ChromaBrew — turn one color into an entire design system";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social card for every route without its own — recreates the
 * logo mark (dark rounded square, pink dot) at brand scale.
 */
export default function OpengraphImage() {
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
          gap: 48,
          background: "#fafafa",
          backgroundImage:
            "radial-gradient(circle at 25% 20%, #f4e9f1 0%, rgba(244,233,241,0) 50%), radial-gradient(circle at 80% 85%, #e8eef7 0%, rgba(232,238,247,0) 55%)",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 168,
            height: 168,
            borderRadius: 44,
            background: "#18181b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              background: "#c87cb3",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -2,
              color: "#18181b",
            }}
          >
            ChromaBrew
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              color: "#52525b",
            }}
          >
            Turn one color into an entire design system
          </div>
        </div>
      </div>
    ),
    size,
  );
}
