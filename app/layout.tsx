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
    default: "Meru Viajes y Turismo | Ushuaia, Tierra del Fuego",
    template: "%s | Meru Viajes y Turismo",
  },
  description:
    "Aventurate en el Fin del Mundo con Meru. Excursiones y turismo en Ushuaia, Tierra del Fuego.",
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
    title: "Meru Viajes y Turismo | Ushuaia",
    description:
      "Aventurate en el Fin del Mundo con Meru. Excursiones y turismo en Ushuaia.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Meru Viajes y Turismo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Meru Viajes y Turismo | Ushuaia",
    description:
      "Aventurate en el Fin del Mundo con Meru. Excursiones y turismo en Ushuaia.",
    images: ["/logo.png"],
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
