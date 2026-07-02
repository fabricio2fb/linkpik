import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

const homeDescription =
  "Transforme sua bio em uma loja que vende sozinha. O Pikbio junta página de vendas, link na bio, checkout, upsell e entrega digital em uma experiência simples, bonita e pronta para converter seguidores em clientes.";

export const metadata: Metadata = {
  title: "Transforme sua bio em uma loja digital",
  description: homeDescription,
  openGraph: {
    title: "Pikbio  Transforme sua bio em uma loja digital",
    description: homeDescription,
    url: "https://pik.bio",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  return <LandingPage />;
}

