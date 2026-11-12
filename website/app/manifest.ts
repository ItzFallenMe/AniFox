import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AniFox",
    short_name: "AniFox",
    description: "Anime, movies and TV in one place.",
    start_url: "/home",
    display: "standalone",
    background_color: "#050506",
    theme_color: "#050506",
    icons: [
      { src: "/logo.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "1024x1024", type: "image/png", purpose: "maskable" },
    ],
  };
}
