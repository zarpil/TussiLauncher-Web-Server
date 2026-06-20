import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Tussi Panel — Minecraft Server Admin",
  description: "Admin panel for Tussi Minecraft Launcher",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${outfit.variable} font-sans antialiased bg-nexus-bg text-nexus-text`}>
        {children}
      </body>
    </html>
  );
}
