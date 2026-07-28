import type { Metadata } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const fontSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-meru-sans",
  display: "swap",
});

const fontHeading = Oswald({
  subsets: ["latin"],
  variable: "--font-meru-heading",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Meru Viajes y Turismo | Excursiones en Ushuaia",
    template: "%s | Meru Viajes y Turismo",
  },
  description:
    "Excursiones, navegaciones y paquetes en Ushuaia, Tierra del Fuego. Reservá online con Meru Viajes y Turismo — cupos confirmados y atención local.",
  keywords: [
    "excursiones Ushuaia",
    "turismo Tierra del Fuego",
    "Meru Viajes",
    "paquetes Ushuaia",
    "Fin del Mundo",
    "trekking Ushuaia",
  ],
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png" }],
    shortcut: ["/logo.png"],
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: appUrl,
    siteName: "Meru Viajes y Turismo",
    title: "Meru Viajes y Turismo | Excursiones en Ushuaia",
    description:
      "Excursiones y paquetes en el Fin del Mundo. Reservá online con Meru.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meru Viajes y Turismo | Excursiones en Ushuaia",
    description:
      "Excursiones y paquetes en Ushuaia, Tierra del Fuego. Reservá online.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fontSans.variable} ${fontHeading.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
