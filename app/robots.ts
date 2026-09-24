import type { MetadataRoute } from "next";
import { getAppUrl } from "@/config/brand";

const appUrl = getAppUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/mi-cuenta/", "/api/", "/login", "/registro", "/recuperar-contrasena"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
