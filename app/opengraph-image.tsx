import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Meru Viajes y Turismo — Excursiones en Ushuaia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(145deg, #0c3b4a 0%, #145a6e 45%, #1a7a8c 100%)",
          color: "#f5f0e8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#c9e4ea",
          }}
        >
          Ushuaia · Tierra del Fuego
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            Meru Viajes y Turismo
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: "#e8f4f6",
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            Excursiones y paquetes en el Fin del Mundo. Reservá online.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#b8d4db",
          }}
        >
          meruviajes.tur.ar
        </div>
      </div>
    ),
    { ...size }
  );
}
