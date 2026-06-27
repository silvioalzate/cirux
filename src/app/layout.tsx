import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeWrapper } from "@/components/providers/ThemeWrapper";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Cirux — Plataforma de Atención Inteligente para Cirugía Plástica",
  description:
    "Cirux automatiza la atención al paciente con IA omnicanal para consultorios y clínicas de cirugía plástica.",
};

/**
 * Root layout con fuentes de marca (Space Grotesk + Inter), ThemeProvider y Toaster global.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeWrapper>{children}</ThemeWrapper>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
