import type { Metadata } from "next";
import { Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

// ─── Fuentes ──────────────────────────────────────────────────────────────────

// Geist Mono: fuente mono general de la UI
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// JetBrains Mono: fuente principal del título KODA y elementos de código
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "KODA — Escribe código más rápido",
  description:
    "Practica con snippets reales de Python, TypeScript, JavaScript y más. Mide tu PPM, precisión e identifica tus teclas más débiles.",
};

// ─── Layout raíz ─────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-black text-white">
        {/* Navbar fija superior — presente en todas las páginas */}
        <Navbar />
        {children}
        {/* Toast notifications — posicionado arriba a la derecha */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0a0a0a',
              color: '#ffffff',
              border: '1px solid rgba(0,255,255,0.2)',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#00ffff', secondary: '#000000' },
            },
            error: {
              iconTheme: { primary: '#ff00ff', secondary: '#000000' },
            },
          }}
        />
      </body>
    </html>
  );
}
