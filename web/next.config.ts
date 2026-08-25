import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 exige une liste explicite de qualités autorisées.
    qualities: [60, 75, 90],
    dangerouslyAllowLocalIP: true,
    // Les visuels (produits, marques, bannières) sont servis par le backend Express
    // sous /uploads. On autorise uniquement ces chemins, en local (dev).
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "::1", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "192.168.1.104", port: "4000", pathname: "/uploads/**" },
      // Images de démonstration utilisées par le seed du catalogue.
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      // Images produits provenant du catalogue Omron.
      { protocol: "https", hostname: "omron-healthcare.com", pathname: "/**" },
      { protocol: "https", hostname: "www.omron-healthcare.com", pathname: "/**" },
      // Images produits Beurer hébergées sur Cloudinary.
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "www.beurer.com", pathname: "/**" },
      { protocol: "https", hostname: "pim.beurer.com", pathname: "/**" },
      { protocol: "https", hostname: "www.rossmax.com", pathname: "/**" },
    ],
  },
  // Autoriser l'accès depuis d'autres appareils sur le réseau local (téléphone, tablette)
  allowedDevOrigins: ["192.168.1.104", "http://192.168.1.104", "192.168.1.104:3000", "10.202.161.67"],
};

export default nextConfig;
