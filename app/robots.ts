import type { MetadataRoute } from "next";

const siteUrl = "https://velora.tha950130.workers.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/login",
        "/register",
        "/checkout/",
        "/order-confirmation",
        "/portal/",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
