import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SearchModal from "@/components/SearchModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "El Ropero de Carlota | Moda Femenina en Archena",
    template: "%s | El Ropero de Carlota",
  },
  description:
    "Tu tienda de moda femenina en Archena, Murcia. Descubre las últimas tendencias en vestidos, tops, pantalones y accesorios.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "El Ropero de Carlota",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <Navbar />
        <CartDrawer />
        <SearchModal />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
