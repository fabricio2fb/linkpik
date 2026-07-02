import type { Metadata } from "next";
import {
  Bebas_Neue,
  DM_Sans,
  Inter,
  Lora,
  Nunito,
  Oswald,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Syne,
} from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pik.bio"),
  title: {
    default: "Pikbio  Transforme sua bio em uma loja digital",
    template: "%s | Pikbio",
  },
  description:
    "Pikbio junta página de vendas, link na bio, checkout, upsell e entrega digital em uma experiência simples, bonita e pronta para converter seguidores em clientes.",
  keywords: [
    "link na bio",
    "loja na bio",
    "checkout mercado pago",
    "produtos digitais",
    "linktree brasileiro",
  ],
  icons: {
    icon: "/logo-pikbio.png",
    shortcut: "/logo-pikbio.png",
    apple: "/logo-pikbio.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Pikbio",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pikbio",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Plataforma brasileira que transforma sua bio em uma loja digital com link na bio, checkout, upsell e entrega de produtos digitais.",
  url: "https://pik.bio",
  logo: "https://pik.bio/logo-pikbio.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} ${dmSans.variable} ${playfair.variable} ${spaceGrotesk.variable} ${nunito.variable} ${syne.variable} ${inter.variable} ${oswald.variable} ${bebasNeue.variable} ${lora.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}


