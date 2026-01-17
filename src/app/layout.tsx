import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SketchIt - AI-Powered Visual Thinking",
  description:
    "Your ideas, drawn at the speed of thought. Sketch freely, talk to your canvas, and watch AI transform your concepts into beautiful SVG diagrams instantly.",
  keywords: [
    "sketch",
    "AI",
    "drawing",
    "diagram",
    "SVG",
    "visual thinking",
    "whiteboard",
    "excalidraw",
  ],
  authors: [{ name: "SketchIt Team" }],
  creator: "SketchIt",
  publisher: "SketchIt",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "SketchIt - AI-Powered Visual Thinking",
    description:
      "Your ideas, drawn at the speed of thought. Sketch freely, talk to your canvas, and watch AI transform your concepts into beautiful SVG diagrams instantly.",
    type: "website",
    locale: "en_US",
    siteName: "SketchIt",
  },
  twitter: {
    card: "summary_large_image",
    title: "SketchIt - AI-Powered Visual Thinking",
    description:
      "Your ideas, drawn at the speed of thought. Sketch freely, talk to your canvas, and watch AI transform your concepts into beautiful SVG diagrams instantly.",
    creator: "@sketchit",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
