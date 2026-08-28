import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestor Inteligente de Informes de Contratistas",
  description: "Tu trabajo ya dejó evidencia. Convierte correos, reuniones y documentos en un informe organizado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-brand-ivory text-brand-primary">{children}</body>
    </html>
  );
}
